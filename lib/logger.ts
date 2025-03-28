enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

interface LoggerOptions {
    level?: LogLevel;
    prefix?: string;
}

class Logger {
    private level: LogLevel;
    private prefix: string;

    constructor(options: LoggerOptions = {}) {
        this.level = options.level ?? LogLevel.INFO;
        this.prefix = options.prefix ?? "";
    }

    debug(tag: string, message: string, meta?: any) {
        if (this.level <= LogLevel.DEBUG) {
            this._log("DEBUG", tag, message, meta);
        }
    }

    info(tag: string, message: string, meta?: any) {
        // Filtrowanie zdublowanych logów dla tokenu i treści wiadomości
        if ((tag === "ASSISTANT_DEBUG" &&
            (message.startsWith("Token otrzymany:") || message.startsWith("Treść wiadomości:"))) &&
            !process.env.VERBOSE_LOGS) {
            return; // Pomijamy zdublowane logi dla tokenów i treści wiadomości
        }

        if (this.level <= LogLevel.INFO) {
            this._log("INFO", tag, message, meta);
        }
    }

    warn(tag: string, message: string, meta?: any) {
        if (this.level <= LogLevel.WARN) {
            this._log("WARN", tag, message, meta);
        }
    }

    error(tag: string, message: string, meta?: any) {
        if (this.level <= LogLevel.ERROR) {
            this._log("ERROR", tag, message, meta);
        }
    }

    private _log(level: string, tag: string, message: string, meta?: any) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level}] [${tag}] ${message}`;

        if (typeof process !== "undefined" && process.stdout && process.stderr) {
            // Używanie process.stdout.write i process.stderr.write zamiast console.log/error
            // aby zapewnić lepsze przechwytywanie przez terminal VS Code
            if (level === "ERROR") {
                process.stderr.write(formattedMessage + "\n");
                if (meta) process.stderr.write(JSON.stringify(meta) + "\n");
            } else {
                process.stdout.write(formattedMessage + "\n");
                if (meta) process.stdout.write(JSON.stringify(meta) + "\n");
            }
        } else {
            // Zachowujemy również console.log/error dla zgodności wstecznej
            // i dla przeglądarki, gdzie process.stdout/stderr może być niedostępne
            if (level === "ERROR") {
                console.error(formattedMessage, meta ?? "");
            } else if (level === "WARN") {
                console.warn(formattedMessage, meta ?? "");
            } else {
                console.log(formattedMessage, meta ?? "");
            }
        }
    }
}

const logger = new Logger({
    level: process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
});

export default logger;
