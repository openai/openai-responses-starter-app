import { NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { jobQueue } from '@/utils/job-queue';

// Temporary storage location for PDF files
const TEMP_STORAGE_DIR = path.join(process.cwd(), 'tmp', 'pdf_queue');

// Create temporary directory if it doesn't exist
async function ensureTempDir() {
  try {
    await mkdir(TEMP_STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
}

// Queue a new job
async function queuePDFJob(buffer: ArrayBuffer, filename: string, collectionName: string): Promise<string> {
  await ensureTempDir();

  const jobId = crypto.randomUUID();
  const filePath = path.join(TEMP_STORAGE_DIR, `${jobId}_${filename}`);

  await writeFile(filePath, Buffer.from(buffer));

  jobQueue[jobId] = {
    id: jobId,
    filePath,
    collectionName,
    status: 'pending',
    created: Date.now()
  };

  console.log(`Queued PDF job ${jobId} for processing`);

  return jobId;
}

function getJobStatus(jobId: string): PDFJob | null {
  return jobQueue[jobId] || null;
}

// Definicja interfejsu PDFJob (przeniesiona z jobQueue.ts)
interface PDFJob {
  id: string;
  filePath: string;
  collectionName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created: number;
  updated?: number;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const collectionName = formData.get('collectionName') as string | null;

    if (!file || !collectionName) {
      return NextResponse.json({ error: 'File and collection name are required' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const filename = file.name;

    const jobId = await queuePDFJob(buffer, filename, collectionName);

    return NextResponse.json({
      message: 'PDF queued for processing',
      jobId,
      status: 'pending',
      filename
    }, { status: 202 });
  } catch (error) {
    console.error('Error queueing PDF job:', error);
    return NextResponse.json({ error: 'Failed to queue PDF processing job' }, { status: 500 });
  }
}
