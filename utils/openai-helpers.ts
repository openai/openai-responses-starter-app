import { OpenAI } from 'openai';

const openai = new OpenAI();

/**
 * Get embedding with retry mechanism for network errors
 */
export async function getEmbedding(text: string): Promise<number[]> {
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: any = null;

    while (retryCount < maxRetries) {
        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text.replace(/\n/g, " ")
            });
            return response.data[0].embedding;
        } catch (error: any) {
            lastError = error;
            retryCount++;

            // Determine if error is retryable
            const isRetryable = error.status === undefined || // Network error
                error.status >= 500 || // Server error
                error.status === 429; // Rate limit

            if (!isRetryable) {
                console.error(`Non-retryable OpenAI API error:`, error);
                break;
            }

            // Exponential backoff with jitter
            const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
            console.warn(`OpenAI API error (attempt ${retryCount}/${maxRetries}), retrying in ${delay}ms:`, error);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.error(`Failed to generate embedding after ${maxRetries} attempts:`, lastError);
    return [];
}
