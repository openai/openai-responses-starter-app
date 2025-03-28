/**
 * @fileoverview Endpoint API obsługujący zapytania do modeli LLM
 * Obsługuje różnych dostawców (OpenAI, Anthropic itp.) i różne modele
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { load_models } from "@/lib/llm-providers/model_loader";
import { Stream } from "openai/streaming";
import { ChatCompletionChunk, ChatCompletionCreateParamsStreaming } from "openai/resources/chat/completions";
import logger from "@/lib/logger";

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
        logger.info("API_REQUEST", "Pobieranie modeli z OpenRouter API");
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`Błąd HTTP: ${response.status}`);
        }

        const data = await response.json();
        logger.info("API_REQUEST", `Pobrano ${data.data?.length || 0} modeli z OpenRouter API`);
        return data.data || [];
    } catch (error) {
        logger.error("API_ERROR", "Błąd podczas pobierania modeli z OpenRouter:", error);
        return [];
    }
}

/**
 * Obsługuje żądania POST do API.
 * Przekazuje zapytanie do odpowiedniego dostawcy LLM i zwraca odpowiedź jako strumień SSE.
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

        logger.info("API_REQUEST", `Przetwarzanie zapytania: Provider=${provider}, Model=${model}, Web Search=${webSearchEnabled}`);

        // Ładowanie listy modeli
        const models = await load_models();

        // Zmienna do przechowywania faktycznie używanej nazwy modelu
        let model_name = model;

        // Inicjalizacja klienta OpenAI z odpowiednimi ustawieniami
        const openai = new OpenAI({
            apiKey: provider === "openrouter" ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY,
            baseURL: provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined
        });

        // Obsługa wyszukiwania internetowego w zależności od dostawcy
        if (webSearchEnabled) {
            if (provider === "openai") {
                // Zgodnie z najnowszą dokumentacją OpenAI, używamy specjalnych modeli z sufiksem -search-preview
                // https://platform.openai.com/docs/guides/tools-web-search?api-mode=chat

                // Wybór odpowiedniego modelu wyszukiwania
                let search_model = "gpt-4o-search-preview";
                if (model.includes("mini")) {
                    search_model = "gpt-4o-mini-search-preview";
                }

                logger.info("API_REQUEST", `Używanie OpenAI Web Search API z modelem: ${search_model}`);

                // Przygotowanie konfiguracji lokalizacji użytkownika, jeśli jest dostępna
                const user_location = webSearchConfig.user_location ? {
                    type: "approximate" as const,
                    approximate: {
                        country: webSearchConfig.user_location.country || undefined,
                        city: webSearchConfig.user_location.city || undefined,
                        region: webSearchConfig.user_location.region || undefined
                    }
                } : undefined;

                // Konfiguracja dla OpenAI Chat Completions API z web_search_options
                const request_config = {
                    model: search_model,
                    messages,
                    web_search_options: {
                        user_location: user_location,
                        search_context_size: (webSearchConfig.search_context_size as "low" | "medium" | "high") || "medium"
                    },
                    stream: true as const
                };

                logger.info("API_REQUEST", "Wywołanie OpenAI z parametrem web_search_options");
                const response = await openai.chat.completions.create(request_config);
                return create_stream_response(response);

            } else if (provider === "openrouter") {
                // Określenie nazwy modelu z sufiksem :online dla wyszukiwania internetowego
                let router_model_name = model;
                if (!router_model_name.endsWith(":online")) {
                    router_model_name = `${router_model_name}:online`;
                }

                logger.info("API_REQUEST", `Używanie OpenRouter z modelem: ${router_model_name}`);

                // Alternatywna metoda: użycie plugins z id: "web"
                // const request_config = {
                //     model: "openrouter/auto",
                //     messages,
                //     plugins: [{ id: "web" }],
                //     stream: true
                // };

                // Konfiguracja dla OpenRouter z sufiksem :online
                const request_config = {
                    model: router_model_name,
                    messages,
                    stream: true as const
                };

                logger.info("API_REQUEST", "Wywołanie OpenRouter z modelem online");
                // @ts-ignore - ignorujemy potencjalne problemy z typami
                const response = await openai.chat.completions.create(request_config);
                return create_stream_response(response);
            }
        }

        // Standardowe wywołanie bez wyszukiwania internetowego
        logger.info("API_REQUEST", "Standardowe wywołanie API bez wyszukiwania internetowego");

        // Sprawdzenie, czy narzędzia zostały przekazane i czy są tablicą
        const request_tools = Array.isArray(tools) && tools.length > 0 ? tools : undefined;

        // Walidacja modelu - sprawdzenie czy istnieje
        const model_exists = models.some(m => m.id === model);
        if (!model_exists) {
            logger.warn("API_REQUEST", `Model ${model} nie został znaleziony w dostępnych modelach. Używam modelu domyślnego.`);
            if (provider === "openrouter") {
                model_name = "gpt-4o-mini";
            } else {
                model_name = "gpt-3.5-turbo";
            }
        } else {
            model_name = model;
        }

        const request_config: ChatCompletionCreateParamsStreaming = {
            model: model_name,
            messages,
            stream: true
        };

        // Dodaj narzędzia tylko jeśli zostały zdefiniowane
        if (request_tools) {
            request_config.tools = request_tools;
            // Dodaj parallel_tool_calls tylko wtedy, gdy mamy narzędzia
            request_config.parallel_tool_calls = false;
        }

        const stream_response = await openai.chat.completions.create(request_config);
        return create_stream_response(stream_response);
    } catch (error) {
        logger.error("API_ERROR", "Błąd w obsłudze zapytania POST:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Nieznany błąd"
            },
            { status: 500 }
        );
    }
}

/**
 * Tworzy odpowiedź strumieniową z odpowiedzi API
 *
 * Funkcja przetwarza strumień danych z API LLM i konwertuje go do formatu SSE (Server-Sent Events),
 * który może być następnie przesłany do klienta. W zależności od typu zawartości (zwykła wiadomość
 * lub wywołanie narzędzia), odpowiednio oznacza zdarzenia.
 *
 * @param stream_response - Odpowiedź strumieniowa z API modelu językowego
 * @returns Odpowiedź HTTP z danymi strumieniowymi w formacie SSE
 */
function create_stream_response(stream_response: any) {
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream_response) {
                    // Sprawdzenie czy odpowiedź zawiera adnotacje (cytaty URL)
                    const has_annotations = chunk.choices[0]?.delta?.annotations !== undefined;
                    const is_tool_call = chunk.choices[0]?.delta?.tool_calls !== undefined;

                    let event_type = "message";
                    if (is_tool_call) {
                        event_type = "tool_call";
                    } else if (has_annotations) {
                        event_type = "annotated_message";
                    }

                    const data = JSON.stringify({
                        event: event_type,
                        data: chunk
                    });

                    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                }
                controller.close();
            } catch (error) {
                logger.error("STREAM_ERROR", "Błąd w pętli strumieniowej:", error);
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
