import { headers } from "next/headers";

export interface LogContext {
  requestId?: string;
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  error?: unknown;
  [key: string]: unknown;
}

export async function logRequest(
  level: "info" | "warn" | "error",
  message: string,
  context: LogContext = {}
) {
  const headersList = await headers();
  const requestId = headersList.get("x-request-id") || crypto.randomUUID();
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId,
    ...context,
  };

  console.log(JSON.stringify(logEntry));
}

export async function logError(message: string, error: unknown, context: LogContext = {}) {
  await logRequest("error", message, {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error,
    ...context
  });
}
