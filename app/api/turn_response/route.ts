/**
 * @fileoverview Endpoint API obsługujący zapytania do modeli LLM
 * Obsługuje różnych dostawców:
 * - OpenAI (Responses API)
 * - OpenRouter (Chat Completions API z wyszukiwaniem internetowym przez sufiks :online)
 * - Lokalne LLM (Chat Completions API)
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { load_models } from "@/lib/llm-providers/model_loader";
import { Stream } from "openai/streaming";
import { ChatCompletionChunk, ChatCompletionCreateParamsStreaming } from "openai/resources/chat/completions";
import logger from "@/lib/logger";
import fs from 'fs';
import path from 'path';

// Konfiguracja dodatkowego logowania do pliku use.log
const LOG_FILE = path.join(process.cwd(), 'use.log');

/**
 * Zapisuje logi do pliku use.log oraz w konsoli
 *
 * @param {string} level - Poziom logowania (INFO, WARN, ERROR)
 * @param {string} category - Kategoria logu
 * @param {string} message - Wiadomość do zalogowania
 * @param {any} data - Dodatkowe dane do zalogowania (opcjonalnie)
 */
function log_to_file(level: string, category: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const log_message = `[${timestamp}] [${level}] [${category}] ${message}`;
    const log_entry = log_message + (data ? ` ${JSON.stringify(data, null, 2)}` : '');

    // Loguj do konsoli
    console.log(log_entry);

    // Zapisz do pliku
    try {
        fs.appendFileSync(LOG_FILE, log_entry + '\n');
    } catch (error) {
        console.error(`Nie można zapisać do pliku logów: ${error}`);
    }
}

/**
 * Pobiera listę dostępnych modeli OpenRouter
 *
 * @returns {Promise<any[]>} - Tablica modeli OpenRouter
 */
async function fetch_openrouter_models(): Promise<any[]> {
    const url = 'https://openrouter.ai/api/v1/models';
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
    };

    try {
        log_to_file("INFO", "API_REQUEST", "Pobieranie modeli z OpenRouter API");
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`Błąd HTTP: ${response.status}`);
        }

        const data = await response.json();
        log_to_file("INFO", "API_REQUEST", `Pobrano ${data.data?.length || 0} modeli z OpenRouter API`);
        return data.data || [];
    } catch (error) {
        log_to_file("ERROR", "API_ERROR", "Błąd podczas pobierania modeli z OpenRouter:", error);
        return [];
    }
}

/**
 * Obsługuje żądania POST do API.
 * Przekazuje zapytanie do odpowiedniego dostawcy LLM i zwraca odpowiedź jako strumień SSE.
 *
 * Logika routingu:
 * - OpenAI -> Responses API (openai.responses.create)
 * - OpenRouter -> Chat Completions API (openai.chat.completions.create) z :online dla wyszukiwania
 * - Lokalne LLM -> Chat Completions API (openai.chat.completions.create)
 *
 * @param request - Żądanie HTTP zawierające parametry zapytania
 * @returns Strumień SSE z odpowiedzią modelu
 */
export async function POST(request: Request) {
    try {
        const {
            messages,
            tools,
            provider = "openai",
            model = "gpt-4o-mini",
            webSearchEnabled = false,
            webSearchConfig = {}
        } = await request.json();

        log_to_file("INFO", "API_REQUEST", `Przetwarzanie zapytania:`, {
            provider,
            model,
            webSearchEnabled,
            messagesCount: messages.length
        });

        // Ładowanie listy modeli
        const models = await load_models();

        // Inicjalizacja klienta OpenAI z odpowiednimi ustawieniami
        const openai = new OpenAI({
            apiKey: provider === "openrouter" ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY,
            baseURL: provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined
        });

        // ========================== OBSŁUGA OPENAI - RESPONSES API ==========================
        if (provider.toLowerCase() === "openai") {
            log_to_file("INFO", "API_REQUEST", `Używanie OpenAI Responses API dla modelu: ${model}`);

            // Przygotowanie wiadomości do formatu wymaganego przez Responses API
            // Response API używa 'input' zamiast 'messages'
            const input = messages;

            // Przygotowanie narzędzi, w tym wyszukiwania internetowego jeśli włączone
            const response_tools = [];

            // Dodaj narzędzia jeśli są dostępne
            if (Array.isArray(tools) && tools.length > 0) {
                response_tools.push(...tools);
            }

            // Dodaj narzędzie wyszukiwania internetowego, jeśli jest włączone
            if (webSearchEnabled) {
                // Konfiguracja wyszukiwania internetowego dla Responses API
                const web_search_config: any = {};

                // Dodaj lokalizację użytkownika, jeśli dostępna
                if (webSearchConfig.user_location) {
                    web_search_config.user_location = webSearchConfig.user_location;
                }

                // Dodaj rozmiar kontekstu wyszukiwania, jeśli dostępny
                if (webSearchConfig.search_context_size) {
                    web_search_config.search_context_size = webSearchConfig.search_context_size;
                }

                // Narzędzie wyszukiwania internetowego dla Responses API
                const web_search_tool = {
                    type: "web_search",
                    config: web_search_config
                };

                response_tools.push(web_search_tool);
                log_to_file("INFO", "API_REQUEST", "Dodano narzędzie wyszukiwania internetowego dla Responses API", web_search_config);
            }

            // Konfiguracja dla Responses API
            const request_config = {
                model: model,
                input,  // Responses API używa 'input' zamiast 'messages'
                tools: response_tools.length > 0 ? response_tools : undefined,
                stream: true,
                parallel_tool_calls: response_tools.length > 1 ? true : undefined
            };

            log_to_file("INFO", "API_REQUEST", "Wywołanie OpenAI Responses API", {
                model: request_config.model,
                tools_count: response_tools.length,
                web_search: webSearchEnabled
            });

            try {
                // Wywołujemy responses.create zamiast chat.completions.create
                const events = await openai.responses.create(request_config);
                return create_responses_stream(events);
            } catch (error) {
                log_to_file("ERROR", "API_ERROR", "Błąd podczas wywołania Responses API:", error);

                // Jeśli wystąpił błąd z Responses API, spróbuj użyć Chat Completions API jako fallback
                log_to_file("WARN", "API_REQUEST", "Próba użycia Chat Completions API jako fallback");

                const fallback_config: ChatCompletionCreateParamsStreaming = {
                    model: "gpt-3.5-turbo", // Bezpieczny model fallback
                    messages,
                    stream: true
                };

                const stream_response = await openai.chat.completions.create(fallback_config);
                return create_chat_stream_response(stream_response);
            }
        }
        // ========================== OBSŁUGA OPENROUTER - CHAT COMPLETIONS API ==========================
        else if (provider.toLowerCase() === "openrouter") {
            let model_name = model;

            // Obsługa wyszukiwania internetowego przez dodanie sufiksu :online dla OpenRouter
            if (webSearchEnabled && !model_name.endsWith(":online")) {
                model_name = `${model_name}:online`;
                log_to_file("INFO", "API_REQUEST", `Używanie OpenRouter z modelem: ${model_name} (wyszukiwanie internetowe)`);
            } else {
                log_to_file("INFO", "API_REQUEST", `Używanie OpenRouter z modelem: ${model_name}`);
            }

            // Konfiguracja dla OpenRouter
            const request_config = {
                model: model_name,
                messages,
                stream: true
            };

            // Dodaj narzędzia tylko jeśli zostały zdefiniowane
            const request_tools = Array.isArray(tools) && tools.length > 0 ? tools : undefined;
            if (request_tools) {
                // @ts-ignore - OpenRouter może obsługiwać narzędzia nieco inaczej
                request_config.tools = request_tools;
                // @ts-ignore
                request_config.parallel_tool_calls = request_tools.length > 1 ? true : undefined;
            }

            log_to_file("INFO", "API_REQUEST", "Wywołanie OpenRouter Chat Completions API", {
                model: request_config.model,
                tools_present: !!request_tools,
                web_search: webSearchEnabled
            });

            // @ts-ignore - ignorujemy potencjalne problemy z typami
            const response = await openai.chat.completions.create(request_config);
            return create_chat_stream_response(response);
        }
        // ========================== OBSŁUGA LOKALNYCH LLM - CHAT COMPLETIONS API ==========================
        else {
            log_to_file("INFO", "API_REQUEST", `Używanie lokalnego LLM: ${model}`);

            // Walidacja modelu dla lokalnych LLM
            const model_exists = models.some(m => m.id === model);
            let model_name = model;

            if (!model_exists) {
                log_to_file("WARN", "API_REQUEST", `Model ${model} nie został znaleziony. Używam modelu domyślnego.`);
                model_name = "llama-3-8b"; // Domyślny model lokalny
            }

            // Konfiguracja dla Chat Completions API (lokalne LLM)
            const request_config: ChatCompletionCreateParamsStreaming = {
                model: model_name,
                messages,
                stream: true
            };

            // Dodaj narzędzia tylko jeśli zostały zdefiniowane
            const request_tools = Array.isArray(tools) && tools.length > 0 ? tools : undefined;
            if (request_tools) {
                request_config.tools = request_tools;
                request_config.parallel_tool_calls = request_tools.length > 1 ? true : false;
            }

            log_to_file("INFO", "API_REQUEST", "Wywołanie lokalnego LLM przez Chat Completions API", {
                model: model_name,
                tools_present: !!request_tools
            });

            const stream_response = await openai.chat.completions.create(request_config);
            return create_chat_stream_response(stream_response);
        }
    } catch (error) {
        log_to_file("ERROR", "API_ERROR", "Błąd w obsłudze zapytania POST:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Nieznany błąd"
            },
            { status: 500 }
        );
    }
}

/**
 * Tworzy odpowiedź strumieniową z OpenAI Responses API
 *
 * @param events - Strumień zdarzeń z Responses API
 * @returns Odpowiedź HTTP z danymi strumieniowymi w formacie SSE
 */
function create_responses_stream(events: any) {
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const event of events) {
                    // Logowanie typu eventu z Responses API
                    log_to_file("DEBUG", "STREAM", `Otrzymano event typu: ${event.type}`);

                    // Wysyłanie wszystkich eventów do klienta
                    const data = JSON.stringify({
                        event: event.type,
                        data: event,
                    });

                    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                }
                controller.close();
            } catch (error) {
                log_to_file("ERROR", "STREAM_ERROR", "Błąd w pętli strumieniowej Responses API:", error);
                controller.error(error);
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    });
}

/**
 * Tworzy odpowiedź strumieniową z Chat Completions API
 *
 * Funkcja przetwarza strumień danych z Chat Completions API i konwertuje go do formatu SSE,
 * który może być następnie przesłany do klienta. Obsługuje różne typy zawartości.
 *
 * @param stream_response - Odpowiedź strumieniowa z Chat Completions API
 * @returns Odpowiedź HTTP z danymi strumieniowymi w formacie SSE
 */
function create_chat_stream_response(stream_response: any) {
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream_response) {
                    // Sprawdzenie typu zawartości (wiadomość, wywołanie narzędzia, adnotacje)
                    const has_annotations = chunk.choices[0]?.delta?.annotations !== undefined;
                    const is_tool_call = chunk.choices[0]?.delta?.tool_calls !== undefined;

                    let event_type = "message";
                    if (is_tool_call) {
                        event_type = "tool_call";
                    } else if (has_annotations) {
                        event_type = "annotated_message";
                    }

                    // Logowanie typu chunka z Chat Completions API (tylko dla niektórych)
                    if (is_tool_call || has_annotations) {
                        log_to_file("DEBUG", "STREAM", `Przetwarzanie chunka z Chat Completions, typ: ${event_type}`);
                    }

                    const data = JSON.stringify({
                        event: event_type,
                        data: chunk
                    });

                    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                }
                controller.close();
            } catch (error) {
                log_to_file("ERROR", "STREAM_ERROR", "Błąd w pętli strumieniowej Chat Completions:", error);
                controller.error(error);
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    });
}
