let exceljsModule: any = null;
let mammothModule: typeof import('mammoth') | null = null;
let pdfjsModule: typeof import('pdfjs-dist/legacy/build/pdf.mjs') | null = null;
let tesseractModule: typeof import('tesseract.js') | null = null;

export interface LoadedParsers {
    exceljs: any;
    mammoth: typeof import('mammoth');
    pdfjs: typeof import('pdfjs-dist/legacy/build/pdf.mjs');
    tesseract: typeof import('tesseract.js');
}

export const loadDocumentParsers = async (): Promise<LoadedParsers> => {
    if (!exceljsModule) {
        exceljsModule = await import('exceljs');
    }

    if (!mammothModule) {
        mammothModule = await import('mammoth');
    }

    if (!pdfjsModule) {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
            import.meta.url,
        ).toString();
        pdfjsModule = pdfjs;
    }

    if (!tesseractModule) {
        tesseractModule = await import('tesseract.js');
    }

    return {
        exceljs: exceljsModule,
        mammoth: mammothModule,
        pdfjs: pdfjsModule,
        tesseract: tesseractModule,
    };
};
