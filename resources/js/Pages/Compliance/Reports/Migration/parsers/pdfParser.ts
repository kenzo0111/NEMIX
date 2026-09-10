export const extractTextFromPdf = async (
    file: File,
    pdfjs: any,
    tesseract: any,
    onStatus?: (msg: string) => void,
): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();

    try {
        onStatus?.('Reading PDF pages...');
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let extractedText = '';

        for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
            onStatus?.(`Reading PDF text (page ${pageIndex}/${pdf.numPages})...`);
            const page = await pdf.getPage(pageIndex);
            const textContent = await page.getTextContent();
            let pageText = textContent.items
                .map((item: any) => ('str' in item ? item.str : ''))
                .filter(Boolean)
                .join(' ');

            // If direct text extraction yields empty/minimal text (scanned PDF page), run Tesseract OCR
            if (pageText.trim().length < 20) {
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
};
