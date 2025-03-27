import { NextResponse } from "next/server";
import OpenAI from "openai";
import { LLMProvider } from "@/lib/llm-providers/interfaces";

/**
 * Endpoint API obsługujący zapytania do modeli LLM
 * Obsługuje różnych dostawców (OpenAI, Anthropic itp.) i różne modele
 *
 * @param request - Żądanie HTTP
 * @returns Strumień SSE z odpowiedzią modelu
 */
export async function POST(request: Request) {
    try {
        const { messages, tools, provider = "openai", model = "gpt-4o-mini" } = await request.json();

        console.log(`Przetwarzanie zapytania: Provider=${provider}, Model=${model}`);

        // Domyślna konfiguracja dla OpenAI
        const openai = new OpenAI();

        // Konfiguracja zapytania
        const requestConfig: any = {
            model: model,
            input: messages,
            tools,
            stream: true,
            parallel_tool_calls: false,
        };

        // Utworzenie strumienia zdarzeń
        const events = await openai.responses.create(requestConfig);

        // Utworzenie strumienia odczytywalnego, który emituje dane SSE
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of events as any) {
                        // Wysyłanie wszystkich zdarzeń do klienta
                        const data = JSON.stringify({
                            event: event.type,
                            data: event,
                        });
                        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                    }
                    // Koniec strumienia
                    controller.close();
                } catch (error) {
                    console.error("Błąd w pętli strumieniowej:", error);
                    controller.error(error);
                }
            },
        });

        // Zwracanie strumienia odczytywalnego jako SSE
        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
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
