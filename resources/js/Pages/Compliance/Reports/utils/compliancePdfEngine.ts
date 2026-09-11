/**
 * Standardized High-Fidelity PDF Generation Engine for Official COA Compliance Forms
 * Generates exact physical A4 outputs (Portrait & Landscape) matching official form proportions.
 */

import { getCompliancePdfConfig } from './printConfig';

export interface ReportPdfMetadata {
    type?: string | null;
    reference?: string | null;
    title?: string | null;
}

export const generateCompliancePdf = async (
    paperElement: HTMLElement,
    reportInfo: ReportPdfMetadata,
): Promise<void> => {
    const config = getCompliancePdfConfig(reportInfo.type);

    // Dynamic import of jspdf and html2canvas for optimal code splitting
    const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
    ]);
    const html2canvas = html2canvasModule.default;

    // Sanitize file name
    const safeName = [reportInfo.type, reportInfo.reference, reportInfo.title]
        .filter(Boolean)
        .join('_')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    const fileName = `${safeName || 'compliance_report'}.pdf`;

    // 1mm = 96 / 25.4 CSS pixels
    const mmToPx = 96 / 25.4;
    const targetPxWidth = Math.round(config.targetWidthMm * mmToPx);

    // Create an isolated, offscreen wrapper with exact physical print width
    // This prevents screen/modal responsive flex constraints from distorting the captured output
    const wrapper = document.createElement('div');
    wrapper.className = 'compliance-pdf-render-wrapper';
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-10000px';
    wrapper.style.top = '0';
    wrapper.style.width = `${targetPxWidth}px`;
    wrapper.style.maxWidth = `${targetPxWidth}px`;
    wrapper.style.minWidth = `${targetPxWidth}px`;
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.margin = '0';
    wrapper.style.padding = '0';
    wrapper.style.zIndex = '-9999';
    wrapper.style.opacity = '1';
    wrapper.style.pointerEvents = 'none';

    // Clone the paper element
    const clone = paperElement.cloneNode(true) as HTMLElement;
    clone.style.width = '100%';
    clone.style.maxWidth = 'none';
    clone.style.minWidth = '0';
    clone.style.margin = '0 auto';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
        // Ensure web fonts are rendered before canvas capture
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        // Capture high-res canvas at 2.5x pixel ratio for crisp official text
        const canvas = await html2canvas(clone, {
            scale: 2.5,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: targetPxWidth,
            width: targetPxWidth,
        });

        const doc = new jsPDF({
            orientation: config.orientation,
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const mmPerPx = config.targetWidthMm / canvasWidth;
        const totalContentHeightMm = canvasHeight * mmPerPx;

        const margin = config.marginMm;
        const printableHeight = config.targetHeightMm;

        // If content fits within a single page, place it top-aligned with official margin
        if (totalContentHeightMm <= printableHeight) {
            const pageData = canvas.toDataURL('image/png');
            doc.addImage(
                pageData,
                'PNG',
                margin,
                margin,
                config.targetWidthMm,
                totalContentHeightMm,
                undefined,
                'FAST',
            );
        } else {
            // Multi-page document: slice the high-res canvas across pages cleanly
            // This maintains 100% font scale and table width without compressing the document
            const pageHeightPx = Math.floor(printableHeight / mmPerPx);
            const totalPages = Math.ceil(canvasHeight / pageHeightPx);

            for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                const srcY = pageIndex * pageHeightPx;
                const srcHeight = Math.min(pageHeightPx, canvasHeight - srcY);

                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvasWidth;
                sliceCanvas.height = srcHeight;
                const ctx = sliceCanvas.getContext('2d');

                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvasWidth, srcHeight);
                    ctx.drawImage(
                        canvas,
                        0,
                        srcY,
                        canvasWidth,
                        srcHeight,
                        0,
                        0,
                        canvasWidth,
                        srcHeight,
                    );
                }

                const sliceData = sliceCanvas.toDataURL('image/png');
                const sliceHeightMm = srcHeight * mmPerPx;

                if (pageIndex > 0) {
                    doc.addPage('a4', config.orientation);
                }

                doc.addImage(
                    sliceData,
                    'PNG',
                    margin,
                    margin,
                    config.targetWidthMm,
                    sliceHeightMm,
                    undefined,
                    'FAST',
                );
            }
        }

        doc.save(fileName);
    } finally {
        // Clean up temporary DOM wrapper
        if (document.body.contains(wrapper)) {
            document.body.removeChild(wrapper);
        }
    }
};
