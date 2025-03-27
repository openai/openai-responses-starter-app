import * as pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { Canvas, createCanvas } from 'canvas'; // For node-canvas fallback
import { CONFIG, getOptimalProcessingSettings } from './config';

/**
 * Detects if a PDF is likely image-based/scanned by analyzing text content
 * @param buffer PDF buffer
 * @param text Initial extracted text
 * @returns True if PDF is likely scanned
 */
export async function isScannedPDF(buffer: ArrayBuffer, text: string): Promise<boolean> {
    if (text && text.length > CONFIG.MIN_TEXT_LENGTH) {
        return false;
    }

    try {
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        const pageCount = Math.min(3, pdf.numPages);

        let totalItems = 0;
        for (let i = 1; i <= pageCount; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            totalItems += content.items.length;

            // If any page has sufficient text content, probably not scanned
            if (content.items.length > 20) {
                return false;
            }
        }

        // If average items per page is very low, likely a scanned document
        return (totalItems / pageCount) < 5;
    } catch (error) {
        console.error('Error checking if PDF is scanned:', error);
        return true;
    }
}

/**
 * Performs OCR on a PDF using Tesseract.js with optimized settings
 * @param buffer PDF buffer
 * @returns Extracted text
 */
export async function performOCR(buffer: ArrayBuffer): Promise<string> {
    const startTime = Date.now();
    const maxTimeMs = CONFIG.OCR_MAX_TIME_SECONDS * 1000;
    let worker = null;

    try {
        console.log("Performing OCR on PDF with optimized settings");

        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        let completeText = '';

        // Sample first few pages to determine document complexity
        let sampleItemCount = 0;
        for (let i = 1; i <= Math.min(3, pdf.numPages); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            sampleItemCount += content.items.length;
        }

        const avgItemsPerPage = sampleItemCount / Math.min(3, pdf.numPages);
        const settings = getOptimalProcessingSettings(pdf.numPages, avgItemsPerPage);

        console.log(`Document analysis: ${pdf.numPages} pages, ~${Math.round(avgItemsPerPage)} items/page`);
        console.log(`Using OCR settings: scale=${settings.ocrScale}, maxPages=${settings.maxPages}, segMode=${settings.pageSegMode}`);

        // Limit pages for OCR processing
        const pageCount = Math.min(settings.maxPages, pdf.numPages);

        // Create worker with optimal settings - tracked globally for cleanup
        worker = await createWorker(CONFIG.OCR_LANGUAGE);

        // Set Tesseract page segmentation mode
        await worker.setParameters({
            tessedit_pageseg_mode: settings.pageSegMode.toString()
        });

        let processedPages = 0;
        let failedPages = 0;

        // Process pages in parallel with a limited concurrency
        const parallelLimit = 2; // Process up to 2 pages at once

        for (let i = 0; i < pageCount; i += parallelLimit) {
            // Check timeout
            if (Date.now() - startTime > maxTimeMs) {
                console.warn(`OCR timeout reached after ${processedPages} pages`);
                break;
            }

            // Check if too many pages have failed
            if (failedPages > pageCount / 3) {
                console.error(`Too many OCR page failures (${failedPages}/${processedPages + failedPages}), aborting OCR`);
                break;
            }

            const pagePromises = [];
            for (let j = 0; j < parallelLimit && i + j < pageCount; j++) {
                const pageNum = i + j + 1;
                pagePromises.push(processPage(pdf, pageNum, worker, settings.ocrScale));
            }

            // Wait for current batch to complete
            const results = await Promise.allSettled(pagePromises);

            // Process results
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    if (result.value) {
                        completeText += result.value + '\n\n';
                        processedPages++;
                    } else {
                        failedPages++;
                    }
                } else {
                    console.error(`OCR page processing rejected: ${result.reason}`);
                    failedPages++;
                }
            }

            // Report progress
            console.log(`OCR progress: ${processedPages}/${pageCount} pages processed, ${failedPages} failed`);
        }

        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`OCR completed in ${totalTime.toFixed(1)}s for ${processedPages} pages (${failedPages} failed)`);

        return completeText.trim();
    } catch (error) {
        console.error('Error performing OCR:', error);
        return '';
    } finally {
        // Ensure worker is terminated regardless of success or failure
        if (worker) {
            try {
                console.log("Terminating Tesseract worker...");
                await worker.terminate();
            } catch (terminateError) {
                console.error("Error terminating Tesseract worker:", terminateError);
            }
        }
    }
}

/**
 * Process a single page for OCR with better error handling and canvas fallbacks
 */
async function processPage(pdf: any, pageNum: number, worker: any, scale: number): Promise<string> {
    // Set a timeout for single page processing to prevent hanging
    const pageTimeout = CONFIG.OCR_MAX_TIME_SECONDS * 1000 / 3; // 1/3 of the total OCR time

    try {
        console.log(`OCR processing page ${pageNum}`);

        // Create a promise that will be rejected after timeout
        const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error(`OCR page ${pageNum} processing timed out`)), pageTimeout);
        });

        // Process page with timeout
        const processPromise = async (): Promise<string> => {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            let canvas, context;

            // First try OffscreenCanvas, then fallback to node-canvas if available
            if (typeof OffscreenCanvas !== 'undefined') {
                canvas = new OffscreenCanvas(viewport.width, viewport.height);
                const offscreenContext = canvas.getContext('2d');

                if (!offscreenContext) {
                    throw new Error('Failed to get OffscreenCanvas context');
                }

                context = adaptOffscreenCanvasContext(offscreenContext);
            } else {
                // Try to use node-canvas as a fallback
                try {
                    canvas = createCanvas(viewport.width, viewport.height);
                    context = canvas.getContext('2d');

                    if (!context) {
                        throw new Error('Failed to get node-canvas context');
                    }
                } catch (canvasError) {
                    console.error(`Canvas fallback failed for page ${pageNum}:`, canvasError);
                    throw new Error(`No canvas implementation available for OCR on page ${pageNum}`);
                }
            }

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            let imageData;

            // Convert to image based on canvas type
            if ('convertToBlob' in canvas) {
                const blob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
                imageData = blob;
            } else {
                // Node-canvas implementation
                const dataURL = (canvas as Canvas).toDataURL('image/png');
                const base64Data = dataURL.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                imageData = buffer;
            }

            // Perform OCR with error handling
            try {
                const { data } = await worker.recognize(imageData);
                return data.text;
            } catch (ocrError) {
                console.error(`OCR recognition error on page ${pageNum}:`, ocrError);
                return ''; // Return empty string for failed page
            }
        };

        // Race between processing and timeout
        return await Promise.race([processPromise(), timeoutPromise]);
    } catch (error) {
        console.error(`Error processing page ${pageNum} for OCR:`, error);
        return ''; // Return empty string for failed page
    }
}

// Improved error handling for resources and fallbacks
export function adaptOffscreenCanvasContext(
    context: OffscreenCanvasRenderingContext2D
): unknown {
    try {
        return {
            ...context,
            getContextAttributes: () => undefined,
            drawFocusIfNeeded: () => { },
            // Add more missing methods if needed
        } as unknown as CanvasRenderingContext2D;
    } catch (error) {
        console.error("Error adapting canvas context:", error);
        throw new Error("Failed to adapt canvas context");
    }
}
