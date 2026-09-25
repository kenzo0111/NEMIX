import { MigrationFormType } from '../migrationTypes';
import {
    ExtractedGroup,
    extractMetadataFromMatrixOrLines,
    getTargetKeywordsForForm,
    parseTableMatrixToGroups,
} from './tableMatrixParser';

interface PositionedItem {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    xRight: number;
}

interface MergedChunk {
    text: string;
    xLeft: number;
    xRight: number;
    y: number;
}

interface LineCluster {
    y: number;
    chunks: MergedChunk[];
}

export const extractGroupsFromPdf = async (
    file: File,
    pdfjs: any,
    tesseract: any,
    formType: MigrationFormType,
    onStatus?: (msg: string) => void,
): Promise<ExtractedGroup[]> => {
    const arrayBuffer = await file.arrayBuffer();

    try {
        onStatus?.('Reading PDF pages and layout structures...');
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const allGroups: ExtractedGroup[] = [];
        const targetKeywords = getTargetKeywordsForForm(formType);

        for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
            onStatus?.(`Reading PDF table layout (page ${pageIndex}/${pdf.numPages})...`);
            const page = await pdf.getPage(pageIndex);
            const textContent = await page.getTextContent();

            const items: PositionedItem[] = textContent.items
                .filter((item: any) => 'str' in item && String(item.str || '').trim())
                .map((item: any) => {
                    const text = String(item.str || '').trim();
                    const x = Number(item.transform?.[4] || 0);
                    const y = Number(item.transform?.[5] || 0);
                    const width = Number(item.width || 0);
                    const height = Number(item.height || 0);
                    return {
                        text,
                        x,
                        y,
                        width,
                        height,
                        xRight: x + (width > 0 ? width : text.length * 6),
                    };
                });

            // Group into horizontal text lines based on Y coordinate (Y descending: top to bottom)
            items.sort((a, b) => b.y - a.y || a.x - b.x);

            const lines: LineCluster[] = [];
            items.forEach((item) => {
                let line = lines.find((l) => Math.abs(l.y - item.y) <= 3.5);
                if (!line) {
                    line = { y: item.y, chunks: [] };
                    lines.push(line);
                }
                // Add as chunk
                line.chunks.push({
                    text: item.text,
                    xLeft: item.x,
                    xRight: item.xRight,
                    y: item.y,
                });
            });

            // Sort lines top-to-bottom
            lines.sort((a, b) => b.y - a.y);

            // Within each line, merge adjacent words that are part of the same text run/cell
            lines.forEach((line) => {
                line.chunks.sort((a, b) => a.xLeft - b.xLeft);
                const merged: MergedChunk[] = [];

                line.chunks.forEach((chunk) => {
                    if (merged.length === 0) {
                        merged.push({ ...chunk });
                        return;
                    }
                    const prev = merged[merged.length - 1];
                    const gap = chunk.xLeft - prev.xRight;

                    // If gap is small (< 8 points), merge into same text chunk
                    if (gap < 8 && gap >= -2) {
                        prev.text = `${prev.text} ${chunk.text}`.trim();
                        prev.xRight = Math.max(prev.xRight, chunk.xRight);
                    } else {
                        merged.push({ ...chunk });
                    }
                });

                line.chunks = merged;
            });

            // If direct text extraction yields empty/minimal text (scanned PDF page), run Tesseract OCR
            const totalText = lines.map((l) => l.chunks.map((c) => c.text).join(' ')).join('\n');
            if (totalText.trim().length < 20) {
                onStatus?.(`Running OCR character recognition on PDF page ${pageIndex} of ${pdf.numPages}...`);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: context, viewport, canvas } as any).promise;

                    try {
                        const res = await tesseract.recognize(canvas, 'eng');
                        if (res?.data?.text?.trim()) {
                            const ocrLines = res.data.text.trim().split(/\r?\n/).filter(Boolean);
                            const ocrMatrix = ocrLines.map((l: string) => l.split('\t').map((c) => c.trim()));
                            const ocrMeta = extractMetadataFromMatrixOrLines(ocrLines);
                            const pageGroups = parseTableMatrixToGroups(
                                ocrMatrix,
                                `Page ${pageIndex} (OCR)`,
                                formType,
                                ocrMeta,
                            );
                            allGroups.push(...pageGroups);
                            continue;
                        }
                    } catch (ocrErr) {
                        console.warn(`OCR failed on PDF page ${pageIndex}:`, ocrErr);
                    }
                }
            }

            // Find Table Header Row Band (handles multi-line headers such as Responsibility Center Code and Quantity Issued)
            const candidateIndices: Array<{ idx: number; y: number; kwMatches: number; text: string }> = [];
            for (let i = 0; i < Math.min(lines.length, 60); i++) {
                const line = lines[i];
                const lineText = line.chunks.map((c) => c.text.toLowerCase()).join(' ');

                // Skip report title/instructions
                if (
                    lineText.includes('report of supplies') ||
                    lineText.includes('report on the physical count') ||
                    lineText.includes('appendix') ||
                    lineText.includes('entity name') ||
                    lineText.includes('fund cluster') ||
                    lineText.includes('recapitulation')
                ) {
                    continue;
                }

                let kwMatches = 0;
                line.chunks.forEach((chunk) => {
                    const txt = chunk.text.toLowerCase();
                    if (targetKeywords.some((kw) => txt.includes(kw))) kwMatches++;
                });

                if (kwMatches >= 1) {
                    candidateIndices.push({ idx: i, y: line.y, kwMatches, text: lineText });
                }
            }

            let bestBand: typeof candidateIndices = [];
            let bestBandMatches = 0;
            candidateIndices.forEach((cand) => {
                const band = candidateIndices.filter((c) => {
                    if (Math.abs(c.y - cand.y) > 12) return false;
                    if (c.text.includes('to be filled up')) return false;
                    return true;
                });
                const totalMatches = band.reduce((sum, c) => sum + c.kwMatches, 0);
                if (totalMatches > bestBandMatches) {
                    bestBandMatches = totalMatches;
                    bestBand = band;
                }
            });

            if (bestBand.length === 0 || bestBandMatches < 2) {
                // Fallback to tab matrix if no valid table header found
                const meta = extractMetadataFromMatrixOrLines(lines.map((l) => l.chunks.map((c) => c.text).join(' ')));
                const matrix = lines.map((l) => l.chunks.map((c) => c.text));
                const pageGroups = parseTableMatrixToGroups(matrix, `Page ${pageIndex}`, formType, meta);
                allGroups.push(...pageGroups);
                continue;
            }

            const headerLines = bestBand.map((b) => lines[b.idx]);
            const minHeaderY = Math.min(...bestBand.map((b) => b.y));
            const allHeaderChunks = headerLines.flatMap((l) => l.chunks);
            allHeaderChunks.sort((a, b) => b.y - a.y || a.xLeft - b.xLeft);

            interface ColumnDef {
                name: string;
                xLeft: number;
                xRight: number;
                chunks: MergedChunk[];
            }

            // Cluster header chunks horizontally by X overlap or proximity
            const columns: ColumnDef[] = [];
            allHeaderChunks.forEach((chunk) => {
                const chunkCenter = (chunk.xLeft + chunk.xRight) / 2;
                const matched = columns.find((col) => {
                    const colCenter = (col.xLeft + col.xRight) / 2;
                    return (
                        (chunk.xLeft <= col.xRight + 12 && chunk.xRight >= col.xLeft - 12) ||
                        Math.abs(chunkCenter - colCenter) <= 25
                    );
                });

                if (matched) {
                    matched.chunks.push(chunk);
                    matched.xLeft = Math.min(matched.xLeft, chunk.xLeft);
                    matched.xRight = Math.max(matched.xRight, chunk.xRight);
                } else {
                    columns.push({
                        name: chunk.text,
                        xLeft: chunk.xLeft,
                        xRight: chunk.xRight,
                        chunks: [chunk],
                    });
                }
            });

            columns.sort((a, b) => a.xLeft - b.xLeft);
            columns.forEach((col) => {
                col.chunks.sort((a, b) => b.y - a.y || a.xLeft - b.xLeft);
                col.name = col.chunks.map((c) => c.text).join(' ').trim();
            });

            // Extract metadata strictly from lines above the header band
            const metaLines = lines
                .filter((l) => l.y > minHeaderY + 12)
                .map((l) => l.chunks.map((c) => c.text).join(' '));
            const pageMetadata = extractMetadataFromMatrixOrLines(metaLines);

            // Filter table body data lines (strictly below header band)
            const bodyLines: LineCluster[] = [];
            for (const l of lines) {
                if (l.y >= minHeaderY - 2) continue;
                const fullText = l.chunks.map((c) => c.text.toLowerCase()).join(' ');

                // Stop immediately at Recapitulation or Certification Signatures
                if (
                    fullText.includes('recapitulation') ||
                    fullText.includes('recap') ||
                    fullText.includes('to be filled up by') ||
                    fullText.includes('certified correct') ||
                    fullText.includes('posted by') ||
                    fullText.includes('approved by') ||
                    fullText.includes('i hereby certif')
                ) {
                    break;
                }

                // Skip column numbering row e.g. (1) (2) (3)...
                if (/^\s*(\(\s*\d+\s*\)\s*)+$/.test(fullText)) {
                    continue;
                }

                if (l.chunks.length > 0) {
                    bodyLines.push(l);
                }
            }

            // Calculate initial boundaries between columns
            const columnCuts: number[] = [];
            for (let c = 0; c < columns.length - 1; c++) {
                columnCuts.push((columns[c].xRight + columns[c + 1].xLeft) / 2);
            }

            // Adaptive refinement: fine-tune cuts where header is centered but data starts earlier
            // (e.g. between Stock No. and Item Description)
            for (let c = 0; c < columns.length - 1; c++) {
                const c1Name = columns[c].name.toLowerCase();
                const c2Name = columns[c + 1].name.toLowerCase();

                if (
                    c1Name.includes('stock') &&
                    (c2Name.includes('item') || c2Name.includes('desc') || c2Name.includes('article'))
                ) {
                    let maxColC = columns[c].xRight;
                    let minColNext = columns[c + 1].xLeft;

                    bodyLines.forEach((l) => {
                        l.chunks.forEach((chunk) => {
                            const center = (chunk.xLeft + chunk.xRight) / 2;
                            if (center > columns[c].xLeft && center < columns[c].xRight + 40) {
                                if (chunk.xRight > maxColC && chunk.xRight < columns[c + 1].xRight) {
                                    maxColC = chunk.xRight;
                                }
                            }
                            if (center > maxColC && center < columns[c + 1].xRight + 30) {
                                if (chunk.xLeft < minColNext && chunk.xLeft > maxColC) {
                                    minColNext = chunk.xLeft;
                                }
                            }
                        });
                    });

                    if (minColNext > maxColC) {
                        columnCuts[c] = (maxColC + minColNext) / 2;
                    }
                }
            }

            // Build table matrix
            const matrix: string[][] = [];
            matrix.push(columns.map((c) => c.name));

            bodyLines.forEach((line) => {
                const rowCells = Array(columns.length).fill('');
                line.chunks.forEach((chunk) => {
                    const center = (chunk.xLeft + chunk.xRight) / 2;
                    let targetCol = 0;
                    while (targetCol < columnCuts.length && center > columnCuts[targetCol]) {
                        targetCol++;
                    }

                    if (targetCol < rowCells.length) {
                        rowCells[targetCol] = rowCells[targetCol]
                            ? `${rowCells[targetCol]} ${chunk.text}`.trim()
                            : chunk.text;
                    }
                });

                if (rowCells.some((c) => c.trim())) {
                    matrix.push(rowCells);
                }
            });

            const sheetName = pdf.numPages === 1 ? 'PDF Document' : `Page ${pageIndex}`;
            const pageGroups = parseTableMatrixToGroups(matrix, sheetName, formType, pageMetadata);
            allGroups.push(...pageGroups);
        }

        return allGroups;
    } catch (error) {
        console.warn('PDF table extraction error:', error);
        return [];
    }
};

// Legacy signature for backward compatibility
export const extractTextFromPdf = async (
    file: File,
    pdfjs: any,
    tesseract: any,
    onStatus?: (msg: string) => void,
): Promise<string> => {
    const groups = await extractGroupsFromPdf(file, pdfjs, tesseract, 'RSMI', onStatus);
    return JSON.stringify({ isGroups: true, groups });
};
