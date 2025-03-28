type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logs: Array<{
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    data?: any;
}> = [];

const MAX_LOGS = 1000;

function log(level: LogLevel, category: string, message: string, data?: any) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        category,
        message,
        data
    };

    logs.push(entry);
    if (logs.length > MAX_LOGS) {
        logs.shift();
    }

    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `[${entry.timestamp}] [${level.toUpperCase()}] [${category}] ${message}`,
        data
    );

    return entry;
}

export default {
    debug: (category: string, message: string, data?: any) => log('debug', category, message, data),
    info: (category: string, message: string, data?: any) => log('info', category, message, data),
    warn: (category: string, message: string, data?: any) => log('warn', category, message, data),
    error: (category: string, message: string, data?: any) => log('error', category, message, data),
    getLogs: () => [...logs]
};
