/**
 * @fileoverview Endpoint API obsługujący zapytania do modeli LLM
 * Obsługuje różnych dostawców (OpenAI, Anthropic itp.) i różne modele
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { load_models } from "@/lib/llm-providers/model_loader";
import { Stream } from "openai/streaming";
import { ChatCompletionChunk, ChatCompletionCreateParamsStreaming } from "openai/resources/chat/completions";

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

        // Konfiguracja zapytania ze zdefiniowanym typem dla strumienia
        const request_config: ChatCompletionCreateParamsStreaming = {
            model: model_name,
            messages,
            tools,
            stream: true,
            parallel_tool_calls: false,
        };

        // Utworzenie strumienia zdarzeń z precyzyjnym typowaniem
        const stream_response = await openai.chat.completions.create(request_config);

        // Utworzenie strumienia odczytywalnego
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Przetwarzanie każdego fragmentu odpowiedzi streama
                    for await (const chunk of stream_response) {
                        // Formatowanie danych dla klienta w formacie SSE
                        const is_tool_call = chunk.choices[0]?.delta?.tool_calls !== undefined;
                        const data = JSON.stringify({
                            event: is_tool_call ? "tool_call" : "message",
                            data: chunk
                        });

                        // Wysłanie sformatowanych danych do klienta
                        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                    }
                    // Zamknięcie strumienia po zakończeniu przetwarzania
                    controller.close();
                } catch (error) {
                    console.error("Błąd w pętli strumieniowej:", error);
                    controller.error(error);
                }
            }
        });

        // Zwrócenie strumienia SSE z odpowiednimi nagłówkami
        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });
    } catch (error) {
        console.error("Błąd w obsłudze zapytania POST:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Nieznany błąd"
            },
            { status: 500 }
        );
    }
}
