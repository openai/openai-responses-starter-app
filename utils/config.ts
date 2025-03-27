/**
 * Centralna konfiguracja dla systemu przetwarzania PDF
 */
export const CONFIG = {
    // Text extraction thresholds
    LINE_THRESHOLD: Number(process.env.PDF_LINE_THRESHOLD || '5'),     // Threshold for line break detection
    PARA_THRESHOLD: Number(process.env.PDF_PARA_THRESHOLD || '10'),    // Threshold for paragraph break detection
    COLUMN_THRESHOLD: Number(process.env.PDF_COLUMN_THRESHOLD || '50'), // Threshold for column detection

    // OCR settings - optimized for performance/quality balance
    OCR_LANGUAGE: process.env.OCR_LANGUAGE || 'eng',
    OCR_MAX_PAGES: Number(process.env.OCR_MAX_PAGES || '10'),   // Reduced from 20 for better performance
    OCR_SCALE: Number(process.env.OCR_SCALE || '1.2'),          // Reduced from 1.5 - good balance between quality and speed
    OCR_MAX_TIME_SECONDS: Number(process.env.OCR_MAX_TIME_SECONDS || '300'), // 5 minute timeout for OCR
    OCR_PAGE_SEG_MODE: Number(process.env.OCR_PAGE_SEG_MODE || '1'), // 1 = automatic page segmentation with OSD

    // Text detection thresholds
    MIN_TEXT_LENGTH: Number(process.env.MIN_TEXT_LENGTH || '100'),
    SUFFICIENT_TEXT_LENGTH: Number(process.env.SUFFICIENT_TEXT_LENGTH || '300'), // Increased to ensure enough text

    // Performance optimization
    MAX_ITEMS_PER_PAGE: Number(process.env.MAX_ITEMS_PER_PAGE || '5000'), // Limit items processed per page
    ENABLE_DYNAMIC_SCALING: process.env.ENABLE_DYNAMIC_SCALING !== 'false', // Enable smart resource allocation
    PROCESSING_TIMEOUT: Number(process.env.PROCESSING_TIMEOUT || '600'), // 10 minute overall timeout
};

/**
 * Analyzes document complexity to determine optimal processing settings
 * @param pageCount Number of pages in document
 * @param avgItemsPerPage Average number of text items per page
 * @returns Optimized settings for this document
 */
export function getOptimalProcessingSettings(pageCount: number, avgItemsPerPage: number) {
    // Start with default settings
    const settings = {
        ocrScale: CONFIG.OCR_SCALE,
        maxPages: CONFIG.OCR_MAX_PAGES,
        pageSegMode: CONFIG.OCR_PAGE_SEG_MODE,
        enableLayout: true
    };

    // Adjust based on document size and complexity
    if (pageCount > 50) {
        // For very large documents, be more conservative
        settings.maxPages = Math.min(5, CONFIG.OCR_MAX_PAGES);
        settings.ocrScale = 1.0; // Lower scale for faster processing
    } else if (pageCount > 20) {
        settings.maxPages = Math.min(8, CONFIG.OCR_MAX_PAGES);
        settings.ocrScale = 1.1;
    }

    // Adjust based on item density (text complexity)
    if (avgItemsPerPage > 2000) {
        // Very complex pages - optimize for performance
        settings.enableLayout = false; // Skip complex layout preservation
    } else if (avgItemsPerPage < 100) {
        // Sparse text - might be a scanned document, optimize OCR
        settings.ocrScale = Math.min(1.5, CONFIG.OCR_SCALE); // Higher scale for better OCR
        settings.pageSegMode = 3; // Fully automatic page segmentation, but no OSD (faster)
    }

    return settings;
}
