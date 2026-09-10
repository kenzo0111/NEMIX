export const extractTextFromDocx = async (
    file: File,
    mammoth: any,
    tesseract: any,
    onStatus?: (msg: string) => void,
): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    onStatus?.('Extracting text from DOCX...');
    const result = await mammoth.extractRawText({ arrayBuffer });
    let text = result.value || '';

    // Fallback to OCR if raw text is empty or minimal (scanned images inside DOCX)
    if (text.trim().length < 20) {
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
            let ocrTextCombined = '';
            for (let i = 0; i < imageSrcs.length; i += 1) {
                onStatus?.(`Running OCR on image ${i + 1} of ${imageSrcs.length}...`);
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
};
