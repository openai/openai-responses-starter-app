import * as pdfjs from 'pdfjs-dist';
import { CONFIG, getOptimalProcessingSettings } from './config';

// Enhanced interface for PDF text items
export interface PDFTextItem {
    str: string;
    transform: number[];
    width?: number;
    height?: number;
    fontName?: string;
    fontSize?: number;
}

// Type guard to ensure objects are valid PDFTextItems
export function isPDFTextItem(item: any): item is PDFTextItem {
    return item &&
        typeof item.str === 'string' &&
        Array.isArray(item.transform) &&
        item.transform.length >= 6;
}

/**
 * Enhanced text extraction with improved layout preservation and performance optimizations
 * @param buffer PDF buffer
 * @returns Extracted text with layout preserved
 */
export async function extractTextWithLayout(buffer: ArrayBuffer): Promise<string> {
    const startTime = Date.now();

    try {
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        let text = '';

        // Sample document to determine complexity
        let sampleItemCount = 0;
        for (let i = 1; i <= Math.min(3, pdf.numPages); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            sampleItemCount += content.items.length;
        }

        const avgItemsPerPage = sampleItemCount / Math.min(3, pdf.numPages);
        const settings = getOptimalProcessingSettings(pdf.numPages, avgItemsPerPage);

        console.log(`Document layout analysis: ${pdf.numPages} pages, ~${Math.round(avgItemsPerPage)} items/page`);

        // Skip complex layout preservation if document is too dense and enabled dynamic scaling
        const useSimplifiedLayout = CONFIG.ENABLE_DYNAMIC_SCALING && !settings.enableLayout;

        if (useSimplifiedLayout) {
            console.log('Using simplified layout extraction for complex document');
        }

        // Track columns across document
        let documentColumns: number[][] = [];

        // Process each page
        for (let i = 1; i <= pdf.numPages; i++) {
            // Check timeout
            if (Date.now() - startTime > CONFIG.PROCESSING_TIMEOUT * 1000) {
                console.warn(`Layout extraction timeout reached after ${i - 1} pages`);
                break;
            }

            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            // For very complex pages, limit number of items processed
            let items = (content.items as any[]).filter(isPDFTextItem);

            if (items.length > CONFIG.MAX_ITEMS_PER_PAGE && CONFIG.ENABLE_DYNAMIC_SCALING) {
                console.log(`Page ${i} has ${items.length} items, limiting to ${CONFIG.MAX_ITEMS_PER_PAGE}`);
                items = items.slice(0, CONFIG.MAX_ITEMS_PER_PAGE);
            }

            // Simplified layout processing for complex documents
            if (useSimplifiedLayout) {
                // Simple text gathering with basic sorting
                items.sort((a, b) => {
                    // Simple top-to-bottom, left-to-right sorting
                    const yDiff = b.transform[5] - a.transform[5];
                    if (Math.abs(yDiff) > 10) return yDiff;
                    return a.transform[4] - b.transform[4];
                });

                let lineText = '';
                let lastY: number | null = null;

                for (const item of items) {
                    const currentY = item.transform[5];

                    // Very simple line break detection
                    if (lastY !== null && Math.abs(lastY - currentY) > 10) {
                        text += lineText.trim() + '\n';
                        lineText = '';
                    }

                    if (lineText.length > 0 && !lineText.endsWith(' ')) {
                        lineText += ' ';
                    }
                    lineText += item.str;
                    lastY = currentY;
                }

                if (lineText.trim()) {
                    text += lineText.trim() + '\n';
                }

                text += '\n';
                continue; // Skip to next page
            }

            // Enhanced sorting optimization - sort only when needed (not for simple documents)
            if (items.length > 100) {
                items = items.sort((a, b) => {
                    if (Math.abs(a.transform[5] - b.transform[5]) > CONFIG.LINE_THRESHOLD) {
                        return b.transform[5] - a.transform[5];
                    }
                    return a.transform[4] - b.transform[4];
                });
            }

            // Skip empty pages
            if (items.length === 0) {
                continue;
            }

            // Detect columns in this page - only for sufficiently complex pages
            let columnPositions = items.length > 50 ? detectColumns(items) : [];
            documentColumns.push(columnPositions);

            let lastY: number | null = null;
            let lastX: number | null = null;
            let lineText = '';
            let lastFontSize: number | null = null;

            // Process sorted items
            for (const item of items) {
                const currentY = item.transform[5];
                const currentX = item.transform[4];
                const fontSize = item.fontSize || 0;

                // New paragraph detection
                if (lastY !== null && Math.abs(lastY - currentY) > CONFIG.PARA_THRESHOLD) {
                    if (lineText.trim()) {
                        text += lineText.trim() + '\n\n';
                        lineText = '';
                    }
                }
                // New line detection
                else if (lastY !== null && Math.abs(lastY - currentY) > CONFIG.LINE_THRESHOLD) {
                    if (lineText.trim()) {
                        text += lineText.trim() + '\n';
                        lineText = '';
                    }
                }
                // Column detection - if we jump back significantly in X position
                else if (lastX !== null && lastY !== null &&
                    Math.abs(lastY - currentY) < CONFIG.LINE_THRESHOLD &&
                    (lastX - currentX) > CONFIG.COLUMN_THRESHOLD) {
                    if (lineText.trim()) {
                        text += lineText.trim() + '\n';
                        lineText = '';
                    }
                }
                // Detect possible heading by font size change (only for complex documents)
                else if (items.length > 200 && lastFontSize !== null && fontSize > lastFontSize * 1.5) {
                    if (lineText.trim()) {
                        text += lineText.trim() + '\n\n';
                        lineText = '';
                    }
                }

                // Add word with proper spacing
                if (lineText.length > 0 && !lineText.endsWith(' ')) {
                    lineText += ' ';
                }
                lineText += item.str;

                // Update trackers
                lastY = currentY;
                lastX = currentX;
                lastFontSize = fontSize;
            }

            // Add the last line of the page
            if (lineText.trim()) {
                text += lineText.trim() + '\n';
            }

            // Add page separator
            text += '\n';

            // Log progress for large documents
            if (pdf.numPages > 10 && i % 10 === 0) {
                console.log(`Layout extraction progress: ${i}/${pdf.numPages} pages processed`);
            }
        }

        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`Layout extraction completed in ${totalTime.toFixed(1)}s`);

        return text.trim();
    } catch (error) {
        console.error('Error extracting text with layout:', error);
        return '';
    }
}

/**
 * Optimized column detection algorithm with filtering for noise
 */
export function detectColumns(items: PDFTextItem[]): number[] {
    // Optimization: Skip column detection for simple documents
    if (items.length < 50) return [];

    // Extract X positions and calculate frequency distribution
    const xPositions = items.map(item => item.transform[4]);
    const xFrequency: { [key: number]: number } = {};

    // Determine appropriate clustering size - dynamic based on page width
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions);
    const pageWidth = maxX - minX;

    // Adjust clustering size based on page width
    const clusterSize = Math.max(5, Math.floor(pageWidth / 100));

    // Build frequency histogram with appropriate clustering
    xPositions.forEach(x => {
        const rounded = Math.round(x / clusterSize) * clusterSize;
        xFrequency[rounded] = (xFrequency[rounded] || 0) + 1;
    });

    // Find significant peaks in the distribution
    const threshold = items.length * 0.08; // Lower threshold to detect more columns
    const potentialColumns = Object.entries(xFrequency)
        .filter(([_, freq]) => freq > threshold)
        .map(([pos, _]) => parseInt(pos))
        .sort((a, b) => a - b);

    // Filter peaks that are too close to each other
    const minColumnSeparation = clusterSize * 3;
    const columns: number[] = [];

    for (let i = 0; i < potentialColumns.length; i++) {
        const current = potentialColumns[i];

        // Add first column automatically
        if (i === 0) {
            columns.push(current);
            continue;
        }

        const prev = columns[columns.length - 1];

        // Only add if sufficiently far from previous column
        if (current - prev >= minColumnSeparation) {
            columns.push(current);
        }
    }

    return columns;
}
