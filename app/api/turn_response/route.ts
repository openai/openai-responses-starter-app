import { NextResponse } from "next/server";
import OpenAI from "openai";
import { load_models } from "@/lib/llm-providers/model_loader";

export async function POST(request: Request) {
    try {
        const {
            messages,
            tools,
            provider = "openai",
            model = "gpt-4o-mini",
            web_search_enabled = false
        } = await request.json();

        console.log(`Przetwarzanie zapytania: Provider=${provider}, Model=${model}, Web Search=${web_search_enabled}`);

        // Ładowanie listy modeli
        const models = await load_models();

        // Określenie nazwy modelu z uwzględnieniem suffixu dla wyszukiwania internetowego
        let model_name = model;
        if (provider === "openrouter" && web_search_enabled) {
            model_name = model.endsWith(":online") ? model : `${model}:online`;
            console.log(`Używanie modelu OpenRouter z wyszukiwaniem internetowym: ${model_name}`);
        }

        // Sprawdzenie dostępności modelu
        const model_exists = models.some(m => m.id === (web_search_enabled && provider === "openrouter" ? model_name : model));
        if (!model_exists) {
            console.warn(`Model ${model_name} nie został znaleziony w dostępnych modelach. Używam modelu domyślnego.`);
            model_name = provider === "openrouter" ? "gpt-4o-mini" : "gpt-3.5-turbo";
        }

        // Konfiguracja klienta OpenAI
        const openai = new OpenAI({
            apiKey: provider === "openrouter" ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY,
            baseURL: provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined
        });

        // Konfiguracja zapytania
        const requestConfig: any = {
            model: model_name,
            messages,
            tools,
            stream: true,
            parallel_tool_calls: false,
        };

        // Utworzenie strumienia zdarzeń
        const events = await openai.chat.completions.create(requestConfig);

        // Utworzenie strumienia odczytywalnego
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of events) {
                        const data = JSON.stringify({
                            event: "message",
                            data: event,
                        });
                        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                    }
                    controller.close();
                } catch (error) {
                    console.error("Błąd w pętli strumieniowej:", error);
                    controller.error(error);
                }
            },
        });

        // Zwrócenie strumienia SSE
        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Błąd w obsłudze zapytania POST:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Nieznany błąd",
            },
            { status: 500 }
        );
    }
}
