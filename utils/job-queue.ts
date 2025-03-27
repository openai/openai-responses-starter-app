// Simple job queue management (in a production system, use a proper queue service like BullMQ, AWS SQS, etc.)

export interface PDFJob {
    id: string;
    filePath: string;
    collectionName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created: number;
    updated?: number;
    error?: string;
}

// In-memory job queue (would be a database in production)
export const jobQueue: Record<string, PDFJob> = {};

/**
 * Get a list of all jobs
 * @param limit Optional limit for number of jobs to return
 * @param status Optional filter by status
 */
export function getJobs(limit?: number, status?: PDFJob['status']): PDFJob[] {
    let jobs = Object.values(jobQueue);

    if (status) {
        jobs = jobs.filter(job => job.status === status);
    }

    // Sort by creation time, newest first
    jobs.sort((a, b) => b.created - a.created);

    if (limit && limit > 0) {
        jobs = jobs.slice(0, limit);
    }

    return jobs;
}

/**
 * Get job by ID
 */
export function getJob(jobId: string): PDFJob | null {
    return jobQueue[jobId] || null;
}

/**
 * Update job status
 */
export function updateJobStatus(
    jobId: string,
    status: PDFJob['status'],
    error?: string
): boolean {
    const job = jobQueue[jobId];
    if (!job) return false;

    job.status = status;
    job.updated = Date.now();

    if (error !== undefined) {
        job.error = error;
    }

    return true;
}

/**
 * Clean up old jobs (should be called periodically)
 * @param maxAgeHours Jobs older than this will be removed
 */
export function cleanupOldJobs(maxAgeHours: number = 24): number {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let count = 0;

    for (const jobId in jobQueue) {
        const job = jobQueue[jobId];
        if (job.created < cutoff && (job.status === 'completed' || job.status === 'failed')) {
            delete jobQueue[jobId];
            count++;
        }
    }

    return count;
}
