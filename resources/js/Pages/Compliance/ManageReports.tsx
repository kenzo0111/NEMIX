import SystemModeBadge from '@/Components/SystemModeBadge';
import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Modal from '@/Components/Modal';
import { Head, router, usePage } from '@inertiajs/react';
import { Suspense, lazy, useEffect, useRef, useState, type ChangeEvent } from 'react';
import Select from 'react-select';
import { getSidebarModules } from '@/utils/sidebarConfig';

let xlsxModule: typeof import('xlsx') | null = null;
let mammothModule: typeof import('mammoth') | null = null;
let pdfjsModule: typeof import('pdfjs-dist/legacy/build/pdf.mjs') | null = null;
let tesseractModule: typeof import('tesseract.js') | null = null;

const loadDocumentParsers = async () => {
    if (!xlsxModule) {
        xlsxModule = await import('xlsx');
    }

    if (!mammothModule) {
        mammothModule = await import('mammoth');
    }

    if (!pdfjsModule) {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
        pdfjsModule = pdfjs;
    }

    if (!tesseractModule) {
        tesseractModule = await import('tesseract.js');
    }

    return { xlsx: xlsxModule, mammoth: mammothModule, pdfjs: pdfjsModule, tesseract: tesseractModule };
};

const RSMIFormPaper = lazy(() =>
    import('../../../Official Forms/RSMI Report').then((module) => ({
        default: module.RSMIFormPaper,
    })),
);

const RPCIFormPaper = lazy(() =>
    import('../../../Official Forms/RPCI Report').then((module) => ({
        default: module.ReportPhysicalCount,
    })),
);

const StockCardFormPaper = lazy(() =>
    import('../../../Official Forms/Stock Card Report').then((module) => ({
        default: module.StockCard,
    })),
);

const MRFormPaper = lazy(() =>
    import('../../../Official Forms/MRForm').then((module) => ({
        default: module.MRFormPaper,
    })),
);

const reportTemplateFallback = (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/80 p-12 text-sm font-medium text-gray-500 print:hidden">
        Loading report template...
    </div>
);

// --- REUSABLE UI COMPONENTS ---
const ReportModal = ({ show, onClose, title, children, footer, isSubmitting, isLandscape }: any) => {
    return (
        <Modal
            show={show}
            onClose={() => !isSubmitting && onClose()}
            maxWidth={isLandscape ? '7xl' : '5xl'}
            closeable={!isSubmitting}
        >
            <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl print:max-h-none print:shadow-none print:block print:m-0 print:p-0">
                <div className="h-2 w-full flex-shrink-0 bg-gradient-to-r from-red-900 via-red-800 to-red-950 rounded-t-2xl print:hidden"></div>
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
                            <p className="text-xs text-gray-500 font-medium">COA Compliance Reporting Module</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 print:p-0 print:overflow-visible">
                    {children}
                </div>

                {footer && (
                    <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0 rounded-b-2xl print:hidden">
                        {footer}
                    </div>
                )}
            </div>
        </Modal>
    );
};

const FormInput = ({ label, icon, error, ...props }: any) => (
    <div className="group w-full">
        {label && <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">{label}</label>}
        <div className="relative">
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                    {icon}
                </div>
            )}
            <input
                {...props}
                className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
            />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{error}</p>}
    </div>
);

// --- MAIN COMPONENT ---
export default function ManageReports({ auth, items = [], reports: serverReports = [], issuances = [], suppliers = [], migratedRecords = [] }: { auth: any, items?: any[], reports?: any[], issuances?: any[], suppliers?: any[], migratedRecords?: any[] }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showMigrationModal, setShowMigrationModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'view'>('create');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const reportContentRef = useRef<HTMLDivElement | null>(null);
    const [migrationFormType, setMigrationFormType] = useState<'RSMI' | 'RPCI' | 'STOCK_CARD' | 'MR' | 'MOR'>('RSMI');
    const [migrationSource, setMigrationSource] = useState('');
    const [migrationInputText, setMigrationInputText] = useState('');
    const [migrationFileName, setMigrationFileName] = useState('');
    const [migrationPreview, setMigrationPreview] = useState<any[]>([]);
    const [migrationValidation, setMigrationValidation] = useState({ validCount: 0, invalidCount: 0, duplicateCount: 0 });
    const [migrationSubmitting, setMigrationSubmitting] = useState(false);
    const [isExtractingFile, setIsExtractingFile] = useState(false);
    const [ocrStatus, setOcrStatus] = useState('');
    const migrationPreviewRef = useRef<HTMLDivElement | null>(null);

    // Dialog state for user actions
    const [actionDialog, setActionDialog] = useState<{
        show: boolean;
        type: 'success' | 'confirm' | 'error';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ show: false, type: 'success', title: '', message: '' });

    const closeActionDialog = () => setActionDialog(prev => ({ ...prev, show: false }));

    const parseWorkbookToGroups = (workbook: any, formType: string, xlsx: any) => {
        const groups: any[] = [];
        const isMatchKeyword = (cellVal: any, keywords: string[]) => {
            const str = String(cellVal || '').toLowerCase().trim();
            return keywords.some(kw => str.includes(kw));
        };

        let targetKeywords: string[] = [];
        if (formType === 'RSMI') {
            targetKeywords = ['ris', 'item', 'stock', 'quantity', 'qty', 'issued', 'unit cost', 'amount', 'responsibility', 'center code'];
        } else if (formType === 'RPCI') {
            targetKeywords = ['article', 'description', 'stock', 'property', 'unit', 'unit value', 'balance', 'hand', 'shortage', 'remarks'];
        } else if (formType === 'MR' || formType === 'MOR') {
            targetKeywords = ['qty', 'quantity', 'unit', 'description', 'item', 'property', 'serial', 'mr no', 'acquired', 'value', 'cost'];
        } else {
            targetKeywords = ['date', 'reference', 'receipt', 'issue', 'balance', 'consume', 'office'];
        }

        workbook.SheetNames.forEach((sheetName: string) => {
            const worksheet = workbook.Sheets[sheetName];
            const matrix: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
            if (!matrix || matrix.length === 0) return;

            let r = 0;
            while (r < matrix.length) {
                let headerRowIdx = -1;
                let maxMatches = 0;
                let currentMetadata: Record<string, string> = {};

                const scanLimit = Math.min(r + 50, matrix.length);
                let foundHeader = false;
                for (let sr = r; sr < scanLimit; sr++) {
                    const row = matrix[sr];
                    if (!Array.isArray(row)) continue;

                    const rowStr = row.map(c => String(c || '').toLowerCase().trim()).join(' ');
                    if (rowStr.includes('to be filled up by') || rowStr.includes('recapitulation')) {
                        continue;
                    }

                    for (let c = 0; c < row.length; c++) {
                        const cellStr = String(row[c] || '').trim();
                        if (!cellStr) continue;

                        const extractLabelVal = (pattern: RegExp) => {
                            if (pattern.test(cellStr)) {
                                const clean = cellStr.replace(pattern, '').replace(/^[:\-\s]+/, '').trim();
                                if (clean) return clean;
                                for (let nc = c + 1; nc < Math.min(c + 5, row.length); nc++) {
                                    const nextCell = String(row[nc] || '').trim();
                                    if (nextCell && !/entity|fund|serial|date|officer|custodian|division/i.test(nextCell)) {
                                        return nextCell;
                                    }
                                }
                            }
                            return '';
                        };

                        const entityVal = extractLabelVal(/entity\s*name/i);
                        if (entityVal) currentMetadata['entityName'] = entityVal;

                        const fundVal = extractLabelVal(/fund\s*cluster/i);
                        if (fundVal) currentMetadata['fundCluster'] = fundVal;

                        const serialVal = extractLabelVal(/(?:serial|mr|ris|doc|property)\s*no\.?/i);
                        if (serialVal && !/^(center\s*code|resp|responsibility|entity|fund|date|page|sheet|division)/i.test(serialVal)) {
                            currentMetadata['topSerialNo'] = serialVal;
                        }

                        const dateVal = extractLabelVal(/(?:as\s*at\s*date|date\s*issued|date\s*:)/i);
                        if (dateVal) currentMetadata['topDate'] = dateVal;

                        const recipVal = extractLabelVal(/(?:accountable\s*officer|property\s*custodian|received\s*by)/i);
                        if (recipVal) currentMetadata['topRecipient'] = recipVal;

                        const officeVal = extractLabelVal(/(?:office|department)\s*[:\-]/i);
                        if (officeVal) currentMetadata['topOffice'] = officeVal;
                    }

                    let matches = 0;
                    row.forEach(cell => {
                        if (isMatchKeyword(cell, targetKeywords)) matches++;
                    });

                    if (matches >= 2 && matches > maxMatches) {
                        maxMatches = matches;
                        headerRowIdx = sr;
                        if (matches >= 4) foundHeader = true;
                    }
                    if (foundHeader && headerRowIdx !== -1) break;
                }

                if (headerRowIdx === -1) break;

                r = headerRowIdx;
                const rawHeaders = matrix[headerRowIdx] || [];
                const nextRow = matrix[headerRowIdx + 1] || [];
                let actualDataStart = headerRowIdx + 1;

                const headers: string[] = [];
                rawHeaders.forEach((hCell, cIdx) => {
                    let hName = String(hCell || '').replace(/\r?\n/g, ' ').trim();
                    const subName = String(nextRow[cIdx] || '').replace(/\r?\n/g, ' ').trim();
                    // Do not append footnote number indicators like (1), (2), (6) to the header name
                    if (subName && !/^\s*\(\s*\d+\s*\)\s*$/.test(subName)) {
                        if (/quantity|value|cost|office|amount|desc|article|unit/i.test(subName)) {
                            hName = hName ? `${hName} ${subName}` : subName;
                        }
                    }
                    headers[cIdx] = hName;
                });

                if (nextRow.some(cell => /^\s*\(\s*\d+\s*\)\s*$/.test(String(cell || '').trim()))) {
                    actualDataStart = headerRowIdx + 2;
                }

                r = actualDataStart;
                const resultRows: any[] = [];
                let hitRecapOrFooter = false;
                
                while (r < matrix.length) {
                    const row = matrix[r];
                    if (!Array.isArray(row)) { r++; continue; }

                    const fullRowStr = row.map(c => String(c || '').toLowerCase().trim()).join(' ');

                    if (
                        fullRowStr.includes('recapitulation') ||
                        fullRowStr.includes('recap') ||
                        fullRowStr.includes('to be filled up by the accounting') ||
                        fullRowStr.includes('certified correct') ||
                        fullRowStr.includes('posted by') ||
                        fullRowStr.includes('approved by') ||
                        fullRowStr.includes('i hereby certify')
                    ) {
                        hitRecapOrFooter = true;
                        r++;
                        break;
                    }

                    if (fullRowStr.includes('report of supplies') || fullRowStr.includes('report of physical count') || fullRowStr.includes('stock card') || fullRowStr.includes('appendix 64') || fullRowStr.includes('appendix 66')) {
                        break;
                    }

                    if (row.every(cell => String(cell || '').trim() === '')) {
                        r++; continue;
                    }

                    const firstCellStr = String(row[0] || '').toLowerCase().trim();
                    if (firstCellStr.includes('total') || firstCellStr === 'grand total') {
                        r++; continue;
                    }

                    const rowObj: Record<string, any> = {};
                    let hasContent = false;

                    headers.forEach((hName, cIdx) => {
                        const cellVal = row[cIdx] !== undefined ? row[cIdx] : '';
                        if (hName) rowObj[hName] = cellVal;
                        else rowObj[`__col_${cIdx}`] = cellVal;
                        if (String(cellVal).trim()) hasContent = true;
                    });

                    if (hasContent) resultRows.push(rowObj);
                    r++;
                }

                if (resultRows.length > 0) {
                    groups.push({
                        sheetName,
                        metadata: { ...currentMetadata },
                        items: resultRows
                    });
                }

                // If we hit recapitulation or footers, skip scanning remaining sub-tables on this sheet
                // unless an explicit new form title (e.g. Appendix / Report Of) appears later on the sheet
                if (hitRecapOrFooter) {
                    let foundNewForm = false;
                    while (r < matrix.length) {
                        const nextRow = matrix[r];
                        if (Array.isArray(nextRow)) {
                            const str = nextRow.map(c => String(c || '').toLowerCase().trim()).join(' ');
                            if (
                                str.includes('report of supplies and materials issued') ||
                                str.includes('report on the physical count') ||
                                str.includes('stock card') ||
                                str.includes('memorandum receipt') ||
                                str.includes('appendix 64') ||
                                str.includes('appendix 66') ||
                                str.includes('appendix 63')
                            ) {
                                foundNewForm = true;
                                break;
                            }
                        }
                        r++;
                    }
                    if (!foundNewForm) {
                        break;
                    }
                }
            }
        });

        return groups;
    };
    const extractMigrationTextFromFile = async (file: File) => {
        const fileName = file.name.toLowerCase();

        try {
            const { xlsx, mammoth, pdfjs, tesseract } = await loadDocumentParsers();

            // Spreadsheet processing (.xlsx, .xls, .csv)
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
                setOcrStatus('Extracting tabular spreadsheet data...');
                const arrayBuffer = await file.arrayBuffer();
                const workbook = xlsx.read(arrayBuffer, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const groups = parseWorkbookToGroups(workbook, migrationFormType, xlsx);
                return JSON.stringify({ isGroups: true, groups });
            }

            if (fileName.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                setOcrStatus('Extracting text from DOCX...');
                const result = await mammoth.extractRawText({ arrayBuffer });
                let text = result.value || '';

                // Fallback to OCR if raw text is empty or minimal (scanned images inside DOCX)
                if (text.trim().length < 20) {
                    setOcrStatus('Scanning embedded DOCX images for OCR...');
                    const imageSrcs: string[] = [];
                    await mammoth.convertToHtml({ arrayBuffer }, {
                        convertImage: (mammoth.images as any).inline((element: any) => {
                            return element.read("base64").then((imageBuffer: string) => {
                                const src = `data:${element.contentType};base64,${imageBuffer}`;
                                imageSrcs.push(src);
                                return { src };
                            });
                        })
                    });

                    if (imageSrcs.length > 0) {
                        let ocrTextCombined = '';
                        for (let i = 0; i < imageSrcs.length; i += 1) {
                            setOcrStatus(`Running OCR on image ${i + 1} of ${imageSrcs.length}...`);
                            try {
                                const res = await tesseract.recognize(imageSrcs[i], 'eng');
                                if (res?.data?.text?.trim()) {
                                    ocrTextCombined += `${res.data.text.trim()}\n\n`;
                                }
                            } catch (ocrErr) {
                                console.warn('OCR error on DOCX image:', ocrErr);
                            }
                        }
                        if (ocrTextCombined.trim()) {
                            text = ocrTextCombined.trim();
                        }
                    }
                }

                return text.trim();
            }

            if (fileName.endsWith('.pdf')) {
                const arrayBuffer = await file.arrayBuffer();

                try {
                    setOcrStatus('Reading PDF pages...');
                    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                    let extractedText = '';

                    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
                        setOcrStatus(`Reading PDF text (page ${pageIndex}/${pdf.numPages})...`);
                        const page = await pdf.getPage(pageIndex);
                        const textContent = await page.getTextContent();
                        let pageText = textContent.items
                            .map((item: any) => ('str' in item ? item.str : ''))
                            .filter(Boolean)
                            .join(' ');

                        // If direct text extraction yields empty/minimal text (scanned PDF page), run Tesseract OCR
                        if (pageText.trim().length < 20) {
                            setOcrStatus(`Running OCR character recognition on PDF page ${pageIndex} of ${pdf.numPages}...`);
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
                                        pageText = res.data.text.trim();
                                    }
                                } catch (ocrErr) {
                                    console.warn(`OCR failed on PDF page ${pageIndex}:`, ocrErr);
                                }
                            }
                        }

                        extractedText += `${pageText}\n`;
                    }

                    return extractedText.trim();
                } catch (error) {
                    console.warn('PDF text extraction failed, falling back to empty content.', error);
                    return '';
                }
            }

            return await file.text();
        } catch (error) {
            console.warn('Failed to read uploaded migration file, falling back to empty content.', error);
            return '';
        }
    };

    const getRowVal = (row: any, possibleKeys: string[]) => {
        if (!row || typeof row !== 'object') return '';

        for (const key of possibleKeys) {
            if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                return String(row[key]).trim();
            }
        }

        const cleanKey = (k: string) => k.toLowerCase()
            .replace(/\s*\(\s*\d+\s*\)\s*$/g, '')
            .replace(/[^a-z0-9]/g, '');

        const rowKeys = Object.keys(row);
        for (const key of possibleKeys) {
            const normKey = cleanKey(key);
            if (!normKey) continue;

            const matchedRowKey = rowKeys.find(rk => {
                const normRk = cleanKey(rk);
                return normRk === normKey || normRk.replace(/\d+$/, '') === normKey.replace(/\d+$/, '');
            });

            if (matchedRowKey && row[matchedRowKey] !== undefined && row[matchedRowKey] !== null && String(row[matchedRowKey]).trim() !== '') {
                return String(row[matchedRowKey]).trim();
            }
        }

        return '';
    };

    const formatDateToIso = (rawDate: any) => {
        if (!rawDate) return '';
        const str = String(rawDate).trim();
        if (!str || str === '-' || str === 'N/A') return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
        const d = new Date(str);
        if (!Number.isNaN(d.getTime()) && d.getFullYear() >= 1970 && d.getFullYear() <= 2100) {
            return d.toISOString().split('T')[0];
        }
        return '';
    };

    const mapRowToItem = (row: any, idx: number, formType: string, groupMetadata: any, lastRefObj: { current: string; centerCode?: string }) => {
        if (typeof row === 'string') {
            return { reference: `${formType}-HIST-${idx + 1}`, item_name: row, quantity: 1, date: new Date().toISOString().split('T')[0], remarks: 'Parsed raw text row' };
        }

        if (formType === 'RSMI') {
            let rawRef = getRowVal(row, ['RIS No.', 'RIS No', 'RIS', 'Serial No.', 'Serial No', 'Reference', 'reference', 'risNo', 'ris_no', 'Doc No.', 'Doc No']);
            const rccFromRow = getRowVal(row, ['Responsibility Center Code', 'Responsibility Center', 'Resp. Center Code', 'Resp Center Code', 'Center Code', 'RCC', 'responsibilityCenterCode', 'responsibility_center_code', 'center_code']);
            const stockNo = getRowVal(row, ['Stock No.', 'Stock No', 'Stock Number', 'SKU', 'stockNo', 'stock_no', 'Stock']);
            const rawItemName = getRowVal(row, ['Item', 'Item Description', 'Description', 'Article', 'Item / Description', 'item_name', 'itemDescription', 'Item Name']);
            const unit = getRowVal(row, ['Unit', 'Unit of Issue', 'Unit of Measurement', 'unit']) || 'pc';
            const qty = Number(getRowVal(row, ['Quantity Issued', 'Qty Issued', 'Qty. Issued', 'Quantity', 'Qty', 'Qty.', 'quantity', 'quantityIssued', 'quantity_issued', 'issue_qty', 'Issued']) || 0);
            const cost = Number(getRowVal(row, ['Unit Cost', 'Unit Value', 'Cost', 'unitCost', 'unit_cost', 'unit_value']) || 0);
            const amt = Number(getRowVal(row, ['Amount', 'Total Cost', 'Total Amount', 'Total Value', 'amount', 'totalCost', 'total_cost']) || (qty * cost));

            // Check if this row is a section header like "Center Code: SPMO" or "Resp. Center Code: ..."
            const firstCell = String(Object.values(row)[0] || '').trim();
            const isCenterCodeHeader = /^(center\s*code|resp|responsibility)/i.test(rawRef) || (/^(center\s*code|resp|responsibility)/i.test(firstCell) && !stockNo && qty === 0);
            if (isCenterCodeHeader) {
                const detectedCode = (rccFromRow && !/center\s*code|resp/i.test(rccFromRow))
                    ? rccFromRow
                    : Object.values(row).find((v: any) => typeof v === 'string' && v.trim() && !/center\s*code|resp|appendix|report/i.test(v)) || '';
                if (detectedCode) {
                    lastRefObj.centerCode = String(detectedCode).trim();
                }
                // Skip the section header row from being parsed as a dummy item
                return null;
            }

            if (/^(center\s*code|resp|responsibility|entity|fund|date|page|sheet)/i.test(rawRef)) {
                rawRef = '';
            }

            if (rccFromRow && !/^(center\s*code|resp|responsibility)/i.test(rccFromRow)) {
                lastRefObj.centerCode = rccFromRow;
            }

            const activeCenterCode = (rccFromRow && !/^(center\s*code|resp|responsibility)/i.test(rccFromRow))
                ? rccFromRow
                : (lastRefObj.centerCode || groupMetadata?.topOffice || '');

            if (rawRef) {
                lastRefObj.current = rawRef;
            }
            let ref = rawRef || lastRefObj.current;
            if (!ref && groupMetadata?.topSerialNo && !/^(center\s*code|resp)/i.test(groupMetadata.topSerialNo)) {
                ref = groupMetadata.topSerialNo;
            }

            let dt = getRowVal(row, ['Date', 'Date Issued', 'Transaction Date', 'date', 'date_issued', 'topDate']);
            if (!dt && groupMetadata?.topDate) dt = groupMetadata.topDate;
            const recipient = getRowVal(row, ['Recipient', 'Requested By', 'Issued To', 'recipient', 'topRecipient']) || groupMetadata?.topRecipient || activeCenterCode;
            const fundCluster = getRowVal(row, ['Fund Cluster', 'fund_cluster', 'General Fund']) || groupMetadata?.fundCluster;
            const entityName = groupMetadata?.entityName || 'University of Camarines Norte';
            const remarks = getRowVal(row, ['Remarks', 'remarks']);

            const fallbackItem = rawItemName || Object.values(row).find((v: any) => typeof v === 'string' && v.trim().length > 1 && !v.includes('RIS') && !v.includes('Appendix') && !v.includes('REPORT') && !v.includes('University') && !v.includes('Camarines') && !/^(center\s*code|spmo|acc)/i.test(v)) || '';

            // If completely empty row (no description, no stock no, qty 0), skip
            if (!String(fallbackItem).trim() && !stockNo && qty === 0) {
                return null;
            }

            return {
                reference: ref || `RSMI-HIST-${idx + 1}`,
                date: formatDateToIso(dt),
                item_name: String(fallbackItem).trim(),
                quantity: qty,
                unit_cost: cost,
                amount: amt,
                unit: unit,
                stock_no: stockNo,
                recipient: recipient,
                department: activeCenterCode,
                fund_cluster: fundCluster,
                responsibility_center_code: activeCenterCode,
                center_code: activeCenterCode,
                entity_name: entityName,
                remarks: remarks,
            };
        }
        if (formType === 'RPCI') {
            let ref = getRowVal(row, ['Stock Number', 'Stock No.', 'Stock No', 'Property No.', 'Property No', 'Serial No.', 'Serial No', 'reference', 'property_no', 'stock_no']);
            if (!ref && groupMetadata?.topSerialNo) ref = groupMetadata.topSerialNo;
            if (!ref && lastRefObj.current) ref = lastRefObj.current;
            if (ref) lastRefObj.current = ref;
            const article = getRowVal(row, ['Article', 'article']);
            const description = getRowVal(row, ['Description', 'Item Description', 'item_name', 'description']);
            const itemName = description || article || getRowVal(row, ['Item', 'Item Name']);
            const stockNo = ref;
            const unit = getRowVal(row, ['Unit of Measure', 'Unit of Measurement', 'Unit', 'unit']) || 'pc';
            const cost = Number(getRowVal(row, ['Unit Value', 'Unit Cost', 'unit_value', 'unit_cost']) || 0);
            const qty = Number(getRowVal(row, ['Balance Per Card', 'Balance per Card', 'Property Card Qty', 'Quantity', 'quantity', 'balance_per_card']) || 0);
            const onHand = Number(getRowVal(row, ['On Hand Per Count', 'On Hand Count', 'Physical Count', 'on_hand_count']) || qty);
            const shortageQty = getRowVal(row, ['Shortage/Overage Quantity', 'Shortage Qty', 'shortage_qty']);
            const shortageVal = getRowVal(row, ['Shortage/Overage Value', 'Shortage Value', 'shortage_value']);
            const recipient = getRowVal(row, ['Accountable Officer', 'Recipient', 'accountable_officer', 'recipient', 'topRecipient']) || groupMetadata?.topRecipient;
            const dept = getRowVal(row, ['Location', 'Department', 'Office', 'department']) || groupMetadata?.topOffice;
            let dt = getRowVal(row, ['As at Date', 'As at', 'Date', 'as_at_date', 'date', 'topDate']);
            if (!dt && groupMetadata?.topDate) dt = groupMetadata.topDate;
            const remarks = getRowVal(row, ['Remarks', 'State of Property', 'remarks']);

            const fallbackItem = itemName || Object.values(row).find((v: any) => typeof v === 'string' && v.trim().length > 1 && !v.includes('Appendix') && !v.includes('REPORT')) || '';
            return { reference: stockNo || (fallbackItem ? `RPCI-HIST-${idx + 1}` : ''), date: formatDateToIso(dt), item_name: String(fallbackItem).trim(), quantity: qty, unit_cost: cost, unit: unit, stock_no: stockNo, on_hand_count: onHand, shortage_qty: shortageQty, shortage_value: shortageVal, recipient: recipient, department: dept, remarks: remarks };
        }
        if (formType === 'MR' || formType === 'MOR') {
            let ref = getRowVal(row, ['Property No. / Serial No.', 'Property No.', 'Property No', 'Serial No.', 'Serial No', 'MR No.', 'MR No', 'reference', 'propertyNo', 'property_no', 'serialNo', 'mrNo', 'topSerialNo']);
            if (!ref && groupMetadata?.topSerialNo) ref = groupMetadata.topSerialNo;
            if (!ref && lastRefObj.current) ref = lastRefObj.current;
            if (ref) lastRefObj.current = ref;
            const qty = Number(getRowVal(row, ['Qty.', 'Qty', 'Quantity', 'quantity']) || 1);
            const unit = getRowVal(row, ['Unit', 'unit']) || 'pc';
            const itemName = getRowVal(row, ['Description / Item Name', 'Description', 'Item Name', 'Item', 'Item Description', 'item_name', 'description']);
            let dt = getRowVal(row, ['Date Acquired', 'Date', 'dateAcquired', 'date_acquired', 'date', 'topDate']);
            if (!dt && groupMetadata?.topDate) dt = groupMetadata.topDate;
            const cost = Number(getRowVal(row, ['Unit Value / Cost', 'Unit Value', 'Unit Cost', 'unitValue', 'unit_cost']) || 0);
            const totalVal = Number(getRowVal(row, ['Total Value', 'Grand Total Value', 'Amount', 'totalValue', 'amount']) || (qty * cost));
            const recipient = getRowVal(row, ['Received By', 'Received by', 'End-User', 'End User', 'Recipient', 'receivedByName', 'recipient', 'topRecipient']) || groupMetadata?.topRecipient;
            const dept = getRowVal(row, ['Office', 'Department', 'receivedByOffice', 'department']) || groupMetadata?.topOffice;
            const designation = getRowVal(row, ['Position', 'receivedByPosition', 'designation']);
            const remarks = getRowVal(row, ['Purpose', 'Remarks', 'remarks']);

            const fallbackItem = itemName || Object.values(row).find((v: any) => typeof v === 'string' && v.trim().length > 1 && !v.includes('MEMORANDUM') && !v.includes('Appendix')) || '';
            return { reference: ref || (fallbackItem ? `${formType}-HIST-${idx + 1}` : ''), date: formatDateToIso(dt), item_name: String(fallbackItem).trim(), quantity: qty, unit_cost: cost, amount: totalVal, unit: unit, recipient: recipient, department: dept, designation: designation, remarks: remarks };
        }
        
        let ref = getRowVal(row, ['Reference', 'RIS No.', 'RIS No', 'PO No.', 'PO No', 'IAR No.', 'IAR No', 'reference', 'topSerialNo']);
        if (!ref && groupMetadata?.topSerialNo) ref = groupMetadata.topSerialNo;
        if (!ref && lastRefObj.current) ref = lastRefObj.current;
        if (ref) lastRefObj.current = ref;
        const itemName = getRowVal(row, ['Item', 'Description', 'Item Description', 'item_name', 'item']);
        const stockNo = getRowVal(row, ['Stock No.', 'Stock No', 'SKU', 'stock_no', 'stockNo']);
        const unit = getRowVal(row, ['Unit of Measurement', 'Unit of Measure', 'Unit', 'unit']) || 'Pieces';
        const reorderPoint = getRowVal(row, ['Re-order Point', 'Reorder Point', 're_order_point']) || '-';
        let dt = getRowVal(row, ['Date', 'Transaction Date', 'date', 'topDate']);
        if (!dt && groupMetadata?.topDate) dt = groupMetadata.topDate;
        const receiptQty = Number(getRowVal(row, ['Receipt Qty.', 'Receipt Qty', 'Receipts', 'receipt_qty']) || 0);
        const issueQty = Number(getRowVal(row, ['Issue Qty.', 'Issue Qty', 'Issuance', 'Quantity', 'quantity', 'issue_qty']) || 0);
        const balanceQty = Number(getRowVal(row, ['Balance Qty.', 'Balance Qty', 'Balance', 'balance_qty']) || 0);
        const recipient = getRowVal(row, ['Issue Office', 'Office', 'Recipient', 'Department', 'recipient', 'issue_office', 'topRecipient']) || groupMetadata?.topOffice;
        const remarks = getRowVal(row, ['No. of Days to Consume', 'Days to Consume', 'Remarks', 'remarks']);

        const fallbackItem = itemName || Object.values(row).find((v: any) => typeof v === 'string' && v.trim().length > 1 && !v.includes('STOCK CARD') && !v.includes('Appendix')) || '';
        return { reference: ref || (fallbackItem ? `SC-HIST-${idx + 1}` : ''), date: formatDateToIso(dt), item_name: String(fallbackItem).trim(), quantity: issueQty, stock_no: stockNo, unit: unit, receipt_qty: receiptQty, balance_qty: balanceQty, re_order_point: reorderPoint, recipient: recipient, remarks: remarks };
    };

    const parseFormSpecificRows = (raw: string, formType: 'RSMI' | 'RPCI' | 'STOCK_CARD' | 'MR' | 'MOR') => {
        const trimmed = raw.trim();
        if (!trimmed) return [];

        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && parsed.isGroups) {
                return parsed.groups.map((group: any) => {
                    const lastRefObj = { current: '', centerCode: '' };
                    const items: any[] = [];
                    group.items.forEach((row: any, idx: number) => {
                        const mapped = mapRowToItem(row, idx, formType, group.metadata, lastRefObj);
                        if (mapped) items.push(mapped);
                    });
                    return { ...group, items };
                });
            } else if (Array.isArray(parsed)) {
                const lastRefObj = { current: '', centerCode: '' };
                const items: any[] = [];
                parsed.forEach((row: any, idx: number) => {
                    const mapped = mapRowToItem(row, idx, formType, null, lastRefObj);
                    if (mapped) items.push(mapped);
                });
                return [{ sheetName: 'Default', metadata: {}, items }];
            } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) {
                const lastRefObj = { current: '', centerCode: '' };
                const items: any[] = [];
                parsed.records.forEach((row: any, idx: number) => {
                    const mapped = mapRowToItem(row, idx, formType, null, lastRefObj);
                    if (mapped) items.push(mapped);
                });
                return [{ sheetName: 'Default', metadata: {}, items }];
            }
        } catch {
            // Not JSON
        }
        
        // Fallback for raw text lines (DOCX/PDF)
        const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        if (lines.length > 0) {
            const lastRefObj = { current: '', centerCode: '' };
            const items: any[] = [];
            lines.forEach((row: any, idx: number) => {
                const mapped = mapRowToItem(row, idx, formType, null, lastRefObj);
                if (mapped) items.push(mapped);
            });
            return [{ sheetName: 'Extracted Text', metadata: {}, items }];
        }
        return [];
    };

    const getFieldMappingMatrix = (formType: string, previewRows: any[]) => {
        const sample = previewRows[0] || {};
        if (formType === 'RSMI') {
            return [
                { field: 'RIS No. (Reference)', type: 'String', sample: sample.reference || 'RIS-2024-001', dbField: 'reference' },
                { field: 'Stock No.', type: 'String', sample: sample.stock_no || 'STK-001', dbField: 'payload.stock_no' },
                { field: 'Item (Description)', type: 'String', sample: sample.item_name || 'A4 Bond Paper', dbField: 'item_name' },
                { field: 'Unit', type: 'String', sample: sample.unit || 'rim', dbField: 'payload.unit' },
                { field: 'Quantity Issued', type: 'Number', sample: sample.quantity ?? 10, dbField: 'quantity' },
                { field: 'Unit Cost & Amount', type: 'Number', sample: sample.unit_cost ? `₱${sample.unit_cost}` : '₱250.00', dbField: 'payload.unit_cost' },
            ];
        } else if (formType === 'RPCI') {
            return [
                { field: 'Article & Description', type: 'String', sample: sample.item_name || 'Desktop Computer', dbField: 'item_name' },
                { field: 'Stock Number / Property No.', type: 'String', sample: sample.reference || 'PROP-2024-88', dbField: 'reference' },
                { field: 'Unit of Measure', type: 'String', sample: sample.unit || 'unit', dbField: 'payload.unit' },
                { field: 'Unit Value', type: 'Number', sample: sample.unit_cost ? `₱${sample.unit_cost}` : '₱25,000.00', dbField: 'payload.unit_cost' },
                { field: 'Balance Per Card / On Hand Per Count', type: 'Number', sample: sample.quantity ?? 5, dbField: 'quantity / payload.on_hand_count' },
                { field: 'Shortage/Overage Quantity & Value', type: 'Number', sample: sample.shortage_qty ? `${sample.shortage_qty}` : '0', dbField: 'payload.shortage_qty / shortage_value' },
                { field: 'Accountable Officer & Location', type: 'String', sample: sample.recipient || 'Supply Custodian', dbField: 'recipient / department' },
            ];
        } else if (formType === 'MR' || formType === 'MOR') {
            return [
                { field: 'Property No. / Serial No. (MR No.)', type: 'String', sample: sample.reference || 'MR-2024-001', dbField: 'reference' },
                { field: 'Date Acquired', type: 'Date', sample: sample.date || '2024-01-15', dbField: 'date' },
                { field: 'Description / Item Name', type: 'String', sample: sample.item_name || 'Executive Desk', dbField: 'item_name' },
                { field: 'Qty. & Unit', type: 'Number / String', sample: `${sample.quantity ?? 1} ${sample.unit || 'unit'}`, dbField: 'quantity / payload.unit' },
                { field: 'Unit Value / Cost', type: 'Number', sample: sample.unit_cost ? `₱${sample.unit_cost}` : '₱8,500.00', dbField: 'payload.unit_cost' },
                { field: 'Received By / Office', type: 'String', sample: sample.recipient || sample.department || 'Administrative Office', dbField: 'recipient / department' },
            ];
        } else {
            return [
                { field: 'Item & Stock No.', type: 'String', sample: sample.item_name || 'Ballpen Black', dbField: 'item_name / payload.stock_no' },
                { field: 'Reference (Doc No.)', type: 'String', sample: sample.reference || 'PO-2024-09', dbField: 'reference' },
                { field: 'Transaction Date', type: 'Date', sample: sample.date || '2024-03-10', dbField: 'date' },
                { field: 'Receipt Qty. / Issue Qty.', type: 'Number', sample: sample.receipt_qty ? `+${sample.receipt_qty}` : `-${sample.quantity || 1}`, dbField: 'quantity / payload.receipt_qty' },
                { field: 'Issue Office (Recipient)', type: 'String', sample: sample.recipient || 'Admin Office', dbField: 'recipient' },
                { field: 'Balance Qty. & Days to Consume', type: 'Number', sample: sample.balance_qty ?? 45, dbField: 'payload.balance_qty' },
            ];
        }
    };

    const populateFormFromMigrationRow = (row: any) => {
        const rawDate = String(row.date || row.date_issued || row.issued_date || '').trim();
        const parsedDate = rawDate ? new Date(rawDate) : new Date();
        const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        const reference = String(row.reference || row.ref || row.serial || row.doc_no || '').trim();
        const itemName = String(row.item_name || row.item || row.article || row.description || '').trim();
        const title = String(row.title || row.designation || row.department || row.remarks || row.recipient || '').trim();

        setFormData({
            title: title || itemName || '',
            type: migrationFormType,
            reference,
            itemName: migrationFormType === 'STOCK_CARD' ? itemName : '',
            supplierId: '',
            supplierName: '',
            endUser: row.recipient || '',
            periodType: 'specific',
            date: safeDate.toISOString().split('T')[0],
            startDate: '',
            endDate: '',
            selectedMonth: safeDate.getMonth() + 1,
            selectedYear: safeDate.getFullYear(),
        });
        setSelectedId(null);
    };

    const buildMigrationPreview = (raw: string) => {
        const parsedGroups = parseFormSpecificRows(raw, migrationFormType);

        const existingReferences = new Set(
            (migratedRecords || [])
                .filter((record: any) => String(record.form_type) === migrationFormType)
                .map((record: any) => String(record.reference || '').trim().toLowerCase())
        );

        const existingCombinations = new Set(
            (migratedRecords || [])
                .filter((record: any) => String(record.form_type) === migrationFormType)
                .map((record: any) => {
                    const item = String(record.item_name || '').trim().toLowerCase();
                    const dt = String(record.date || '').trim();
                    const qty = Number(record.quantity || 0);
                    return `${item}||${dt}||${qty}`;
                })
        );

        let totalValid = 0;
        let totalInvalid = 0;
        let totalDuplicate = 0;

        const previewGroups = parsedGroups.map((group: any) => {
            const groupItems = group.items.map((row: any) => {
                const errors: string[] = [];
                if (!row.reference && !row.item_name) errors.push('Missing reference or item name');
                if (!row.item_name) errors.push('Missing item description');
                if (row.date) {
                    const parsedDate = new Date(row.date);
                    if (Number.isNaN(parsedDate.getTime())) errors.push('Invalid date format');
                }

                const refLower = String(row.reference || '').trim().toLowerCase();
                const comboKey = `${String(row.item_name || '').trim().toLowerCase()}||${String(row.date || '').trim()}||${Number(row.quantity || 0)}`;

                if (migrationFormType !== 'RSMI' && refLower && existingReferences.has(refLower)) {
                    errors.push(`Duplicate ${migrationFormType} record: reference number exists`);
                } else if (row.item_name && existingCombinations.has(comboKey)) {
                    errors.push(`Duplicate ${migrationFormType} record: matching item, date, and qty exist`);
                }

                return { ...row, errors };
            });

            const validCount = groupItems.filter((row: any) => row.errors.length === 0).length;
            const invalidCount = groupItems.length - validCount;
            const duplicateCount = groupItems.filter((row: any) => row.errors.some((error: string) => error.includes('Duplicate'))).length;

            totalValid += validCount;
            totalInvalid += invalidCount;
            totalDuplicate += duplicateCount;

            return { ...group, items: groupItems, validCount, invalidCount, duplicateCount };
        });

        setMigrationPreview(previewGroups);
        setMigrationValidation({ validCount: totalValid, invalidCount: totalInvalid, duplicateCount: totalDuplicate });

        const firstValidGroup = previewGroups.find((g: any) => g.items.some((r: any) => r.errors.length === 0));
        if (firstValidGroup) {
            const firstValidRow = firstValidGroup.items.find((r: any) => r.errors.length === 0);
            populateFormFromMigrationRow({ ...firstValidRow, sheetName: firstValidGroup.sheetName, metadata: firstValidGroup.metadata });
            setModalMode('create');
        }

        return previewGroups;
    };

    const openMigrationModal = () => {
        setMigrationFormType('RSMI');
        setMigrationSource('');
        setMigrationInputText('');
        setMigrationFileName('');
        setMigrationPreview([]);
        setMigrationValidation({ validCount: 0, invalidCount: 0, duplicateCount: 0 });
        setIsExtractingFile(false);
        setOcrStatus('');
        setShowMigrationModal(true);
    };

    const handleMigrationFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsExtractingFile(true);
        setMigrationFileName(file.name);
        try {
            const text = await extractMigrationTextFromFile(file);
            setMigrationInputText(text);
            buildMigrationPreview(text);
        } catch (err) {
            console.error('Error processing migration file:', err);
        } finally {
            setIsExtractingFile(false);
            setOcrStatus('');
        }
    };

    const handlePreviewMigration = () => {
        const preview = buildMigrationPreview(migrationInputText);

        if (!migrationInputText.trim()) {
            setActionDialog({
                show: true,
                type: 'error',
                title: 'No File Content Found',
                message: 'Upload a supported PDF or DOCX with selectable text, then preview it again.',
            });
            return;
        }

        if (!preview.length) {
            setActionDialog({
                show: true,
                type: 'error',
                title: 'Nothing to Preview',
                message: 'The uploaded file did not produce any preview rows. Try another file or paste the raw text export.',
            });
            return;
        }

        window.setTimeout(() => {
            migrationPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const handleConfirmMigration = () => {
    const payloadRecords: any[] = [];
    migrationPreview.forEach((group: any) => {
        group.items.forEach((row: any) => {
            if (row.errors.length === 0) {
                payloadRecords.push({
                    reference: row.reference,
                    date: row.date,
                    item_name: row.item_name,
                    quantity: row.quantity,
                    quantity_issued: row.quantity,
                    recipient: row.recipient,
                    department: row.department,
                    designation: row.designation,
                    remarks: row.remarks,
                    unit_cost: row.unit_cost,
                    amount: row.amount,
                    unit: row.unit,
                    stock_no: row.stock_no,
                    receipt_qty: row.receipt_qty,
                    balance_qty: row.balance_qty,
                    re_order_point: row.re_order_point,
                    on_hand_count: row.on_hand_count,
                    shortage_qty: row.shortage_qty,
                    shortage_value: row.shortage_value,
                    fund_cluster: row.fund_cluster,
                    responsibility_center_code: row.responsibility_center_code || row.center_code || row.department,
                    center_code: row.center_code || row.responsibility_center_code || row.department,
                    entity_name: row.entity_name || group.metadata?.entityName || 'University of Camarines Norte',
                    source_sheet: group.sheetName,
                });
            }
        });
    });

    if (!payloadRecords.length) {
        setActionDialog({
            show: true,
            type: 'error',
            title: 'Nothing to Migrate',
            message: 'Please provide at least one valid historical record without validation errors or duplicates before confirming.',
        });
        return;
    }

    // Determine correct endpoint based on selected form type
    const endpoint =
        migrationFormType === 'RSMI' || migrationFormType === 'RPCI'
            ? route('compliance.migrations.store')
            : migrationFormType === 'STOCK_CARD'
            ? route('compliance.migrate.stock_card')
            : route('compliance.migrate.memorandum_receipt');

    setMigrationSubmitting(true);
    router.post(endpoint, {
        form_type: migrationFormType,
        source: migrationSource || migrationFileName || 'historical_migration',
        records: payloadRecords,
    }, {
        preserveScroll: true,
        onStart: () => setMigrationSubmitting(true),
        onFinish: () => setMigrationSubmitting(false),
        onSuccess: () => {
            setShowMigrationModal(false);
            setMigrationInputText('');
            setMigrationPreview([]);
            setMigrationValidation({ validCount: 0, invalidCount: 0, duplicateCount: 0 });
            setActionDialog({
                show: true,
                type: 'success',
                title: 'Migration Successful',
                message: `Historical ${migrationFormType} records were stored in the database and integrated into the report-generation data source.`,
            });
        },
        onError: () => {
            setActionDialog({
                show: true,
                type: 'error',
                title: 'Migration Failed',
                message: 'Unable to complete historical data migration. Please verify field mappings and try again.',
            });
        },
    });
};

    // Filter logic for Issuances Data
    const getFilteredIssuances = () => {
        const combinedEntries = [
            ...issuances.map((issue: any) => ({ ...issue, _source: 'issuance' })),
            ...migratedRecords
                .filter((record: any) => String(record.form_type) === String(formData.type))
                .map((record: any) => ({ ...record, _source: 'migration' })),
        ];

        return combinedEntries.filter((entry: any) => {
            const issueDate = new Date(entry.date_issued || entry.date || entry.created_at);
            if (Number.isNaN(issueDate.getTime())) return false;

            if (formData.periodType === 'specific') {
                return (issueDate.toISOString().split('T')[0] === formData.date);
            } else if (formData.periodType === 'range') {
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                return issueDate >= start && issueDate <= end;
            } else if (formData.periodType === 'monthly') {
                return (issueDate.getMonth() + 1) === Number(formData.selectedMonth) && issueDate.getFullYear() === Number(formData.selectedYear);
            } else if (formData.periodType === 'yearly') {
                return issueDate.getFullYear() === Number(formData.selectedYear);
            }
            return true;
        });
    };

    // Enhanced Form State for COA Periods (Status removed)
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        reference: '',
        itemName: '',
        supplierId: '',
        supplierName: '',
        endUser: '',
        periodType: 'specific',
        date: new Date().toISOString().split('T')[0],
        startDate: '',
        endDate: '',
        selectedMonth: new Date().getMonth() + 1,
        selectedYear: new Date().getFullYear(),
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<any>(null);
    const [selectedReference, setSelectedReference] = useState<any>(null);

    const modules = getSidebarModules('Compliance', 'Manage Reports');

    // Options Arrays
    const typeOptions = [
        { value: 'RSMI', label: 'RSMI - Supplies and Materials Issued' },
        { value: 'RPCI', label: 'RPCI - Report on the Physical Count of Inventories' },
        { value: 'STOCK_CARD', label: 'Stock Card' },
        { value: 'MR', label: 'MR - Memorandum Receipt for Property' },
    ];

    const periodOptions = [
        { value: 'specific', label: 'Specific Date' },
        { value: 'range', label: 'Date Range' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
    ];

    const monthOptions = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
    ];

    const supplierOptions = suppliers
        .filter((supplier: any) => supplier?.name || supplier?.company_name)
        .map((supplier: any) => ({
            value: supplier.id,
            label: supplier.name || supplier.company_name,
        }));

    const endUserOptions = Array.from(
        new Set(
            [
                ...issuances.map((i: any) => i.recipient).filter(Boolean),
                ...migratedRecords.map((m: any) => m.recipient).filter(Boolean),
            ]
        )
    ).map((name: string) => ({
        value: name,
        label: name,
    }));

    const getEndUserIssuances = (endUserName: string) => {
        if (!endUserName) return [];
        const nameLower = endUserName.trim().toLowerCase();

        const matchedIssuances = issuances.filter((issue: any) =>
            String(issue.recipient || '').trim().toLowerCase() === nameLower
        ).map((issue: any) => ({
            ...issue,
            _source: 'issuance'
        }));

        const matchedMigrations = migratedRecords.filter((record: any) =>
            String(record.recipient || '').trim().toLowerCase() === nameLower
        ).map((record: any) => ({
            ...record,
            _source: 'migration'
        }));

        return [...matchedIssuances, ...matchedMigrations];
    };

    const filteredSupplierItems = formData.supplierId
        ? items.filter((item: any) => String(item.supplier_id) === String(formData.supplierId))
        : items;

    // Format display date based on period selection
    const [reports, setReports] = useState<any[]>(serverReports.length > 0 ? serverReports : []);

    const selectedStockCardItem = items.find((item: any) => item.name === formData.itemName);

    const getSelectedStockCardIssuances = () => {
        if (!formData.itemName) return [];

        return getFilteredIssuances().filter((entry: any) => {
            if (entry._source === 'migration') {
                return String(entry.item_name || '').toLowerCase() === String(formData.itemName).toLowerCase();
            }

            if (entry.item_id && selectedStockCardItem?.id) {
                return String(entry.item_id) === String(selectedStockCardItem.id);
            }

            if (entry.item && typeof entry.item === 'string') {
                return entry.item === formData.itemName;
            }

            if (entry.item && typeof entry.item === 'object') {
                return String(entry.item.id) === String(selectedStockCardItem?.id) || entry.item.name === formData.itemName;
            }

            return false;
        });
    };

    const stockCardEntries = (() => {
        const selectedIssuances = getSelectedStockCardIssuances();
        const currentStock = Number(selectedStockCardItem?.stock || 0);

        const preparedEntries = selectedIssuances
            .map((issue: any) => {
                if (issue._source === 'migration') {
                    const issueQty = Number(issue.quantity || issue.payload?.issue_qty || 0);
                    const receiptQty = Number(issue.payload?.receipt_qty || 0);
                    return {
                        date: issue.date || issue.created_at || '',
                        reference: issue.reference || `MIGRATED-${issue.id}`,
                        receipt_qty: receiptQty === 0 ? '' : receiptQty,
                        issue_qty: issueQty === 0 ? '' : issueQty,
                        issue_office: issue.recipient || issue.department || issue.payload?.issue_office || '',
                        days_to_consume: issue.remarks || 'Historical Migration'
                    };
                }
                const issueQty = Number(issue.quantity || issue.qty || 0);
                return {
                    date: issue.date_issued || issue.date || issue.created_at || '',
                    reference: issue.reference || issue.display_id || issue.id,
                    receipt_qty: '',
                    issue_qty: issueQty === 0 ? '' : issueQty,
                    issue_office: issue.department || issue.recipient || issue.office || '',
                    days_to_consume: '',
                };
            })
            .sort((a: any, b: any) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB || String(a.reference).localeCompare(String(b.reference));
            });

        const totalIssued = preparedEntries.reduce((sum: number, entry: any) => sum + Number(entry.issue_qty || 0), 0);
        const totalReceived = preparedEntries.reduce((sum: number, entry: any) => sum + Number(entry.receipt_qty || 0), 0);
        const startingBalance = Math.max(0, currentStock + totalIssued - totalReceived);

        const entries = [
            {
                date: '',
                reference: 'Balance / Opening Historical',
                receipt_qty: '',
                issue_qty: '',
                issue_office: '',
                balance_qty: startingBalance,
                days_to_consume: '',
            }
        ];

        let runningBalance = startingBalance;
        preparedEntries.forEach((entry: any) => {
            if (entry.receipt_qty) runningBalance += Number(entry.receipt_qty);
            if (entry.issue_qty) runningBalance -= Number(entry.issue_qty);
            entries.push({
                ...entry,
                balance_qty: Math.max(0, runningBalance),
            });
        });

        return entries;
    })();

    const generateDisplayDate = (data: any) => {
        if (data.periodType === 'monthly') {
            const monthName = monthOptions.find(m => m.value === data.selectedMonth)?.label;
            return `${monthName} ${data.selectedYear}`;
        } else if (data.periodType === 'yearly') {
            return `Year ${data.selectedYear}`;
        } else if (data.periodType === 'range') {
            return `${data.startDate} to ${data.endDate}`;
        }
        return data.date;
    };

    const handlePrint = () => {
        const dynamicPrintStyleId = 'dynamic-print-orientation-style';
        const existingStyle = document.getElementById(dynamicPrintStyleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = dynamicPrintStyleId;
        style.setAttribute('media', 'print');
        style.textContent = `@page { size: ${formData.type === 'RPCI' ? 'A4 landscape' : 'A4 portrait'}; margin: 5mm; }`;
        document.head.appendChild(style);

        window.print();

        // Keep the DOM clean after print dialog has been triggered.
        setTimeout(() => {
            const mountedStyle = document.getElementById(dynamicPrintStyleId);
            if (mountedStyle) {
                mountedStyle.remove();
            }
        }, 500);
    };

    useEffect(() => {
        setReports(serverReports.length > 0 ? serverReports : []);
    }, [serverReports]);

    const buildReportPayload = () => {
        const payload = { ...formData } as Record<string, any>;
        if (!formData.supplierId) {
            delete payload.supplierId;
            delete payload.supplierName;
        }

        return {
            title: formData.title,
            type: formData.type || 'General Report',
            reference: formData.reference,
            itemName: formData.itemName || null,
            ...(formData.supplierId ? { supplierId: formData.supplierId, supplierName: formData.supplierName } : {}),
            ...(formData.endUser ? { endUser: formData.endUser } : {}),
            periodType: formData.periodType,
            date: formData.date || null,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            selectedMonth: formData.periodType === 'monthly' ? Number(formData.selectedMonth) : null,
            selectedYear: formData.periodType === 'monthly' || formData.periodType === 'yearly' ? Number(formData.selectedYear) : null,
            coverageLabel: generateDisplayDate(formData),
            payload,
        };
    };

    const handleCreateReport = () => {
        const payload = buildReportPayload();
        const requestOptions = {
            preserveScroll: true,
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
            onSuccess: () => {
                setShowModal(false);
                resetForm();
                setActionDialog({
                    show: true,
                    type: 'success',
                    title: modalMode === 'create' ? 'Report Generated' : 'Report Updated',
                    message: modalMode === 'create'
                        ? 'The compliance document has been successfully generated and stored in the database.'
                        : 'The compliance document has been successfully updated in the database.'
                });
            },
            onError: () => {
                setActionDialog({
                    show: true,
                    type: 'error',
                    title: 'Save Failed',
                    message: 'Unable to save the form right now. Please check required fields and try again.'
                });
            },
        };

        if (modalMode === 'create') {
            router.post(route('compliance.reports.store'), payload, requestOptions);
            return;
        }
    };

    const handleDownload = async () => {
        const reportElement = reportContentRef.current;
        if (!reportElement) {
            setActionDialog({
                show: true,
                type: 'error',
                title: 'Download Failed',
                message: 'The report preview is not ready for export yet.'
            });
            return;
        }

        const payload = buildReportPayload();
        const safeName = [payload.type, payload.reference, payload.title]
            .filter(Boolean)
            .join('_')
            .replace(/[^a-z0-9_-]+/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        const fileName = `${safeName || 'compliance_report'}.pdf`;
        const [{ jsPDF }, html2canvasModule] = await Promise.all([
            import('jspdf'),
            import('html2canvas'),
        ]);
        const html2canvas = html2canvasModule.default;
        const doc = new jsPDF({ orientation: formData.type === 'RPCI' ? 'l' : 'p', unit: 'pt', format: 'a4' });
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: reportElement.scrollWidth,
            windowHeight: reportElement.scrollHeight,
        });

        const imageData = canvas.toDataURL('image/png');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 24;
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;
        const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
        const imageWidth = canvas.width * scale;
        const imageHeight = canvas.height * scale;
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;

        doc.addImage(imageData, 'PNG', x, y, imageWidth, imageHeight, undefined, 'FAST');

        doc.save(fileName);
    };

    const handleView = (report: any) => {
        const supplier = suppliers.find((supplier: any) => String(supplier.id) === String(report.supplierId))
            || suppliers.find((supplier: any) => (supplier.name || supplier.company_name) === report.supplierName);

        setModalMode('view');
        setSelectedId(report.id);
        setFormData({
            ...formData,
            title: report.title,
            type: report.type,
            reference: report.reference,
            itemName: report.itemName || '',
            supplierId: supplier?.id || report.supplierId || '',
            supplierName: supplier ? supplier.name || supplier.company_name : (report.supplierName || ''),
            endUser: report.endUser || report.payload?.endUser || '',
            periodType: report.periodType || 'specific',
            date: report.dateValue || new Date().toISOString().split('T')[0],
            startDate: report.startDate || '',
            endDate: report.endDate || '',
            selectedMonth: report.selectedMonth || new Date().getMonth() + 1,
            selectedYear: report.selectedYear || new Date().getFullYear(),
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setModalMode('create');
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            type: '',
            reference: '',
            itemName: '',
            supplierId: '',
            supplierName: '',
            endUser: '',
            periodType: 'specific',
            date: new Date().toISOString().split('T')[0],
            startDate: '',
            endDate: '',
            selectedMonth: new Date().getMonth() + 1,
            selectedYear: new Date().getFullYear(),
        });
        setSelectedId(null);
    };

    const customSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
            borderWidth: '1px',
            padding: '1px 2px',
            minWidth: '150px',
            boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
            fontSize: '0.8125rem',
            fontWeight: '600',
            backgroundColor: '#ffffff',
            '&:hover': { borderColor: '#7f1d1d' },
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
            color: state.isSelected ? '#ffffff' : '#111827',
            padding: '7px 12px',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
        }),
        singleValue: (provided: any) => ({ ...provided, color: '#111827' }),
        menu: (provided: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            zIndex: 50,
        }),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        indicatorSeparator: () => ({ display: 'none' }),
    };

    // --- FILTER LOGIC ---

    // 1. Dynamic Reference Options based on Type Selection
    const availableReferences = selectedType
        ? reports.filter(r => r.type === selectedType.value)
        : reports;

    const referenceOptions = Array.from(new Set(availableReferences.map(r => r.reference))).map(ref => ({
        value: ref,
        label: ref
    }));

    // Reset Reference filter if Type changes to avoid impossible combinations
    useEffect(() => {
        setSelectedReference(null);
    }, [selectedType]);

    // 2. Filter Reports
    const filteredReports = reports.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.reference.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType ? r.type === selectedType.value : true;
        const matchesRef = selectedReference ? r.reference === selectedReference.value : true;
        return matchesSearch && matchesType && matchesRef;
    });

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white print:bg-white">
            <Head title="COA Compliance Reports & Official Forms" />
            <style>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 5mm; 
                    }
                    body { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                    /* Force the container to render as a single un-broken page */
                    .print-single-page {
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Shrink the form dynamically to ensure it fits one page */
                    .print-zoom-fit {
                        zoom: 0.75;
                    }
                    /* Disable scrollbars when printing */
                    ::-webkit-scrollbar {
                        display: none;
                    }
                }
            `}</style>

            {/* Action Dialog Modal */}
            <Modal show={actionDialog.show} onClose={closeActionDialog} maxWidth="sm">
                <div className="p-6 text-center transform transition-all flex flex-col items-center">
                    {actionDialog.type === 'success' && (
                        <div className="mx-auto flex flex-shrink-0 items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    {actionDialog.type === 'confirm' && (
                        <div className="mx-auto flex flex-shrink-0 items-center justify-center h-14 w-14 rounded-full bg-yellow-100 mb-4">
                            <svg className="h-7 w-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{actionDialog.title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{actionDialog.message}</p>
                    <div className="flex gap-3 justify-center w-full">
                        {actionDialog.type === 'confirm' ? (
                            <>
                                <button onClick={closeActionDialog} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                                <button onClick={actionDialog.onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Confirm</button>
                            </>
                        ) : (
                            <button onClick={closeActionDialog} className="w-full px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Close</button>
                        )}
                    </div>
                </div>
            </Modal>
            <ReportModal
                show={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'create' ? "Generate COA Form" : "Review Compliance Document"}
                isSubmitting={isSubmitting}
                isLandscape={modalMode === 'view' && formData.type === 'RPCI'}
                collapsed={collapsed}
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>

                        {modalMode === 'view' && (
                            <button
                                onClick={handlePrint}
                                type="button"
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg border border-transparent transition-colors shadow-sm flex items-center gap-2 print:hidden"
                            >
                                <svg className="w-4 h-4 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                Print Form
                            </button>
                        )}

                        {modalMode === 'create' ? (
                            <button
                                onClick={handleCreateReport}
                                disabled={isSubmitting || !formData.title || !formData.type || !formData.reference}
                                className="px-6 py-2 bg-gradient-to-r from-red-800 to-red-900 text-white font-bold rounded-lg hover:from-red-900 hover:to-red-950 transition-all shadow-lg disabled:opacity-70 flex items-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing...
                                    </>
                                ) : 'Generate Document'}
                            </button>
                        ) : (
                            <button
                                onClick={handleDownload}
                                type="button"
                                className="px-6 py-2 bg-gradient-to-r from-red-800 to-red-900 text-white font-bold rounded-lg hover:from-red-900 hover:to-red-950 transition-all shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v10m0 0l4-4m-4 4l-4-4m-5 8v2a2 2 0 002 2h12a2 2 0 002-2v-2"></path></svg>
                                Download
                            </button>
                        )}
                    </>
                }
            >
                <div className="flex flex-col gap-6 print:gap-0 print:overflow-hidden print-single-page print-zoom-fit">
                    {modalMode === 'view' && formData.type === 'RSMI' && (
                        <div ref={reportContentRef} className="bg-gray-100 p-6 rounded-xl border border-gray-200 print:bg-white print:p-0 print:border-none print-single-page">
                            {(() => {
                                const filteredIssuances = getFilteredIssuances();

                                const issuedItems = filteredIssuances.map((issue: any) => {
                                    const isMigrated = issue._source === 'migration';
                                    const qty = Number(issue.quantity ?? issue.quantity_issued ?? issue.payload?.quantity_issued ?? issue.payload?.quantity ?? 0);
                                    const cost = isMigrated
                                        ? Number(issue.unit_cost ?? issue.payload?.unit_cost ?? 0)
                                        : Number(issue.item?.unit_cost || 0);
                                    const amt = isMigrated
                                        ? Number(issue.amount ?? issue.payload?.amount ?? (qty * cost))
                                        : (qty * cost);
                                    const stockNo = isMigrated
                                        ? (issue.stock_no || issue.payload?.stock_no || '-')
                                        : (issue.item?.sku || '-');
                                    const itemName = isMigrated
                                        ? (issue.item_name || issue.item || issue.payload?.item_name || issue.payload?.item || '-')
                                        : (issue.item?.name || '-');
                                    const unit = isMigrated
                                        ? (issue.unit || issue.payload?.unit || 'pc')
                                        : (issue.item?.unit_measure || 'pc');
                                    const risNo = isMigrated
                                        ? (issue.reference || issue.ris_no || issue.payload?.ris_no || '-')
                                        : (issue.id ? issue.id.toString().padStart(4, '0') : '-');
                                    const rcc = isMigrated
                                        ? (issue.responsibility_center_code || issue.center_code || issue.payload?.center_code || issue.payload?.responsibility_center_code || issue.department || '-')
                                        : (issue.department || '-');

                                    return {
                                        risNo,
                                        responsibilityCenterCode: rcc,
                                        stockNo,
                                        itemDescription: itemName,
                                        unit,
                                        quantityIssued: qty,
                                        unitCost: cost ? `₱${cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '0.00',
                                        amount: amt ? `₱${amt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '0.00'
                                    };
                                });

                                const recaps = issuedItems.map(item => ({
                                    stockNo: item.stockNo,
                                    quantity: item.quantityIssued,
                                    unitCost: '',
                                    totalCost: '',
                                    uacsObjectCode: ''
                                }));

                                const firstMigrated = filteredIssuances.find((i: any) => i._source === 'migration');
                                const displayEntityName = firstMigrated?.entity_name || firstMigrated?.payload?.entity_name || 'University of Camarines Norte';

                                return (
                                    <Suspense fallback={reportTemplateFallback}>
                                        <RSMIFormPaper data={{
                                            entityName: displayEntityName,
                                            serialNo: formData.reference,
                                            fundCluster: 'General Fund',
                                            date: generateDisplayDate(formData),
                                            issuedItems: issuedItems,
                                            recapitulationItems: recaps,
                                            supplyCustodianName: user?.name || 'Supply Officer',
                                            accountingStaffName: 'Accounting Staff',
                                            accountingDate: generateDisplayDate(formData),
                                        }} />
                                    </Suspense>
                                );
                            })()}
                        </div>
                    )}
                    {modalMode === 'view' && formData.type === 'RPCI' && (
                        <div ref={reportContentRef} className="bg-gray-100 p-6 rounded-xl border border-gray-200 overflow-x-auto print:bg-white print:p-0 print:border-none print-single-page print:overflow-hidden">
                            <div className="min-w-[1100px] mx-auto print:min-w-[1100px]">
                                {(() => {
                                    if (filteredSupplierItems.length === 0) {
                                        return (
                                            <div className="py-20 text-center text-gray-600">
                                                <p className="text-lg font-semibold text-gray-800">No items found for the selected supplier.</p>
                                                <p className="text-sm text-gray-500 mt-2">Please choose another supplier or add inventory items first.</p>
                                            </div>
                                        );
                                    }

                                    const rpciItems = filteredSupplierItems.map((item: any) => ({
                                        article: item.name || '-',
                                        description: item.description || item.name || '-',
                                        stock_no: item.sku || '-',
                                        unit: item.unit_of_issue || item.unit_measure || 'pc',
                                        unit_value: item.unit_cost || 0,
                                        balance_per_card: item.stock || 0,
                                        on_hand_count: item.stock || 0,
                                        shortage_qty: '',  // To be filled manually
                                        shortage_value: '',// To be filled manually
                                        remarks: ''        // To be filled manually
                                    }));

                                    return (
                                        <Suspense fallback={reportTemplateFallback}>
                                            <RPCIFormPaper data={{
                                                entity_name: 'University of Camarines Norte',
                                                as_at_date: generateDisplayDate(formData),
                                                fund_cluster: 'General Fund',
                                                inventory_type: formData.title,
                                                accountable_officer: 'Jane Doe',
                                                designation: 'Supply Officer',
                                                items: rpciItems,
                                            }} />
                                        </Suspense>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                    {modalMode === 'view' && formData.type === 'STOCK_CARD' && (
                        <div ref={reportContentRef} className="bg-gray-100 p-6 rounded-xl border border-gray-200 overflow-x-auto print:bg-white print:p-0 print:border-none print-single-page print:overflow-hidden">
                            <div className="min-w-[800px] mx-auto print:min-w-full">
                                {formData.itemName ? (
                                    <Suspense fallback={reportTemplateFallback}>
                                        <StockCardFormPaper data={{
                                            entity_name: 'University of Camarines Norte',
                                            fund_cluster: 'General Fund',
                                            item: formData.itemName || formData.title,
                                            stock_no: selectedStockCardItem?.sku || formData.reference,
                                            description: selectedStockCardItem?.description || selectedStockCardItem?.name || formData.itemName || formData.title,
                                            re_order_point: '-',
                                            unit_of_measurement: selectedStockCardItem?.unit_of_issue || selectedStockCardItem?.unit_measure || 'Pieces',
                                            entries: stockCardEntries
                                        }} />
                                    </Suspense>
                                ) : (
                                    <div className="py-20 text-center text-gray-600">
                                        <p className="text-lg font-semibold text-gray-800">Select an item to preview a live stock card.</p>
                                        <p className="text-sm text-gray-500 mt-2">The stock card will generate entries from issued item records once an item is chosen.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {modalMode === 'view' && (formData.type === 'MR' || formData.type === 'MOR') && (
                        <div ref={reportContentRef} className="bg-gray-100 p-6 rounded-xl border border-gray-200 print:bg-white print:p-0 print:border-none print-single-page">
                            {(() => {
                                const endUserName = formData.endUser || '';
                                const endUserRecords = endUserName
                                    ? getEndUserIssuances(endUserName)
                                    : getFilteredIssuances();

                                const mrItems = endUserRecords.map((issue: any) => {
                                    const qty = issue.quantity || issue.qty || issue.payload?.quantity || 1;
                                    const cost = issue.item?.unit_cost || issue.unit_cost || issue.payload?.unit_cost || 0;
                                    return {
                                        quantity: qty,
                                        unit: issue.item?.unit_measure || issue.item?.unit_of_issue || issue.unit || issue.payload?.unit || 'pc',
                                        description: issue.item?.name || issue.item_name || issue.payload?.item_name || issue.description || '-',
                                        propertyNo: issue.item?.sku || issue.stock_no || issue.payload?.stock_no || issue.reference || issue.payload?.reference || '-',
                                        dateAcquired: issue.date_issued || issue.date || issue.created_at || '',
                                        unitValue: cost,
                                        totalValue: qty * cost,
                                    };
                                });

                                const firstRecord = endUserRecords[0];
                                const resolvedEndUser = endUserName || firstRecord?.recipient || firstRecord?.issued_to || 'End User';
                                const endUserPos = firstRecord?.recipient_designation || firstRecord?.designation || firstRecord?.position || firstRecord?.payload?.recipient_designation || 'Accountable Officer';
                                const endUserOffice = firstRecord?.department || firstRecord?.office || firstRecord?.payload?.department || 'Official Business';

                                return (
                                    <Suspense fallback={reportTemplateFallback}>
                                        <MRFormPaper data={{
                                            entityName: 'University of Camarines Norte',
                                            fundCluster: 'General Fund',
                                            mrNo: formData.reference,
                                            date: generateDisplayDate(formData),
                                            purpose: endUserOffice,
                                            items: mrItems,
                                            receivedByName: resolvedEndUser,
                                            receivedByPosition: endUserPos,
                                            receivedByOffice: endUserOffice,
                                            receivedByDate: generateDisplayDate(formData),
                                            issuedByName: user?.name || 'ARSENIO GEM A. GARCILLANOSA',
                                            issuedByPosition: 'SUPPLY OFFICER III / PROPERTY CUSTODIAN',
                                            issuedByOffice: 'Supply & Property Division',
                                            issuedByDate: generateDisplayDate(formData),
                                        }} />
                                    </Suspense>
                                );
                            })()}
                        </div>
                    )}

                    <div className="print:hidden space-y-6">
                        {/* Basic Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">COA Report Type</label>
                                <Select
                                    options={typeOptions}
                                    value={typeOptions.find(opt => opt.value === formData.type)}
                                    onChange={(opt: any) => setFormData({ ...formData, type: opt?.value || '' })}
                                    placeholder="Select Form Type..."
                                    styles={customSelectStyles}
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    menuPosition="fixed"
                                />
                            </div>
                            <FormInput
                                label="Serial / Ref No."
                                value={formData.reference}
                                onChange={(e: any) => setFormData({ ...formData, reference: e.target.value })}
                                placeholder="e.g. 2026-03-001"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>}
                            />
                        </div>

                        <FormInput
                            label="Document Title"
                            value={formData.title}
                            onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Monthly Supplies Issuance - March"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                        />

                        {formData.type === 'RPCI' && (
                            <div className="group w-full">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Supplier</label>
                                <Select
                                    options={supplierOptions}
                                    value={supplierOptions.find((opt: any) => String(opt.value) === String(formData.supplierId)) || null}
                                    onChange={(opt: any) => setFormData({
                                        ...formData,
                                        supplierId: opt ? opt.value : '',
                                        supplierName: opt ? opt.label : '',
                                    })}
                                    styles={customSelectStyles}
                                    isClearable
                                    placeholder="Select supplier..."
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    menuPosition="fixed"
                                />
                            </div>
                        )}

                        {formData.type === 'STOCK_CARD' && (
                            <div className="group w-full">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Target Item</label>
                                <Select
                                    options={items.map((item: any) => ({
                                        value: item.name,
                                        label: `${item.name} ${item.sku ? `(${item.sku})` : ''}`
                                    }))}
                                    value={formData.itemName ? { value: formData.itemName, label: items.find((i: any) => i.name === formData.itemName)?.name ? `${items.find((i: any) => i.name === formData.itemName)?.name} ${items.find((i: any) => i.name === formData.itemName)?.sku ? `(${items.find((i: any) => i.name === formData.itemName)?.sku})` : ''}` : formData.itemName } : null}
                                    onChange={(opt: any) => setFormData({ ...formData, itemName: opt ? opt.value : '' })}
                                    styles={customSelectStyles}
                                    isClearable
                                    placeholder="Select an item..."
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    menuPosition="fixed"
                                />
                            </div>
                        )}

                        {formData.type === 'MR' && (
                            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-800"></div>
                                <div className="flex items-center gap-2 mb-2 text-gray-800">
                                    <svg className="w-5 h-5 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    <h4 className="text-sm font-bold uppercase tracking-wider">End User Search & RIS Data Retrieval</h4>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">Select or enter an End User to search the RIS database and auto-populate issued items into the Memorandum Receipt.</p>

                                <div className="group w-full mb-3">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">End User / Recipient Name</label>
                                    <Select
                                        options={endUserOptions}
                                        value={formData.endUser ? { value: formData.endUser, label: formData.endUser } : null}
                                        onChange={(opt: any) => {
                                            const selectedName = opt ? opt.value : '';
                                            const matched = getEndUserIssuances(selectedName);
                                            const firstMatch = matched[0];
                                            setFormData({
                                                ...formData,
                                                endUser: selectedName,
                                                title: formData.title || (selectedName ? `Memorandum Receipt - ${selectedName}` : ''),
                                                reference: formData.reference || (selectedName ? `MR-${new Date().getFullYear()}-${selectedName.replace(/[^a-z0-9]+/gi, '-').toUpperCase()}` : ''),
                                            });
                                        }}
                                        onInputChange={(newValue: string, actionMeta: any) => {
                                            if (actionMeta.action === 'input-change' && newValue) {
                                                setFormData((prev) => ({ ...prev, endUser: newValue }));
                                            }
                                        }}
                                        styles={customSelectStyles}
                                        isClearable
                                        placeholder="Select or enter End User name..."
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        menuPosition="fixed"
                                    />
                                </div>

                                {formData.endUser && (() => {
                                    const endUserRecords = getEndUserIssuances(formData.endUser);
                                    const firstRecord = endUserRecords[0];
                                    const designation = firstRecord?.recipient_designation || firstRecord?.designation || firstRecord?.payload?.recipient_designation || 'Accountable Officer';
                                    const department = firstRecord?.department || firstRecord?.office || firstRecord?.payload?.department || 'Official Business';

                                    return (
                                        <div className="mt-3 p-4 bg-red-50/50 rounded-lg border border-red-100 space-y-2">
                                            <div className="flex justify-between items-center pb-2 border-b border-red-200/60">
                                                <span className="text-xs font-bold text-red-900 uppercase tracking-wide">RIS Database Records Found</span>
                                                <span className="px-2 py-0.5 bg-red-900 text-white rounded text-[10px] font-bold">{endUserRecords.length} Items Retrieved</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                                <div><strong className="text-gray-600">End User:</strong> <span className="font-semibold text-gray-900">{formData.endUser}</span></div>
                                                <div><strong className="text-gray-600">Designation:</strong> <span className="font-semibold text-gray-900">{designation}</span></div>
                                                <div><strong className="text-gray-600">Office/Dept:</strong> <span className="font-semibold text-gray-900">{department}</span></div>
                                            </div>
                                            {endUserRecords.length > 0 ? (
                                                <div className="mt-2 text-[11px] text-gray-600">
                                                    <strong>Issued Items Preview:</strong>{' '}
                                                    {endUserRecords.slice(0, 5).map((rec: any, i: number) => (
                                                        <span key={i} className="inline-block bg-white px-2 py-0.5 rounded border border-gray-200 mr-1 mb-1 font-mono">
                                                            {rec.item?.name || rec.item_name || rec.payload?.item_name || 'Item'} ({rec.quantity || 1} {rec.item?.unit_measure || rec.unit || 'pc'})
                                                        </span>
                                                    ))}
                                                    {endUserRecords.length > 5 && <span className="font-semibold text-red-800">+{endUserRecords.length - 5} more</span>}
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-xs text-amber-700 font-medium">
                                                    No RIS issuance records matching "{formData.endUser}" found in database yet. Blank rows will be generated on the MR form for manual entry.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* COVERAGE PERIOD SECTION */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-800"></div>
                            <div className="flex items-center gap-2 mb-4 text-gray-800">
                                <svg className="w-5 h-5 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <h4 className="text-sm font-bold uppercase tracking-wider">Coverage Period</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1">Period Format</label>
                                    <Select
                                        options={periodOptions}
                                        value={periodOptions.find(opt => opt.value === formData.periodType)}
                                        onChange={(opt: any) => setFormData({ ...formData, periodType: opt?.value || 'specific' })}
                                        styles={customSelectStyles}
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        menuPosition="fixed"
                                    />
                                </div>

                                {/* Conditional Inputs */}
                                {formData.periodType === 'specific' && (
                                    <FormInput
                                        label="Specific Date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e: any) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                )}

                                {formData.periodType === 'range' && (
                                    <div className="flex items-end gap-3 w-full">
                                        <FormInput label="From Date" type="date" value={formData.startDate} onChange={(e: any) => setFormData({ ...formData, startDate: e.target.value })} />
                                        <FormInput label="To Date" type="date" value={formData.endDate} onChange={(e: any) => setFormData({ ...formData, endDate: e.target.value })} />
                                    </div>
                                )}

                                {formData.periodType === 'monthly' && (
                                    <div className="flex items-end gap-3 w-full">
                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1">Month</label>
                                            <Select
                                                options={monthOptions}
                                                value={monthOptions.find(m => m.value === formData.selectedMonth)}
                                                onChange={(opt: any) => setFormData({ ...formData, selectedMonth: opt.value })}
                                                styles={customSelectStyles}
                                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                            />
                                        </div>
                                        <div className="w-1/3">
                                            <FormInput label="Year" type="number" min="2000" max="2100" value={formData.selectedYear} onChange={(e: any) => setFormData({ ...formData, selectedYear: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {formData.periodType === 'yearly' && (
                                    <FormInput label="Fiscal Year" type="number" min="2000" max="2100" value={formData.selectedYear} onChange={(e: any) => setFormData({ ...formData, selectedYear: e.target.value })} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ReportModal>

            <div className="print:hidden">
                <Sidebar modules={modules} user={user} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
            </div>

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'} print:hidden`}>

                {/* Merged Sticky Institutional Header */}
                <header className="sticky top-0 z-40 shadow-xs print:hidden">
                    {/* Top Institutional Bar */}
                    <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                        <div className="flex items-center gap-3">
                            <span className="font-bold tracking-wider uppercase text-amber-300">Supply & Property Management Office (SPMO)</span>
                            <span className="hidden md:inline text-red-400">|</span>
                            <span className="hidden md:inline text-red-200/80">Supply and Inventory Management System (SIMS)</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <SystemModeBadge />
                            <span>•</span>
                            <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs items={[{ name: 'Compliance' }, { name: 'Manage Reports' }]} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">COA Compliance Reports & Forms Archive</h2>
                            <p className="text-xs text-gray-500 font-medium">Official COA Inventory Documentation & Compliance Reporting Module</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block border-l border-gray-200 pl-6">
                                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">

                    {/* Welcome / System Overview Banner */}
                    <div className="bg-red-950 text-white rounded-lg border border-red-900 border-l-4 border-l-amber-400 p-6 lg:p-7 shadow-xs relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                            <div className="max-w-3xl space-y-2.5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-900/90 border border-red-800 text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    Official COA Reporting: Active & Audited
                                </div>
                                <h1 className="text-2xl lg:text-3xl font-bold font-serif leading-tight text-white tracking-tight">
                                    Commission on Audit Compliance Forms Archive
                                </h1>
                                <p className="text-red-100/90 text-sm font-normal leading-relaxed">
                                    Generate, inspect, print, and track official COA inventory documentation including RSMI, RPCI, Stock Cards, and Memorandum Receipts for institutional audit compliance.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
                                <button
                                    onClick={openMigrationModal}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/90 hover:bg-red-900 text-amber-300 border border-red-800 rounded font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
                                >
                                    <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"></path></svg>
                                    <span>Migrate Historical COA Data</span>
                                </button>
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 text-red-950 rounded font-bold text-xs uppercase tracking-wider hover:bg-amber-300 transition-colors shadow-xs border border-amber-300"
                                >
                                    <svg className="w-4 h-4 text-red-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                                    <span>Generate New Report</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Statistics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono block mb-1">Total Archived Reports</span>
                                <span className="text-2xl font-bold text-gray-900 font-serif">{reports.length}</span>
                                <span className="text-[11px] font-medium text-emerald-700 block mt-1">Verified Audit Records</span>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg text-red-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono block mb-1">RSMI Reports</span>
                                <span className="text-2xl font-bold text-gray-900 font-serif">{reports.filter(r => r.type === 'RSMI').length}</span>
                                <span className="text-[11px] font-medium text-gray-500 block mt-1">Supplies & Materials Issued</span>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg text-amber-800">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono block mb-1">RPCI Audit Reports</span>
                                <span className="text-2xl font-bold text-gray-900 font-serif">{reports.filter(r => r.type === 'RPCI').length}</span>
                                <span className="text-[11px] font-medium text-gray-500 block mt-1">Physical Inventory Count</span>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-mono block mb-1">Stock Cards & MR</span>
                                <span className="text-2xl font-bold text-gray-900 font-serif">{reports.filter(r => r.type === 'STOCK_CARD' || r.type === 'MR' || r.type === 'MOR').length}</span>
                                <span className="text-[11px] font-medium text-gray-500 block mt-1">Stock Cards & Memorandum Receipts</span>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Historical Migration Modal */}
                    <ReportModal
                        show={showMigrationModal}
                        onClose={() => setShowMigrationModal(false)}
                        title={`Migrate Historical ${migrationFormType} COA Data`}
                        isSubmitting={migrationSubmitting}
                        isLandscape={false}
                        collapsed={collapsed}
                        footer={
                            <>
                                <button onClick={() => setShowMigrationModal(false)} className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="button" onClick={handlePreviewMigration} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">Preview Data</button>
                                <button onClick={handleConfirmMigration} disabled={migrationSubmitting || migrationPreview.length === 0} className="px-6 py-2 bg-gradient-to-r from-red-800 to-red-900 text-white font-bold rounded-lg hover:from-red-900 hover:to-red-950 transition-all shadow-lg disabled:opacity-70 flex items-center">
                                    {migrationSubmitting ? 'Migrating...' : 'Confirm Migration'}
                                </button>
                            </>
                        }
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">COA Form Type</label>
                                    <Select
                                        options={typeOptions.filter((option) => ['RSMI', 'RPCI', 'STOCK_CARD', 'MR'].includes(option.value))}
                                        value={typeOptions.find((option) => option.value === migrationFormType) || null}
                                        onChange={(option: any) => {
                                            const nextType = option?.value || 'RSMI';
                                            setMigrationFormType(nextType);
                                            if (migrationInputText) {
                                                buildMigrationPreview(migrationInputText);
                                            }
                                        }}
                                        styles={customSelectStyles}
                                        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                        menuPosition="fixed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Source / Legacy System Identifier</label>
                                    <input value={migrationSource} onChange={(event) => setMigrationSource(event.target.value)} placeholder="e.g. Legacy Excel 2024 Archive" className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-red-500 focus:border-red-500 h-[42px] px-4" />
                                </div>
                            </div>

                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Upload Old COA Form (Excel .xlsx / .xls / .csv, PDF, DOCX)</label>
                                    <span className="text-[11px] font-semibold text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        Parsers & OCR Active
                                    </span>
                                </div>
                                <input type="file" disabled={isExtractingFile} accept=".xlsx,.xls,.csv,.pdf,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleMigrationFileUpload} className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-red-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-red-800 disabled:opacity-50" />
                                {isExtractingFile ? (
                                    <div className="mt-3 flex items-center gap-2.5 text-sm text-red-900 font-medium bg-red-50 p-3 rounded-xl border border-red-200 animate-pulse">
                                        <svg className="w-4 h-4 animate-spin text-red-800 flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>{ocrStatus || 'Processing file content...'}</span>
                                    </div>
                                ) : migrationFileName ? (
                                    <p className="mt-2 text-sm text-gray-500">Loaded file: <span className="font-semibold text-gray-700">{migrationFileName}</span></p>
                                ) : null}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border border-gray-200 bg-white p-4">
                                <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700"><span className="block font-semibold text-gray-500 uppercase text-[10px]">Form Selected</span><span className="text-sm font-bold text-red-900">{migrationFormType}</span></div>
                                <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800"><span className="block font-semibold uppercase text-[10px]">Ready to Import</span><span className="text-sm font-bold">{migrationValidation.validCount}</span></div>
                                <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800"><span className="block font-semibold uppercase text-[10px]">Missing Data</span><span className="text-sm font-bold">{migrationValidation.invalidCount}</span></div>
                                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800"><span className="block font-semibold uppercase text-[10px]">Duplicate Records</span><span className="text-sm font-bold">{migrationValidation.duplicateCount}</span></div>
                            </div>

                            {migrationPreview.length > 0 && (
                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                                    <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wider mb-2 flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                        Field Mapping Schema ({migrationFormType})
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-xs">
                                            <thead className="bg-gray-200 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
                                                <tr>
                                                    <th className="px-3 py-1.5 text-left">COA Form Field</th>
                                                    <th className="px-3 py-1.5 text-left">Target DB Attribute</th>
                                                    <th className="px-3 py-1.5 text-left">Data Type</th>
                                                    <th className="px-3 py-1.5 text-left">Sample Extracted Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {getFieldMappingMatrix(migrationFormType, migrationPreview).map((mapItem, mIdx) => (
                                                    <tr key={mIdx}>
                                                        <td className="px-3 py-1.5 font-semibold text-gray-900">{mapItem.field}</td>
                                                        <td className="px-3 py-1.5 font-mono text-red-900">{mapItem.dbField}</td>
                                                        <td className="px-3 py-1.5 text-gray-500">{mapItem.type}</td>
                                                        <td className="px-3 py-1.5 font-medium text-gray-800">{String(mapItem.sample || '-')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div ref={migrationPreviewRef}>
                                {migrationPreview.length > 0 ? (
                                    <div className="space-y-8">
                                        {migrationPreview.map((group: any, gIdx: number) => (
                                            <div key={gIdx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                                <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                                    <div>
                                                        <h4 className="text-lg font-bold text-slate-800">Form #{gIdx + 1} <span className="text-sm font-medium text-slate-500 ml-2">(Sheet: {group.sheetName})</span></h4>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                                                            {group.metadata?.topSerialNo && <span className="bg-white px-2 py-1 rounded border shadow-sm">Serial No: <strong>{group.metadata.topSerialNo}</strong></span>}
                                                            {group.metadata?.topDate && <span className="bg-white px-2 py-1 rounded border shadow-sm">Date: <strong>{group.metadata.topDate}</strong></span>}
                                                            {group.metadata?.entityName && <span className="bg-white px-2 py-1 rounded border shadow-sm">Entity: <strong>{group.metadata.entityName}</strong></span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 text-sm font-medium">
                                                        <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">{group.validCount} Valid</span>
                                                        {group.invalidCount > 0 && <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">{group.invalidCount} Invalid</span>}
                                                        {group.duplicateCount > 0 && <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">{group.duplicateCount} Duplicates</span>}
                                                    </div>
                                                </div>
                                                
                                                {/* RSMI Table */}
                                                {migrationFormType === 'RSMI' && (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs">
                                                    <thead className="bg-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-700 font-bold">
                                                        <tr>
                                                            <th className="px-3 py-2.5">RIS No.</th>
                                                            <th className="px-3 py-2.5">Resp. Center Code</th>
                                                            <th className="px-3 py-2.5">Stock No.</th>
                                                            <th className="px-3 py-2.5">Item Description</th>
                                                            <th className="px-3 py-2.5 text-center">Unit</th>
                                                            <th className="px-3 py-2.5 text-right">Qty Issued</th>
                                                            <th className="px-3 py-2.5 text-right">Unit Cost</th>
                                                            <th className="px-3 py-2.5 text-right">Amount</th>
                                                            <th className="px-3 py-2.5">Validation Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {group.items.map((row: any, index: number) => (
                                                            <tr key={`${row.reference || index}-${index}`} className={row.errors.length ? 'bg-red-50/40' : 'hover:bg-gray-50'}>
                                                                <td className="px-3 py-2 font-semibold text-gray-900">{row.reference || '-'}</td>
                                                                <td className="px-3 py-2 text-gray-600">{row.responsibility_center_code || row.center_code || row.department || '-'}</td>
                                                                <td className="px-3 py-2 font-mono text-xs text-gray-700">{row.stock_no || '-'}</td>
                                                                <td className="px-3 py-2 font-medium text-gray-800">{row.item_name || '-'}</td>
                                                                <td className="px-3 py-2 text-center text-gray-600">{row.unit || 'pc'}</td>
                                                                <td className="px-3 py-2 text-right font-bold text-gray-900">{row.quantity || 0}</td>
                                                                <td className="px-3 py-2 text-right text-gray-700">{row.unit_cost ? `₱${Number(row.unit_cost).toLocaleString(undefined, {minimumFractionDigits:2})}` : '₱0.00'}</td>
                                                                <td className="px-3 py-2 text-right font-semibold text-gray-900">{row.amount ? `₱${Number(row.amount).toLocaleString(undefined, {minimumFractionDigits:2})}` : '₱0.00'}</td>
                                                                <td className="px-3 py-2">
                                                                    {row.errors.length > 0 ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">{row.errors[0]}</span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">Ready to Import</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    </table>
                                                </div>
                                                )}

                                                {/* RPCI Table */}
                                                {migrationFormType === 'RPCI' && (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs">
                                                    <thead className="bg-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-700 font-bold">
                                                        <tr>
                                                            <th className="px-3 py-2.5">Stock / Prop No.</th>
                                                            <th className="px-3 py-2.5">Article / Item</th>
                                                            <th className="px-3 py-2.5 text-center">Unit</th>
                                                            <th className="px-3 py-2.5 text-right">Unit Value</th>
                                                            <th className="px-3 py-2.5 text-right">Balance Per Card</th>
                                                            <th className="px-3 py-2.5 text-right">On Hand Count</th>
                                                            <th className="px-3 py-2.5 text-right">Shortage/Overage</th>
                                                            <th className="px-3 py-2.5">Accountable Officer</th>
                                                            <th className="px-3 py-2.5">Validation Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {group.items.map((row: any, index: number) => (
                                                            <tr key={`${row.reference || index}-${index}`} className={row.errors.length ? 'bg-red-50/40' : 'hover:bg-gray-50'}>
                                                                <td className="px-3 py-2 font-mono text-xs font-semibold text-gray-900">{row.reference || row.stock_no || '-'}</td>
                                                                <td className="px-3 py-2 font-medium text-gray-800">{row.item_name || '-'}</td>
                                                                <td className="px-3 py-2 text-center text-gray-600">{row.unit || 'pc'}</td>
                                                                <td className="px-3 py-2 text-right text-gray-700">{row.unit_cost ? `₱${Number(row.unit_cost).toLocaleString(undefined, {minimumFractionDigits:2})}` : '₱0.00'}</td>
                                                                <td className="px-3 py-2 text-right font-bold text-gray-900">{row.quantity || 0}</td>
                                                                <td className="px-3 py-2 text-right text-gray-800">{row.on_hand_count ?? row.quantity ?? 0}</td>
                                                                <td className="px-3 py-2 text-right text-gray-600">{row.shortage_qty || '0'}</td>
                                                                <td className="px-3 py-2 text-gray-600">{row.recipient || row.department || '-'}</td>
                                                                <td className="px-3 py-2">
                                                                    {row.errors.length > 0 ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">{row.errors[0]}</span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">Ready to Import</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    </table>
                                                </div>
                                                )}

                                                {/* STOCK CARD Table */}
                                                {migrationFormType === 'STOCK_CARD' && (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs">
                                                    <thead className="bg-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-700 font-bold">
                                                        <tr>
                                                            <th className="px-3 py-2.5">Date</th>
                                                            <th className="px-3 py-2.5">Reference</th>
                                                            <th className="px-3 py-2.5">Item Description</th>
                                                            <th className="px-3 py-2.5">Stock No.</th>
                                                            <th className="px-3 py-2.5 text-center">Unit</th>
                                                            <th className="px-3 py-2.5 text-right">Receipt Qty</th>
                                                            <th className="px-3 py-2.5 text-right">Issue Qty</th>
                                                            <th className="px-3 py-2.5 text-right">Balance Qty</th>
                                                            <th className="px-3 py-2.5">Issue Office</th>
                                                            <th className="px-3 py-2.5">Validation Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {group.items.map((row: any, index: number) => (
                                                            <tr key={`${row.reference || index}-${index}`} className={row.errors.length ? 'bg-red-50/40' : 'hover:bg-gray-50'}>
                                                                <td className="px-3 py-2 text-gray-600">{row.date || '-'}</td>
                                                                <td className="px-3 py-2 font-semibold text-gray-900">{row.reference || '-'}</td>
                                                                <td className="px-3 py-2 font-medium text-gray-800">{row.item_name || '-'}</td>
                                                                <td className="px-3 py-2 font-mono text-xs text-gray-700">{row.stock_no || '-'}</td>
                                                                <td className="px-3 py-2 text-center text-gray-600">{row.unit || 'Pieces'}</td>
                                                                <td className="px-3 py-2 text-right text-green-700 font-medium">{row.receipt_qty || 0}</td>
                                                                <td className="px-3 py-2 text-right text-gray-900 font-bold">{row.quantity || 0}</td>
                                                                <td className="px-3 py-2 text-right text-gray-800 font-semibold">{row.balance_qty || 0}</td>
                                                                <td className="px-3 py-2 text-gray-600">{row.recipient || row.department || '-'}</td>
                                                                <td className="px-3 py-2">
                                                                    {row.errors.length > 0 ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">{row.errors[0]}</span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">Ready to Import</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    </table>
                                                </div>
                                                )}

                                                {/* MR/MOR Table */}
                                                {(migrationFormType === 'MR' || migrationFormType === 'MOR') && (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs">
                                                    <thead className="bg-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-700 font-bold">
                                                        <tr>
                                                            <th className="px-3 py-2.5">Prop No. / Serial (MR No.)</th>
                                                            <th className="px-3 py-2.5">Date Acquired</th>
                                                            <th className="px-3 py-2.5">Description / Item Name</th>
                                                            <th className="px-3 py-2.5 text-right">Qty</th>
                                                            <th className="px-3 py-2.5 text-center">Unit</th>
                                                            <th className="px-3 py-2.5 text-right">Unit Value / Cost</th>
                                                            <th className="px-3 py-2.5 text-right">Total Value</th>
                                                            <th className="px-3 py-2.5">Received By / Office</th>
                                                            <th className="px-3 py-2.5">Validation Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {group.items.map((row: any, index: number) => (
                                                            <tr key={`${row.reference || index}-${index}`} className={row.errors.length ? 'bg-red-50/40' : 'hover:bg-gray-50'}>
                                                                <td className="px-3 py-2 font-semibold font-mono text-xs text-gray-900">{row.reference || '-'}</td>
                                                                <td className="px-3 py-2 text-gray-600">{row.date || '-'}</td>
                                                                <td className="px-3 py-2 font-medium text-gray-800">{row.item_name || '-'}</td>
                                                                <td className="px-3 py-2 text-right font-bold text-gray-900">{row.quantity || 1}</td>
                                                                <td className="px-3 py-2 text-center text-gray-600">{row.unit || 'pc'}</td>
                                                                <td className="px-3 py-2 text-right text-gray-700">{row.unit_cost ? `₱${Number(row.unit_cost).toLocaleString(undefined, {minimumFractionDigits:2})}` : '₱0.00'}</td>
                                                                <td className="px-3 py-2 text-right font-semibold text-gray-900">{row.amount ? `₱${Number(row.amount).toLocaleString(undefined, {minimumFractionDigits:2})}` : '₱0.00'}</td>
                                                                <td className="px-3 py-2 text-gray-600">{row.recipient || row.department || '-'}</td>
                                                                <td className="px-3 py-2">
                                                                    {row.errors.length > 0 ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">{row.errors[0]}</span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">Ready to Import</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    </table>
                                                </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                                        Upload an old {migrationFormType} COA form file (Excel, PDF, DOCX) to inspect detected records and field mappings before migrating to database.
                                    </div>
                                )}
                            </div>
                        </div>
                    </ReportModal>

                    {/* Main Content Card Container */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
                        {/* Card Header */}
                        <div className="px-6 lg:px-8 py-5 border-b border-gray-200/80 bg-gray-50/50">
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">Official COA Documents Registry</h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Filter, view, or generate official compliance reports for state inventory auditing.</p>
                        </div>

                        {/* Search and Filter Section */}
                        <div className="px-6 lg:px-8 py-4 bg-gray-50/30 border-b border-gray-200/80 flex flex-wrap items-center gap-3">
                            <div className="relative flex-grow sm:w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by title or reference..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs"
                                />
                            </div>
                            <div className="w-full sm:w-64">
                                <Select
                                    options={typeOptions}
                                    value={selectedType}
                                    onChange={setSelectedType}
                                    placeholder="All COA Form Types"
                                    isClearable
                                    classNamePrefix="react-select"
                                    styles={customSelectStyles}
                                />
                            </div>
                            <div className="w-full sm:w-56">
                                <Select
                                    options={referenceOptions}
                                    value={selectedReference}
                                    onChange={setSelectedReference}
                                    placeholder={selectedType ? "Select Reference..." : "Select Type first..."}
                                    isClearable
                                    classNamePrefix="react-select"
                                    styles={customSelectStyles}
                                    isDisabled={referenceOptions.length === 0}
                                />
                            </div>
                        </div>

                        {/* Reports Cards Grid Container */}
                        <div className="p-6 lg:p-8 bg-gray-50/20">
                            {filteredReports.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredReports.map((report) => {
                                        const fullTypeLabel = typeOptions.find(opt => opt.value === report.type)?.label || report.type;

                                        return (
                                            <div key={report.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col relative h-full">

                                                {/* Background Paper Preview Thumbnail */}
                                                {report.type === 'RSMI' && (
                                                    <div className="absolute top-0 right-0 w-32 h-40 opacity-10 pointer-events-none overflow-hidden scale-[0.2] origin-top-right transition-opacity group-hover:opacity-20 translate-x-2 -translate-y-2">
                                                        <Suspense fallback={reportTemplateFallback}>
                                                            <RSMIFormPaper data={{
                                                                entityName: 'University of Camarines Norte',
                                                                serialNo: report.reference,
                                                                fundCluster: 'GF',
                                                                date: report.date || '',
                                                                issuedItems: [
                                                                    { risNo: '1', responsibilityCenterCode: '-', stockNo: '1', itemDescription: 'Sample', unit: 'pc', quantityIssued: 1, unitCost: 100, amount: 100 }
                                                                ],
                                                                recapitulationItems: [
                                                                    { stockNo: '1', quantity: 1, unitCost: '', totalCost: '', uacsObjectCode: '' }
                                                                ],
                                                                supplyCustodianName: '', accountingStaffName: '', accountingDate: ''
                                                            }} />
                                                        </Suspense>
                                                    </div>
                                                )}

                                                {report.type === 'RPCI' && (
                                                    <div className="absolute top-0 right-0 w-44 h-32 opacity-10 pointer-events-none overflow-hidden scale-[0.2] origin-top-right transition-opacity group-hover:opacity-20 translate-x-2 -translate-y-2">
                                                        <Suspense fallback={reportTemplateFallback}>
                                                            <RPCIFormPaper data={{
                                                                entity_name: 'University of Camarines Norte',
                                                                as_at_date: report.date || '',
                                                                fund_cluster: 'GF',
                                                                inventory_type: report.title,
                                                                items: [
                                                                    { article: 'Sample', description: '-', stock_no: '1', unit: 'pc', unit_value: 100, balance_per_card: 10, on_hand_count: 10, shortage_qty: '', shortage_value: '', remarks: '' }
                                                                ]
                                                            }} />
                                                        </Suspense>
                                                    </div>
                                                )}

                                                {report.type === 'STOCK_CARD' && (
                                                    <div className="absolute top-0 right-0 w-32 h-40 opacity-10 pointer-events-none overflow-hidden scale-[0.2] origin-top-right transition-opacity group-hover:opacity-20 translate-x-2 -translate-y-2">
                                                        <Suspense fallback={reportTemplateFallback}>
                                                            <StockCardFormPaper data={{
                                                                entity_name: 'University of Camarines Norte',
                                                                item: report.itemName || report.title,
                                                                stock_no: items.find((item: any) => item.name === report.itemName)?.sku || report.reference,
                                                                entries: []
                                                            }} />
                                                        </Suspense>
                                                    </div>
                                                )}

                                                {(report.type === 'MR' || report.type === 'MOR') && (
                                                    <div className="absolute top-0 right-0 w-32 h-40 opacity-10 pointer-events-none overflow-hidden scale-[0.2] origin-top-right transition-opacity group-hover:opacity-20 translate-x-2 -translate-y-2">
                                                        <Suspense fallback={reportTemplateFallback}>
                                                            <MRFormPaper data={{
                                                                entityName: 'University of Camarines Norte',
                                                                fundCluster: 'GF',
                                                                mrNo: report.reference,
                                                                date: report.date || '',
                                                                items: [
                                                                    { quantity: 1, unit: 'pc', description: 'Sample Property', propertyNo: 'PROP-001', dateAcquired: '', unitValue: 1000, totalValue: 1000 }
                                                                ],
                                                                receivedByName: '', issuedByName: ''
                                                            }} />
                                                        </Suspense>
                                                    </div>
                                                )}

                                                <div className="p-5 flex-1 relative z-10">
                                                    <div className="flex justify-between items-start mb-3 gap-3">
                                                        <span className="px-2.5 py-1 rounded text-[10px] font-black bg-red-950 text-amber-300 uppercase shadow-xs leading-tight text-left font-mono">
                                                            {fullTypeLabel}
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-700 flex-shrink-0 whitespace-nowrap">
                                                            Ref: {report.reference}
                                                        </span>
                                                    </div>
                                                    {report.supplierName && (
                                                        <p className="text-xs text-gray-500 mb-1.5 font-medium">Supplier: <span className="font-semibold text-gray-800">{report.supplierName}</span></p>
                                                    )}
                                                    <h3 className="text-base font-bold text-gray-900 group-hover:text-red-900 transition-colors mb-2 line-clamp-2 font-serif">{report.title}</h3>
                                                </div>

                                                <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between mt-auto">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-mono">Coverage</span>
                                                        <span className="text-xs font-semibold text-gray-700">{report.date}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleView(report)}
                                                            className="px-3 py-1.5 text-xs font-bold text-red-900 hover:bg-red-50 rounded transition-colors flex items-center gap-1.5 border border-red-200 bg-white shadow-xs"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                            Inspect & Print
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
                                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-900">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1 font-serif">No compliance reports found</h3>
                                    <p className="text-gray-500 text-xs max-w-sm">We couldn't find any compliance documents matching your current filters or search terms.</p>
                                    <button onClick={openCreateModal} className="mt-5 text-red-900 font-bold hover:text-red-950 text-xs flex items-center gap-1 uppercase tracking-wider font-mono">
                                        Generate a new report <span aria-hidden="true">&rarr;</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}