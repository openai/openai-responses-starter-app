// Custom type definitions for libraries without proper TypeScript support

// For any missing Tesseract.js types
declare module 'tesseract.js' {
    export function createWorker(language: string): Promise<any>;
    // Add other types as needed
}

// Add other module declarations if needed
