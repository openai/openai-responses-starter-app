import { NextResponse } from "next/server";
import OpenAI from "openai";
import { load_models } from "@/lib/llm-providers/model_loader";
import { ChatCompletionCreateParamsStreaming } from "openai/resources/chat/completions";
import { ResponseCreateParamsStreaming } from "openai/resources/responses";
import logger from "@/lib/logger";

function normalize_model_id(id?: string): string {
    if (!id || typeof id !== "string") return "";
    return id.split("/").pop() || id;
}

function filter_valid_tools(tools: any[]) {
    return tools.filter(
        (tool) =>
            tool &&
            tool.type === "function" &&
            tool.function &&
            typeof tool.function.name === "string" &&
            typeof tool.function.parameters === "object"
    );
}

export async function POST(request: Request) {
    try {
        const {
            messages,
            tools,
            provider = "openai",
            model = "gpt-4o-mini",
            webSearchEnabled = false,
            webSearchConfig = {},
            previous_response_id = null
        } = await request.json();

        logger.info("API_REQUEST", `Przetwarzanie zapytania: Provider=${provider}, Model=${model}, Web Search=${webSearchEnabled}`);
        
        // Dodane logowanie dla tools
        logger.info("API_REQUEST_TOOLS", `Narzędzia przekazane do API: ${JSON.stringify(tools)}`);

        const models = provider === "openrouter" ? await load_models() : [];
        let model_name = model;

        const openai = new OpenAI({
            apiKey: provider === "openrouter" ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY,
            baseURL: provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined
        });

        // Filtrowanie prawidłowych narzędzi - upewnijmy się, że tools jest tablicą
        const valid_tools = tools && Array.isArray(tools) ? filter_valid_tools(tools) : [];
        logger.info("API_REQUEST_TOOLS", `Liczba prawidłowych narzędzi: ${valid_tools.length}`);

        // Sprawdź, czy używamy OpenAI i czy powinniśmy użyć Responses API
        const use_responses_api = provider === "openai" && (webSearchEnabled || model.includes("gpt-4"));

        if (webSearchEnabled) {
            if (provider === "openai") {
                // Użyj Response API dla wyszukiwania internetowego z OpenAI
                if (use_responses_api) {
                    let search_model = model.includes("mini") ? "gpt-4o-mini" : "gpt-4o";
                    logger.info("API_REQUEST", `Używanie OpenAI Responses API z modelem: ${search_model}`);

                    const user_location = webSearchConfig.user_location ? {
                        type: "approximate" as const,
                        country: webSearchConfig.user_location.country || undefined,
                        city: webSearchConfig.user_location.city || undefined,
                        region: webSearchConfig.user_location.region || undefined
                    } : undefined;

                    // --- POPRAWIONA KONSTRUKCJA TABLICY TOOLS ---
                    const api_tools: OpenAI.Beta.Responses.ResponseTool[] = [];

                    // Dodaj web_search jeśli włączone
                    api_tools.push({
                        type: "web_search",
                        web_search: {
                            enabled: true,
                            search_context_size: (webSearchConfig.search_context_size as "low" | "medium" | "high") || "medium",
                            user_location
                        }
                    });

                    // Dodaj funkcje jeśli istnieją
                    if (valid_tools.length > 0) {
                        valid_tools.forEach(tool => {
                            if (tool.function && tool.function.name) {
                                api_tools.push({
                                    type: "function",
                                    name: tool.function.name,
                                    function: {
                                        parameters: tool.function.parameters || {}
                                    }
                                });
                            }
                        });
                    }
                    
                    // Logowanie przygotowanych narzędzi
                    logger.info("API_REQUEST_TOOLS", `Przygotowane narzędzia dla Responses API: ${JSON.stringify(api_tools)}`);
                    
                    // --- KONIEC POPRAWKI ---

                    const request_config: ResponseCreateParamsStreaming = {
                        model: search_model,
                        input: messages,
                        tools: api_tools, // Użyj skonstruowanej tablicy
                        stream: true,
                        ...(previous_response_id ? { previous_response_id } : {})
                    };

                    const response = await openai.responses.create(request_config);
                    return create_stream_response(response, true);
                } else {
                    // Użyj starego API Chat Completions dla wyszukiwania (głównie dla zgodności)
                    let search_model = model.includes("mini") ? "gpt-4o-mini-search-preview" : "gpt-4o-search-preview";
                    logger.info("API_REQUEST", `Używanie OpenAI Web Search API z modelem: ${search_model}`);

                    const user_location = webSearchConfig.user_location ? {
                        type: "approximate" as const,
                        approximate: {
                            country: webSearchConfig.user_location.country || undefined,
                            city: webSearchConfig.user_location.city || undefined,
                            region: webSearchConfig.user_location.region || undefined
                        }
                    } : undefined;

                    const request_config = {
                        model: search_model,
                        messages,
                        web_search_options: {
                            user_location,
                            search_context_size: (webSearchConfig.search_context_size as "low" | "medium" | "high") || "medium"
                        },
                        stream: true as const,
                        ...(valid_tools.length > 0 ? { tools: valid_tools } : {})
                    };

                    const response = await openai.chat.completions.create(request_config);
                    return create_stream_response(response);
                }
            } else if (provider === "openrouter") {
                let router_model_name = model.endsWith(":online") ? model : `${model}:online`;
                logger.info("API_REQUEST", `Używanie OpenRouter z modelem: ${router_model_name}`);

                // Przygotuj dane lokalizacji użytkownika dla OpenRouter
                const user_location = webSearchConfig.user_location ? {
                    country: webSearchConfig.user_location.country || undefined,
                    city: webSearchConfig.user_location.city || undefined,
                    region: webSearchConfig.user_location.region || undefined
                } : undefined;

                const request_config = {
                    model: router_model_name,
                    messages,
                    stream: true as const,
                    ...(valid_tools.length > 0 ? { tools: valid_tools } : {}),
                    // Dodaj konfigurację wyszukiwania dla OpenRouter
                    web_search: {
                        enable: true,
                        search_context_size: (webSearchConfig.search_context_size as "low" | "medium" | "high") || "medium",
                        ...(user_location ? { user_location } : {})
                    }
                };

                // @ts-ignore
                const response = await openai.chat.completions.create(request_config);
                return create_stream_response(response);
            }
        }

        // Dla standardowego użycia (bez wyszukiwania internetowego)
        logger.info("API_REQUEST", "Standardowe wywołanie API bez wyszukiwania internetowego");

        // Sprawdź, czy używamy OpenAI i czy powinniśmy użyć Responses API 
        if (use_responses_api) {
            logger.info("API_REQUEST", `Używanie OpenAI Responses API dla modelu: ${model_name}`);
            
            // --- POPRAWIONA KONSTRUKCJA TABLICY API_TOOLS ---
            const api_tools: OpenAI.Beta.Responses.ResponseTool[] = [];
            
            // Dodaj funkcje, jeśli istnieją
            if (valid_tools.length > 0) {
                valid_tools.forEach(tool => {
                    if (tool.function && tool.function.name) {
                        api_tools.push({
                            type: "function",
                            name: tool.function.name,
                            function: {
                                parameters: tool.function.parameters || {}
                            }
                        });
                    }
                });
            }
            
            // Logowanie przygotowanych narzędzi
            logger.info("API_REQUEST_TOOLS", `Przygotowane narzędzia standardowe dla Responses API: ${JSON.stringify(api_tools)}`);
            // --- KONIEC POPRAWKI ---

            const request_config: ResponseCreateParamsStreaming = {
                model: model_name,
                input: messages,
                stream: true,
                ...(api_tools.length > 0 ? { tools: api_tools } : {}), // Przekaż 'tools' tylko jeśli api_tools nie jest puste
                ...(previous_response_id ? { previous_response_id } : {})
            };
            
            const stream_response = await openai.responses.create(request_config);
            return create_stream_response(stream_response, true);
        } else {
            // Użyj Chat Completions API dla OpenRouter lub innych dostawców
            const model_exists = models.some(m => normalize_model_id(m.id) === model);
            if (!model_exists && provider === "openrouter") {
                const fallback = models.find(m => normalize_model_id(m.id).includes("claude")) ||
                    models.find(m => normalize_model_id(m.id).includes("gpt"));
                model_name = fallback ? normalize_model_id(fallback.id) : "anthropic/claude-3.5-sonnet";
            } else if (!model_exists) {
                model_name = "gpt-3.5-turbo";
            }

            const request_config: ChatCompletionCreateParamsStreaming = {
                model: model_name,
                messages,
                stream: true,
                ...(valid_tools.length > 0 ? {
                    tools: valid_tools,
                    parallel_tool_calls: false
                } : {})
            };

            const stream_response = await openai.chat.completions.create(request_config);
            return create_stream_response(stream_response);
        }

    } catch (error) {
        logger.error("API_ERROR", "Błąd w obsłudze zapytania POST:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd" }, { status: 500 });
    }
}

function create_stream_response(stream_response: any, is_responses_api = false) {
    const stream = new ReadableStream({
        async start(controller) {
            try {
                if (is_responses_api) {
                    // Obsługa strumieniowania dla Responses API
                    for await (const chunk of stream_response) {
                        if (!chunk) {
                            logger.warn("STREAM_DEBUG", "Otrzymano pusty chunk, pomijam");
                            continue;
                        }

                        let event_type = "message";
                        let data: any = null;

                        // Bezpieczne sprawdzenie typu chunka
                        const chunkType = chunk?.type || 'nieznany';
                        const chunkId = chunk?.id || 'brak';
                        
                        logger.info("STREAM_DEBUG", `Otrzymano chunk typu: ${chunkType}, ID: ${chunkId}`);

                        // Dodajemy ID odpowiedzi do wszystkich fragmentów danych
                        const responseId = chunkId !== 'brak' ? chunkId : (chunk?.response_id || "resp_" + Date.now());

                        if (chunk.type === "message_start") {
                            // Początek wiadomości
                            event_type = "message_start";
                            data = {
                                id: responseId, // Przekazujemy ID odpowiedzi
                                choices: [
                                    {
                                        delta: {
                                            role: "assistant",
                                            content: ""
                                        }
                                    }
                                ]
                            };
                        } else if (chunk.type === "text_delta") {
                            // Tekst wiadomości
                            event_type = "message";
                            // Emulacja formatu dane chat.completions
                            data = {
                                id: responseId, // Przekazujemy ID odpowiedzi
                                choices: [
                                    {
                                        delta: {
                                            content: chunk.text || ""
                                        }
                                    }
                                ]
                            };
                        } else if (chunk.type === "tool_call_delta") {
                            // Wywołanie narzędzia - bezpieczny dostęp do właściwości
                            event_type = "tool_call";
                            const toolCall = chunk.tool_call || {};
                            const functionName = toolCall.function?.name || "";
                            const functionArgs = toolCall.function?.arguments || "";
                            const toolCallId = toolCall.id || `tool_${Date.now()}`;
                            const toolCallIndex = typeof toolCall.index === 'number' ? toolCall.index : 0;
                            
                            // Emulacja formatu danych chat.completions dla wywołań narzędzi
                            data = {
                                id: responseId, // Przekazujemy ID odpowiedzi
                                choices: [
                                    {
                                        delta: {
                                            tool_calls: [
                                                {
                                                    index: toolCallIndex,
                                                    id: toolCallId,
                                                    function: {
                                                        name: functionName,
                                                        arguments: functionArgs
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            };
                            
                            // Dodatkowe logowanie dla wywołań narzędzi
                            logger.info("TOOL_CALL_DEBUG", `Chunk tool_call: ${JSON.stringify(toolCall)}`);
                        } else if (chunk.type === "web_search_annotations") {
                            // Adnotacje z wyszukiwania internetowego - bezpieczny dostęp
                            event_type = "annotated_message";
                            const annotations = Array.isArray(chunk.annotations) ? chunk.annotations : [];
                            
                            // Emulacja formatu danych chat.completions dla adnotacji
                            data = {
                                id: responseId, // Przekazujemy ID odpowiedzi
                                choices: [
                                    {
                                        delta: {
                                            annotations: annotations
                                        }
                                    }
                                ]
                            };
                        } else if (chunk.type === "message_stop") {
                            // Koniec wiadomości
                            event_type = "message_stop";
                            data = {
                                id: responseId, // Przekazujemy ID odpowiedzi
                                choices: [
                                    {
                                        delta: {
                                            content: null
                                        }
                                    }
                                ]
                            };
                        } else {
                            // Nierozpoznany typ chunka - logowanie dla debugowania
                            logger.warn("STREAM_DEBUG", `Nieobsługiwany typ chunka: ${chunkType}`);
                            continue; // Przejdź do następnej iteracji pętli
                        }

                        if (data) {
                            const json_data = JSON.stringify({ event: event_type, data });
                            logger.info("STREAM_DEBUG", `Wysyłanie ${event_type} do klienta: ${responseId}`);
                            controller.enqueue(new TextEncoder().encode(`data: ${json_data}\n\n`));
                        }
                    }
                } else {
                    // Obsługa strumieniowania dla Chat Completions API
                    let chatId = `chat_${Date.now()}`;
                    
                    for await (const chunk of stream_response) {
                        if (!chunk) {
                            logger.warn("STREAM_DEBUG", "Otrzymano pusty chunk w Chat Completions API, pomijam");
                            continue;
                        }

                        // Przypisz ID z pierwszego chunka, jeśli jest dostępne
                        if (chunk.id && !chatId.startsWith("chat_")) {
                            chatId = chunk.id;
                        }

                        // Bezpieczne sprawdzanie właściwości chunka
                        const chunkChoices = chunk?.choices || [];
                        const firstChoice = chunkChoices[0] || {};
                        const delta = firstChoice.delta || {};
                        
                        const has_annotations = delta.annotations !== undefined;
                        const is_tool_call = delta.tool_calls !== undefined;

                        let event_type = "message";
                        let data = { ...chunk, id: chatId };

                        if (has_annotations) {
                            event_type = "annotated_message";
                        } else if (is_tool_call) {
                            event_type = "tool_call";
                        } else if ("content" in delta && delta.content === null) {
                            event_type = "message_stop";
                        } else if ("role" in delta && delta.role === "assistant") {
                            event_type = "message_start";
                        }

                        const json_data = JSON.stringify({ event: event_type, data });
                        controller.enqueue(new TextEncoder().encode(`data: ${json_data}\n\n`));
                    }
                }

                controller.close();
            } catch (error) {
                logger.error("STREAM_ERROR", "Błąd w strumieniowaniu:", error);
                controller.error(error);
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
}
