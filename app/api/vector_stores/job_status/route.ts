import { NextResponse } from 'next/server';
import { getJob, getJobs, cleanupOldJobs } from '@/utils/job-queue';

// Get status of a single job or list of jobs
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const jobId = url.searchParams.get('jobId');
        const status = url.searchParams.get('status') as any; // Will be filtered if invalid
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;

        // Run cleanup of old jobs occasionally (1% chance per request)
        if (Math.random() < 0.01) {
            const removed = cleanupOldJobs();
            console.log(`Cleaned up ${removed} old jobs`);
        }

        // Get single job if jobId is provided
        if (jobId) {
            const job = getJob(jobId);
            if (!job) {
                return NextResponse.json({ error: 'Job not found' }, { status: 404 });
            }
            return NextResponse.json(job);
        }

        // Otherwise, get a list of jobs
        const jobs = getJobs(limit, status);
        return NextResponse.json({ jobs, count: jobs.length });
    } catch (error) {
        console.error('Error getting job status:', error);
        return NextResponse.json({ error: 'Failed to get job status' }, { status: 500 });
    }
}
