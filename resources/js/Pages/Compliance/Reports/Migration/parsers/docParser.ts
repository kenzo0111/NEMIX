import { MigrationFormType } from '../migrationTypes';
import {
    ExtractedGroup,
    extractMetadataFromMatrixOrLines,
    parseTableMatrixToGroups,
} from './tableMatrixParser';

/**
 * Parses RTF text for tables and metadata
 */
const parseRtfToMatrix = (rtfText: string): { matrix: string[][]; metadata: Record<string, string> } => {
    const lines: string[] = [];
    // Basic RTF parser: clean control tags, find \cell and \row
    const rowChunks = rtfText.split(/\\row\b/);
    const matrix: string[][] = [];

    rowChunks.forEach((chunk) => {
        if (!chunk.includes('\\cell')) {
            // Might be a paragraph with metadata
            const cleanPara = chunk
                .replace(/\\[a-zA-Z0-9\-]+ ?/g, ' ')
                .replace(/[{}]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            if (cleanPara) lines.push(cleanPara);
            return;
        }

        const rawCells = chunk.split(/\\cell\b/);
        const rowCells: string[] = [];
        rawCells.forEach((c, idx) => {
            if (idx === rawCells.length - 1 && !c.trim()) return;
            const cleaned = c
                .replace(/\\[a-zA-Z0-9\-]+ ?/g, ' ')
                .replace(/[{}]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            rowCells.push(cleaned);
        });

        if (rowCells.some(Boolean)) {
            matrix.push(rowCells);
        }
    });

    const metadata = extractMetadataFromMatrixOrLines(lines);
    return { matrix, metadata };
};

/**
 * Extracts raw text and table cell marks from binary Word 97-2004 (.doc) files using CFB.
 */
const parseBinaryDocViaCfb = (
    arrayBuffer: ArrayBuffer,
    cfb: any,
): { matrix: string[][]; metadata: Record<string, string> } => {
    const parsedCfb = cfb.read(new Uint8Array(arrayBuffer), { type: 'array' });

    // Locate WordDocument stream
    const wordDocEntry =
        cfb.find(parsedCfb, '/WordDocument') ||
        cfb.find(parsedCfb, 'WordDocument') ||
        parsedCfb.FileIndex.find((f: any) => f.name === 'WordDocument' || f.name === '/WordDocument');

    if (!wordDocEntry || !wordDocEntry.content) {
        throw new Error('WordDocument stream not found in .doc file');
    }

    const wordDocBuffer = new Uint8Array(wordDocEntry.content);
    if (wordDocBuffer.length < 512) {
        throw new Error('Invalid Word document: header too short');
    }

    // Verify magic number 0xA5EC (little-endian: 0xEC, 0xA5)
    const magic = wordDocBuffer[0] | (wordDocBuffer[1] << 8);
    if (magic !== 0xA5EC) {
        throw new Error(`Invalid Word document magic number: 0x${magic.toString(16)}`);
    }

    // Check FIB flags at offset 0x000A to determine table stream (0Table or 1Table)
    const flags = wordDocBuffer[0x0A] | (wordDocBuffer[0x0B] << 8);
    const tableStreamName = (flags & 0x0200) !== 0 ? '1Table' : '0Table';

    const tableEntry =
        cfb.find(parsedCfb, `/${tableStreamName}`) ||
        cfb.find(parsedCfb, tableStreamName) ||
        parsedCfb.FileIndex.find((f: any) => f.name === tableStreamName || f.name === `/${tableStreamName}`);

    let fullText = '';

    if (tableEntry && tableEntry.content) {
        const tableBuffer = new Uint8Array(tableEntry.content);

        // Read fcClx (offset 0x01A2) and lcbClx (offset 0x01A6) from FIB
        const readUInt32 = (buf: Uint8Array, offset: number) => {
            return (
                (buf[offset] |
                    (buf[offset + 1] << 8) |
                    (buf[offset + 2] << 16) |
                    (buf[offset + 3] << 24)) >>>
                0
            );
        };

        const fcClx = readUInt32(wordDocBuffer, 0x01A2);
        const lcbClx = readUInt32(wordDocBuffer, 0x01A6);

        if (fcClx > 0 && lcbClx > 0 && fcClx < tableBuffer.length) {
            let pos = fcClx;

            // Iterate SPRMs (flag === 1) until reaching the piece table (flag === 2)
            while (pos < tableBuffer.length) {
                const flag = tableBuffer[pos];
                if (flag !== 1) break;
                pos++;
                const skip = tableBuffer[pos] | (tableBuffer[pos + 1] << 8);
                pos += 2 + skip;
            }

            if (pos < tableBuffer.length && tableBuffer[pos] === 2) {
                pos++;
                const pieceTableSize = readUInt32(tableBuffer, pos);
                pos += 4;
                const pieceCount = Math.floor((pieceTableSize - 4) / 12);

                const pcdStart = pos + (pieceCount + 1) * 4;

                for (let i = 0; i < pieceCount; i++) {
                    const cpStart = readUInt32(tableBuffer, pos + i * 4);
                    const cpEnd = readUInt32(tableBuffer, pos + (i + 1) * 4);
                    const charCount = cpEnd - cpStart;

                    const pcdOffset = pcdStart + i * 8 + 2;
                    if (pcdOffset + 4 > tableBuffer.length) break;

                    const fc = readUInt32(tableBuffer, pcdOffset);
                    const isUnicode = (fc & 0x40000000) === 0;

                    if (!isUnicode) {
                        const byteOffset = (fc & ~0x40000000) >>> 1;
                        for (let c = 0; c < charCount && byteOffset + c < wordDocBuffer.length; c++) {
                            const b = wordDocBuffer[byteOffset + c];
                            fullText += String.fromCharCode(b);
                        }
                    } else {
                        const byteOffset = fc;
                        for (let c = 0; c < charCount && byteOffset + c * 2 + 1 < wordDocBuffer.length; c++) {
                            const code = wordDocBuffer[byteOffset + c * 2] | (wordDocBuffer[byteOffset + c * 2 + 1] << 8);
                            fullText += String.fromCharCode(code);
                        }
                    }
                }
            }
        }
    }

    // Fallback: If piece table extraction yielded no text, scan WordDocument for contiguous text
    if (!fullText.trim()) {
        const fcMin = (wordDocBuffer[0x18] | (wordDocBuffer[0x19] << 8) | (wordDocBuffer[0x1A] << 16) | (wordDocBuffer[0x1B] << 24)) >>> 0;
        const ccpText = (wordDocBuffer[0x4C] | (wordDocBuffer[0x4D] << 8) | (wordDocBuffer[0x4E] << 16) | (wordDocBuffer[0x4F] << 24)) >>> 0;

        if (fcMin > 0 && ccpText > 0 && fcMin + ccpText <= wordDocBuffer.length) {
            for (let c = 0; c < ccpText; c++) {
                fullText += String.fromCharCode(wordDocBuffer[fcMin + c]);
            }
        }
    }

    // Parse the extracted text into table rows and metadata
    // In Word 97-2004 text:
    // \x07 (ASCII 7) is the table cell delimiter.
    // \r or \r\n or \x07\r is row/paragraph delimiter.
    const cleaned = fullText.replace(/[\x00-\x06\x08\x0B\x0E-\x1F]/g, '');
    const rawLines = cleaned.split(/\r?\n|\r|\x0C/);

    const matrix: string[][] = [];
    const metaLines: string[] = [];

    rawLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (line.includes('\x07')) {
            const cells = line
                .split('\x07')
                .map((c) => c.replace(/\s+/g, ' ').trim());
            // Filter trailing empty cell if present
            while (cells.length > 0 && !cells[cells.length - 1]) {
                cells.pop();
            }
            if (cells.some(Boolean)) {
                matrix.push(cells);
            }
        } else if (line.includes('\t')) {
            const cells = line.split('\t').map((c) => c.replace(/\s+/g, ' ').trim());
            if (cells.some(Boolean)) {
                matrix.push(cells);
            }
        } else {
            metaLines.push(trimmed);
        }
    });

    const metadata = extractMetadataFromMatrixOrLines(metaLines);
    return { matrix, metadata };
};

export const extractGroupsFromDoc = async (
    file: File,
    cfb: any,
    formType: MigrationFormType,
    onStatus?: (msg: string) => void,
): Promise<ExtractedGroup[]> => {
    const arrayBuffer = await file.arrayBuffer();
    onStatus?.('Extracting document content and tables from Word (.doc)...');

    const bytes = new Uint8Array(arrayBuffer);
    const isCFBF =
        bytes.length >= 8 &&
        bytes[0] === 0xD0 &&
        bytes[1] === 0xCF &&
        bytes[2] === 0x11 &&
        bytes[3] === 0xE0;

    try {
        if (!isCFBF) {
            // Check if it is an HTML, XML, or RTF document saved with .doc extension
            const textContent = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);

            if (textContent.includes('<html') || textContent.includes('<table') || textContent.includes('<?xml')) {
                onStatus?.('Parsing HTML/XML formatted Word (.doc) tables...');
                const parsedDoc = new DOMParser().parseFromString(textContent, 'text/html');

                const paragraphTexts = Array.from(parsedDoc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div'))
                    .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
                    .filter(Boolean);
                const docMetadata = extractMetadataFromMatrixOrLines(paragraphTexts);

                const tables = Array.from(parsedDoc.querySelectorAll('table'));
                const allGroups: ExtractedGroup[] = [];

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

                    for (let r = 0; r < grid.length; r++) {
                        if (!grid[r]) {
                            grid[r] = [];
                        } else {
                            for (let c = 0; c < grid[r].length; c++) {
                                if (grid[r][c] === undefined) grid[r][c] = '';
                            }
                        }
                    }

                    const sheetName = tables.length === 1 ? 'Word Document' : `Table ${tIdx + 1}`;
                    const tableGroups = parseTableMatrixToGroups(grid, sheetName, formType, docMetadata);
                    allGroups.push(...tableGroups);
                });

                if (allGroups.length > 0) {
                    return allGroups;
                }
            }

            if (textContent.startsWith('{\\rtf')) {
                onStatus?.('Parsing RTF formatted Word (.doc) tables...');
                const { matrix, metadata } = parseRtfToMatrix(textContent);
                return parseTableMatrixToGroups(matrix, 'Word Document', formType, metadata);
            }
        }

        // Binary Compound Document (CFBF) Word 97-2004
        onStatus?.('Parsing binary Word 97-2004 (.doc) tables and fields...');
        const { matrix, metadata } = parseBinaryDocViaCfb(arrayBuffer, cfb);
        if (matrix.length > 0) {
            return parseTableMatrixToGroups(matrix, 'Word Document (.doc)', formType, metadata);
        }

        return [];
    } catch (err) {
        console.warn('Word .doc parsing error:', err);
        return [];
    }
};
