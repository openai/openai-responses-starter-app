import { NextResponse } from "next/server";
import OpenAI from "openai";
import { load_models } from "@/lib/llm-providers/model_loader";
import { ChatCompletionCreateParamsStreaming } from "openai/resources/chat/completions";
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
            webSearchConfig = {}
        } = await request.json();

        logger.info("API_REQUEST", `Przetwarzanie zapytania: Provider=${provider}, Model=${model}, Web Search=${webSearchEnabled}`);

        const models = provider === "openrouter" ? await load_models() : [];
        let model_name = model;

        const openai = new OpenAI({
            apiKey: provider === "openrouter" ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY,
            baseURL: provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined
        });

        const valid_tools = tools && Array.isArray(tools) ? filter_valid_tools(tools) : [];

        if (webSearchEnabled) {
            if (provider === "openai") {
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

        logger.info("API_REQUEST", "Standardowe wywołanie API bez wyszukiwania internetowego");

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

    } catch (error) {
        logger.error("API_ERROR", "Błąd w obsłudze zapytania POST:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd" }, { status: 500 });
    }
}

function create_stream_response(stream_response: any) {
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream_response) {
                    const has_annotations = chunk.choices[0]?.delta?.annotations !== undefined;
                    const is_tool_call = chunk.choices[0]?.delta?.tool_calls !== undefined;

                    let event_type = "message";
                    if (is_tool_call) event_type = "tool_call";
                    else if (has_annotations) event_type = "annotated_message";

                    const data = JSON.stringify({ event: event_type, data: chunk });
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
