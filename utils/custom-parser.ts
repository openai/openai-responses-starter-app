/**
 * Custom parser for formatting extracted PDF text before embedding and storing
 * This enhances the text quality for better vector search results
 */

/**
 * Format text using custom parser
 * This can be extended with more advanced formatting logic as needed
 */
export async function formatWithCustomParser(text: string): Promise<string> {
  // Apply text formatting rules
  let formattedText = text;
  
  // Remove excessive whitespace
  formattedText = formattedText.replace(/\s+/g, ' ');
  
  // Clean up any artifacts from PDF extraction
  formattedText = formattedText.replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, ' ');
  
  // Normalize line breaks
  formattedText = formattedText.replace(/(\r\n|\n|\r)/gm, "\n");
  
  // Split text into paragraphs for better semantic processing
  const paragraphs = formattedText.split(/\n\s*\n/);
  const cleanedParagraphs = paragraphs
    .map(para => para.trim())
    .filter(para => para.length > 0);
  
  // Rejoin with proper paragraph separation
  formattedText = cleanedParagraphs.join('\n\n');
  
  // Additional processing can be added here, such as:
  // - Table detection and formatting
  // - Header recognition
  // - List formatting
  // - Citation handling
  
  return formattedText;
}

/**
 * Advanced processing to extract structured content from text
 * This can be used for more specialized document types
 */
export async function extractStructuredContent(text: string): Promise<Record<string, any>> {
  // This is a placeholder for more advanced document structure parsing
  // It could extract sections, headers, tables, etc.
  
  // Example implementation that extracts basic document structure
  const lines = text.split('\n');
  const headers = lines.filter(line => 
    line.toUpperCase() === line && line.trim().length > 0 && line.trim().length < 100
  );
  
  // Simple heuristic to find potential section titles
  const sections: Record<string, string[]> = {};
  let currentSection = 'default';
  sections[currentSection] = [];
  
  for (const line of lines) {
    if (headers.includes(line)) {
      currentSection = line.trim();
      sections[currentSection] = [];
    } else if (line.trim()) {
      sections[currentSection].push(line.trim());
    }
  }
  
  return {
    sections,
    metadata: {
      totalSections: Object.keys(sections).length,
      totalLines: lines.length,
      possibleHeaders: headers
    }
  };
}

/**
 * Process text with all available custom parsing methods
 */
export async function processTextWithAllParsers(text: string): Promise<{
  formattedText: string,
  structuredContent: Record<string, any>
}> {
  const [formattedText, structuredContent] = await Promise.all([
    formatWithCustomParser(text),
    extractStructuredContent(text)
  ]);
  
  return {
    formattedText,
    structuredContent
  };
}