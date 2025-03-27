import { NextResponse } from 'next/server';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import crypto from 'crypto';
import fs from 'fs';
import { unlink, stat } from 'fs/promises';
import path from 'path';
import { jobQueue, updateJobStatus } from '@/utils/job-queue';
import {
    extractTextFromPDF,
    getEmbedding,
    CONFIG
} from '@/utils/pdf-processing';

const client = new ChromaClient();

// Implement a reusable retry mechanism for API calls
async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    description: string = "operation"
): Promise<T> {
    let retryCount = 0;
    let lastError: any = null;

    while (retryCount < maxRetries) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            retryCount++;

            // Determine if error is retryable (network errors, server errors)
            const isNetworkError = !error.status || error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND';
            const isServerError = error.status >= 500;
            const isRateLimitError = error.status === 429;

            const isRetryable = isNetworkError || isServerError || isRateLimitError;

            if (!isRetryable) {
                console.error(`Non-retryable error in ${description}:`, error);
                break;
            }

            // Exponential backoff with jitter
            const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
            console.warn(`Error in ${description} (attempt ${retryCount}/${maxRetries}), retrying in ${delay}ms`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.error(`Failed ${description} after ${maxRetries} attempts:`, lastError);
    throw lastError;
}

/**
 * Safely clean up a file without crashing if there's an error
 */
async function safelyDeleteFile(filePath: string): Promise<boolean> {
    try {
        if (fs.existsSync(filePath)) {
            await unlink(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
        return false;
    }
}

/**
 * Processes a PDF job from the queue with improved resource management and error handling
 * @param jobId The ID of the job to process
 */
export async function processPDFJob(jobId: string): Promise<void> {
    if (!jobQueue[jobId]) {
        console.error(`Job ${jobId} not found`);
        return;
    }

    const job = jobQueue[jobId];
    const startTime = Date.now();
    let fileBuffer: Buffer | null = null;

    try {
        // Update job status
        updateJobStatus(jobId, 'processing');

        console.log(`Processing PDF job ${jobId}`);

        // Check if file exists - fail early if not
        if (!fs.existsSync(job.filePath)) {
            throw new Error(`File not found: ${job.filePath}`);
        }

        // Get file size for diagnostics
        const fileStats = await stat(job.filePath);
        const fileSizeMB = fileStats.size / (1024 * 1024);
        console.log(`Processing PDF: ${path.basename(job.filePath)}, size: ${fileSizeMB.toFixed(2)} MB`);

        // Set an overall timeout for the entire job
        const jobTimeout = CONFIG.PROCESSING_TIMEOUT * 1000;
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Job processing timed out after ${CONFIG.PROCESSING_TIMEOUT} seconds`)),
                jobTimeout);
        });

        // Create a processing promise that will be raced against the timeout
        const processingPromise = async () => {
            // Read file buffer - do this only once and reuse the buffer
            fileBuffer = fs.readFileSync(job.filePath);

            // Fix: Properly convert Node.js Buffer to ArrayBuffer
            const underlyingArrayBufferSlice = fileBuffer.buffer.slice(
                fileBuffer.byteOffset,
                fileBuffer.byteOffset + fileBuffer.byteLength
            );

            // --- JAWNE RZUTOWANIE TYPU ---
            const finalArrayBuffer = underlyingArrayBufferSlice as ArrayBuffer;
            // --- KONIEC RZUTOWANIA ---


            // Extract text from PDF with retry mechanism
            const text = await withRetry(
                () => extractTextFromPDF(finalArrayBuffer),
                3,
                "text extraction"
            );

            if (!text) {
                throw new Error('Failed to extract text from PDF');
            }

            console.log(`Extracted ${text.length} characters of text`);

            // Generate embedding with retry mechanism
            console.log('Generating text embedding...');
            const embedding = await withRetry(
                () => getEmbedding(text),
                3,
                "embedding generation"
            );

            if (embedding.length === 0) {
                throw new Error('Failed to generate embedding');
            }

            // Get collection with retry mechanism
            console.log(`Storing document in ChromaDB collection: ${job.collectionName}`);
            const collection = await withRetry(
                () => client.getCollection({
                    name: job.collectionName,
                    embeddingFunction: new OpenAIEmbeddingFunction({
                        openai_api_key: process.env.OPENAI_API_KEY || ''
                    })
                }),
                3,
                "collection retrieval"
            );

            if (!collection) {
                throw new Error('Failed to get collection');
            }

            // Add document to collection
            const docId = crypto.randomUUID();
            const filename = path.basename(job.filePath).substring(job.id.length + 1); // Remove jobId_ prefix

            await withRetry(
                () => collection.add({
                    ids: [docId],
                    embeddings: [embedding],
                    documents: [text],
                    metadatas: [{
                        filename,
                        jobId: job.id,
                        fileSize: fileSizeMB.toFixed(2) + ' MB',
                        textLength: text.length,
                        processedAt: new Date().toISOString()
                    }],
                }),
                3,
                "document addition"
            );

            return true;
        };

        // Race processing against timeout
        await Promise.race([processingPromise(), timeoutPromise]);

        // Mark job as completed
        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`PDF job ${jobId} completed successfully in ${totalTime.toFixed(1)}s`);

        updateJobStatus(jobId, 'completed');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing PDF job ${jobId}:`, errorMessage);

        // Update job status
        updateJobStatus(jobId, 'failed', errorMessage);
    } finally {
        // Always clean up resources, even if processing failed
        fileBuffer = null; // Release buffer memory

        // Clean up the temporary file
        try {
            await safelyDeleteFile(job.filePath);
        } catch (cleanupError) {
            console.error(`Error cleaning up after job ${jobId}:`, cleanupError);
        }
    }
}

// Create an endpoint to manually trigger job processing (for testing/admin purposes)
export async function POST(request: Request) {
    try {
        const { jobId } = await request.json();

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        if (!jobQueue[jobId]) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Don't wait for processing to complete
        processPDFJob(jobId).catch(error => {
            console.error(`Error processing job ${jobId}:`, error);
        });

        return NextResponse.json({ message: 'Processing started', jobId });
    } catch (error) {
        console.error('Error starting job processing:', error);
        return NextResponse.json({ error: 'Failed to start job processing' }, { status: 500 });
    }
}
