import fs from 'fs';
import path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logs: Array<{
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    data?: any;
}> = [];

const MAX_LOGS = 1000;
const LOG_FILE = path.join(process.cwd(), 'use.log');

/**
 * Zapisuje wpis logowania do pliku use.log
 *
 * @param entry - Wpis logowania do zapisania
 */
function save_to_file(entry: any) {
    try {
        const log_text = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}${entry.data ? ' ' + JSON.stringify(entry.data, null, 2) : ''}\n`;
        fs.appendFileSync(LOG_FILE, log_text);
    } catch (error) {
        console.error(`Nie można zapisać logu do pliku: ${error}`);
    }
}

/**
 * Rejestruje wiadomość w systemie logowania
 * Logi są przechowywane w pamięci, wyświetlane w konsoli i zapisywane do pliku use.log
 *
 * @param level - Poziom logowania ('debug', 'info', 'warn', 'error')
 * @param category - Kategoria logu (np. 'API_REQUEST', 'TOOLS')
 * @param message - Wiadomość do zalogowania
 * @param data - Opcjonalne dane dodatkowe
 * @returns Utworzony wpis logowania
 */
function log(level: LogLevel, category: string, message: string, data?: any) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        category,
        message,
        data
    };

    // Dodaj do pamięci podręcznej
    logs.push(entry);
    if (logs.length > MAX_LOGS) {
        logs.shift();
    }

    // Wypisz do konsoli
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `[${entry.timestamp}] [${level.toUpperCase()}] [${category}] ${message}`,
        data
    );

    // Zapisz do pliku
    save_to_file(entry);

    return entry;
}

export default {
    debug: (category: string, message: string, data?: any) => log('debug', category, message, data),
    info: (category: string, message: string, data?: any) => log('info', category, message, data),
    warn: (category: string, message: string, data?: any) => log('warn', category, message, data),
    error: (category: string, message: string, data?: any) => log('error', category, message, data),
    getLogs: () => [...logs]
};
