import { MigrationFormType } from '../migrationTypes';
import {
    ExtractedGroup,
    extractMetadataFromMatrixOrLines,
    parseTableMatrixToGroups,
} from './tableMatrixParser';

export const extractGroupsFromDocx = async (
    file: File,
    mammoth: any,
    tesseract: any,
    formType: MigrationFormType,
    onStatus?: (msg: string) => void,
): Promise<ExtractedGroup[]> => {
    const arrayBuffer = await file.arrayBuffer();
    onStatus?.('Extracting document content and tables from DOCX...');

    try {
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        const html = htmlResult.value || '';
        const parsedDoc = new DOMParser().parseFromString(html, 'text/html');

        // Extract metadata from document paragraphs
        const paragraphTexts = Array.from(parsedDoc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div'))
            .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
            .filter(Boolean);
        const docMetadata = extractMetadataFromMatrixOrLines(paragraphTexts);

        const tables = Array.from(parsedDoc.querySelectorAll('table'));
        const allGroups: ExtractedGroup[] = [];

        if (tables.length > 0) {
            tables.forEach((table, tIdx) => {
                const grid: string[][] = [];
                const rows = Array.from(table.querySelectorAll('tr'));

                rows.forEach((tr, rIdx) => {
                    if (!grid[rIdx]) grid[rIdx] = [];
                    let cIdx = 0;
                    const cells = Array.from(tr.querySelectorAll('th, td'));

                    cells.forEach((cell) => {
                        while (grid[rIdx][cIdx] !== undefined) {
                            cIdx++;
                        }
                        const text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
                        const colspan = parseInt(cell.getAttribute('colspan') || '1', 10) || 1;
                        const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10) || 1;

                        for (let r = 0; r < rowspan; r++) {
                            for (let c = 0; c < colspan; c++) {
                                if (!grid[rIdx + r]) grid[rIdx + r] = [];
                                grid[rIdx + r][cIdx + c] = (r === 0 && c === 0) ? text : '';
                            }
                        }
                        cIdx += colspan;
                    });
                });

                // Fill any undefined gaps in the grid
                for (let r = 0; r < grid.length; r++) {
                    if (!grid[r]) {
                        grid[r] = [];
                    } else {
                        for (let c = 0; c < grid[r].length; c++) {
                            if (grid[r][c] === undefined) grid[r][c] = '';
                        }
                    }
                }

                const sheetName = tables.length === 1 ? 'Word Table' : `Table ${tIdx + 1}`;
                const tableGroups = parseTableMatrixToGroups(grid, sheetName, formType, docMetadata);
                allGroups.push(...tableGroups);
            });
        }

        if (allGroups.length > 0) {
            return allGroups;
        }

        // Fallback: If no tables were detected, check raw text for tab-separated rows
        const rawResult = await mammoth.extractRawText({ arrayBuffer });
        const rawText = rawResult.value || '';
        const lines: string[] = rawText.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
        const meta = { ...docMetadata, ...extractMetadataFromMatrixOrLines(lines) };

        const matrix: string[][] = lines.map((l: string) => l.split('\t').map((c: string) => c.trim()));
        const fallbackGroups = parseTableMatrixToGroups(matrix, 'Word Document', formType, meta);
        if (fallbackGroups.length > 0) {
            return fallbackGroups;
        }

        // Fallback to OCR if document contains scanned images
        if (rawText.trim().length < 20) {
            onStatus?.('Scanning embedded DOCX images for OCR...');
            const imageSrcs: string[] = [];
            await mammoth.convertToHtml(
                { arrayBuffer },
                {
                    convertImage: (mammoth.images as any).inline((element: any) => {
                        return element.read('base64').then((imageBuffer: string) => {
                            const src = `data:${element.contentType};base64,${imageBuffer}`;
                            imageSrcs.push(src);
                            return { src };
                        });
                    }),
                },
            );

            if (imageSrcs.length > 0) {
                let ocrLines: string[] = [];
                for (let i = 0; i < imageSrcs.length; i += 1) {
                    onStatus?.(`Running OCR on image ${i + 1} of ${imageSrcs.length}...`);
                    try {
                        const res = await tesseract.recognize(imageSrcs[i], 'eng');
                        if (res?.data?.text?.trim()) {
                            ocrLines.push(...res.data.text.trim().split(/\r?\n/));
                        }
                    } catch (ocrErr) {
                        console.warn('OCR error on DOCX image:', ocrErr);
                    }
                }

                if (ocrLines.length > 0) {
                    const ocrMatrix: string[][] = ocrLines.map((l: string) => l.split('\t').map((c: string) => c.trim()));
                    const ocrMeta = extractMetadataFromMatrixOrLines(ocrLines);
                    return parseTableMatrixToGroups(ocrMatrix, 'OCR Extracted', formType, ocrMeta);
                }
            }
        }

        return [];
    } catch (err) {
        console.warn('DOCX extraction error:', err);
        return [];
    }
};

// Legacy signature support for backward compatibility if needed
export const extractTextFromDocx = async (
    file: File,
    mammoth: any,
    tesseract: any,
    onStatus?: (msg: string) => void,
): Promise<string> => {
    const groups = await extractGroupsFromDocx(file, mammoth, tesseract, 'RSMI', onStatus);
    return JSON.stringify({ isGroups: true, groups });
};
