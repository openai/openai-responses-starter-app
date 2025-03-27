import pdfParse from 'pdf-parse';
import * as pdfjs from 'pdfjs-dist';
import { CONFIG } from './config';
import { extractTextWithLayout } from './pdf-layout-extraction';
import { performOCR, isScannedPDF } from './pdf-ocr';

// Fix worker configuration for Next.js environment
const isProd = process.env.NODE_ENV === 'production';
const workerPath = isProd
    ? '/pdf.worker.mjs'  // Adjust based on your production static file location
    : new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

/**
 * Enhanced PDF text extraction with performance optimizations and smarter fallbacks
 */
export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    const startTime = Date.now();

    try {
        // First attempt with pdf-parse (fastest method)
        console.log("Attempting text extraction with pdf-parse");
        let pdfData;
        try {
            pdfData = await pdfParse(Buffer.from(buffer));
        } catch (parseError) {
            console.error("pdf-parse error:", parseError);
            pdfData = { text: "" };
        }

        const parseTime = (Date.now() - startTime) / 1000;
        console.log(`pdf-parse completed in ${parseTime.toFixed(1)}s`);

        // Check if the basic extraction yielded sufficient text
        if (pdfData.text && pdfData.text.length > CONFIG.SUFFICIENT_TEXT_LENGTH) {
            console.log(`Text successfully extracted using pdf-parse: ${pdfData.text.length} characters`);
            return pdfData.text;
        }

        // Try advanced layout-aware extraction
        console.log("Attempting text extraction with layout preservation");
        const layoutStartTime = Date.now();
        const layoutText = await extractTextWithLayout(buffer);
        const layoutTime = (Date.now() - layoutStartTime) / 1000;
        console.log(`Layout extraction completed in ${layoutTime.toFixed(1)}s`);

        if (layoutText && layoutText.length > CONFIG.SUFFICIENT_TEXT_LENGTH) {
            console.log(`Text successfully extracted with layout preservation: ${layoutText.length} characters`);
            return layoutText;
        }

        // Perform a quick check if this might be a scanned PDF
        const isScanned = await isScannedPDF(buffer, pdfData.text || layoutText);

        if (isScanned) {
            console.log("Detected scanned PDF, attempting OCR");
            console.warn("WARNING: OCR is resource-intensive and may take significant time");

            const ocrStartTime = Date.now();
            const ocrText = await performOCR(buffer);
            const ocrTime = (Date.now() - ocrStartTime) / 1000;
            console.log(`OCR completed in ${ocrTime.toFixed(1)}s`);

            if (ocrText && ocrText.length > CONFIG.MIN_TEXT_LENGTH) {
                console.log(`Text successfully extracted with OCR: ${ocrText.length} characters`);
                return ocrText;
            }
        }

        // Compare and return the best result
        const pdfLength = pdfData.text?.length || 0;
        const layoutLength = layoutText?.length || 0;

        console.log(`Extraction results: pdf-parse=${pdfLength} chars, layout=${layoutLength} chars`);

        // Return the text with more content
        if (pdfLength > layoutLength) {
            return pdfData.text;
        } else {
            return layoutText;
        }
    } catch (error) {
        console.error('Error extracting text from PDF:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return '';
    }
}

// Re-export from other modules for backward compatibility
export { getEmbedding } from './openai-helpers';
export { CONFIG } from './config';
