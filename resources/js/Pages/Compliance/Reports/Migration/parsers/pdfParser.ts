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

            // Find Table Header Row
            let headerLineIdx = -1;
            let maxMatches = 0;

            for (let i = 0; i < Math.min(lines.length, 60); i++) {
                const line = lines[i];
                const lineText = line.chunks.map((c) => c.text.toLowerCase()).join(' ');

                // Skip report title/instructions
                if (
                    lineText.includes('report of supplies') ||
                    lineText.includes('report on the physical count') ||
                    lineText.includes('appendix') ||
                    lineText.includes('recapitulation')
                ) {
                    continue;
                }

                const matchedKwSet = new Set<string>();
                line.chunks.forEach((chunk) => {
                    const txt = chunk.text.toLowerCase();
                    targetKeywords.forEach((kw) => {
                        if (txt.includes(kw)) matchedKwSet.add(kw);
                    });
                });

                if (matchedKwSet.size >= 3 && matchedKwSet.size > maxMatches) {
                    maxMatches = matchedKwSet.size;
                    headerLineIdx = i;
                    if (matchedKwSet.size >= 4) break;
                }
            }

            if (headerLineIdx === -1) {
                // Try with 2 keywords
                for (let i = 0; i < Math.min(lines.length, 60); i++) {
                    const line = lines[i];
                    const matchedKwSet = new Set<string>();
                    line.chunks.forEach((chunk) => {
                        const txt = chunk.text.toLowerCase();
                        targetKeywords.forEach((kw) => {
                            if (txt.includes(kw)) matchedKwSet.add(kw);
                        });
                    });
                    if (matchedKwSet.size >= 2) {
                        headerLineIdx = i;
                        break;
                    }
                }
            }

            // Extract metadata from lines before the header row
            const metaLines = (headerLineIdx >= 0 ? lines.slice(0, headerLineIdx) : lines)
                .map((l) => l.chunks.map((c) => c.text).join(' '));
            const pageMetadata = extractMetadataFromMatrixOrLines(metaLines);

            if (headerLineIdx === -1) {
                // No clear tabular header found; fallback to line-by-line tab matrix
                const matrix = lines.map((l) => l.chunks.map((c) => c.text));
                const pageGroups = parseTableMatrixToGroups(matrix, `Page ${pageIndex}`, formType, pageMetadata);
                allGroups.push(...pageGroups);
                continue;
            }

            // Header line found! Define column boundaries based on header chunk positions
            const headerLine = lines[headerLineIdx];
            const nextLine = lines[headerLineIdx + 1];

            interface ColumnDef {
                name: string;
                xLeft: number;
                xRight: number;
            }

            let columns: ColumnDef[] = headerLine.chunks.map((c) => ({
                name: c.text,
                xLeft: c.xLeft,
                xRight: c.xRight,
            }));

            let dataStartIdx = headerLineIdx + 1;

            // Merge sub-headers from next line if it contains matching sub-headers
            if (nextLine) {
                const nextLineText = nextLine.chunks.map((c) => c.text.toLowerCase()).join(' ');
                if (
                    !/^\s*\(\s*\d+\s*\)\s*$/.test(nextLineText) &&
                    (nextLineText.includes('issued') ||
                        nextLineText.includes('cost') ||
                        nextLineText.includes('value') ||
                        nextLineText.includes('amount') ||
                        nextLineText.includes('code') ||
                        nextLineText.includes('office') ||
                        nextLineText.includes('desc'))
                ) {
                    nextLine.chunks.forEach((subChunk) => {
                        const subCenter = (subChunk.xLeft + subChunk.xRight) / 2;
                        const matchingCol = columns.find(
                            (col) => subCenter >= col.xLeft - 10 && subCenter <= col.xRight + 10,
                        );
                        if (matchingCol) {
                            matchingCol.name = `${matchingCol.name} ${subChunk.text}`.trim();
                            matchingCol.xLeft = Math.min(matchingCol.xLeft, subChunk.xLeft);
                            matchingCol.xRight = Math.max(matchingCol.xRight, subChunk.xRight);
                        }
                    });
                    dataStartIdx = headerLineIdx + 2;
                } else if (/^\s*\(\s*\d+\s*\)\s*/.test(nextLineText)) {
                    dataStartIdx = headerLineIdx + 2;
                }
            }

            // Calculate boundaries between columns
            const columnCuts: number[] = [];
            for (let c = 0; c < columns.length - 1; c++) {
                const rightEdge = columns[c].xRight;
                const nextLeftEdge = columns[c + 1].xLeft;
                const cut = (rightEdge + nextLeftEdge) / 2;
                columnCuts.push(cut);
            }

            // Build table matrix
            const matrix: string[][] = [];
            // Header row in matrix
            matrix.push(columns.map((c) => c.name));

            for (let i = dataStartIdx; i < lines.length; i++) {
                const line = lines[i];
                const fullText = line.chunks.map((c) => c.text.toLowerCase()).join(' ');

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

                if (line.chunks.length === 0) continue;

                // Place each chunk in this line into the appropriate column
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
            }

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
