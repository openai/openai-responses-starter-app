// lib/assistant.ts
import { DEVELOPER_PROMPT } from "@/config/constants";
import { parse } from "partial-json";
import { handleTool } from "@/lib/tools/tools-handling";
import useConversationStore from "@/stores/useConversationStore";
import useToolsStore from "@/stores/useToolsStore";
import { getTools } from "./tools/tools";
import { Annotation } from "@/components/annotations";
import { functionsMap } from "@/config/functions";
import logger from "@/lib/logger";

export interface ContentItem {
    type: "input_text" | "output_text" | "refusal" | "output_audio";
    annotations?: Annotation[];
    text?: string;
}

export interface MessageItem {
    type: "message";
    role: "user" | "assistant" | "system";
    id?: string;
    content: ContentItem[];
}

export interface ToolCallItem {
    type: "tool_call";
    tool_type: "file_search_call" | "web_search_call" | "function_call";
    status: "in_progress" | "completed" | "failed" | "searching";
    id: string;
    name?: string | null;
    call_id?: string;
    arguments?: string;
    parsedArguments?: any;
    output?: string | null;
}

export type Item = MessageItem | ToolCallItem;

export const handleTurn = async (
    messages: any[],
    tools: any[],
    onMessage: (data: any) => void,
    provider: string = "openai",
    model: string = "gpt-4o-mini",
    webSearchEnabled: boolean = false,
    webSearchConfig: any = {}
) => {
    try {
        logger.info("ASSISTANT_DEBUG", `Rozpoczęcie handleTurn: Provider=${provider}, Model=${model}, WebSearch=${webSearchEnabled}`);
        logger.info("ASSISTANT_DEBUG", `WebSearchConfig: ${JSON.stringify(webSearchConfig)}`);

        const response = await fetch("/api/turn_response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages,
                tools,
                provider,
                model,
                webSearchEnabled,
                webSearchConfig,
            }),
        });

        if (!response.ok || !response.body) {
            logger.error("ASSISTANT_DEBUG", `Błąd odpowiedzi: ${response.status} ${response.statusText}`);
            return;
        }

        logger.info("ASSISTANT_DEBUG", "Odpowiedź otrzymana, rozpoczęcie przetwarzania strumienia");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let buffer = "";

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            buffer += chunkValue;

            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6);
                    if (dataStr === "[DONE]") {
                        logger.info("ASSISTANT_DEBUG", "Otrzymano znacznik końca strumienia [DONE]");
                        done = true;
                        break;
                    }
                    try {
                        const data = JSON.parse(dataStr);
                        const eventType = data.event;
                        logger.info("ASSISTANT_DEBUG", `Otrzymano fragment danych typu: ${eventType}`);

                        if (eventType === "message") {
                            const content = data.data?.choices?.[0]?.delta?.content || "";
                            if (content) {
                                logger.info("ASSISTANT_DEBUG", `Treść wiadomości: "${content.length > 50 ? content.substring(0, 50) + '...' : content}"`);
                            }
                        } else if (eventType === "tool_call") {
                            logger.info("ASSISTANT_DEBUG", `Wywołanie narzędzia: ${JSON.stringify(data.data?.choices?.[0]?.delta?.tool_calls || {})}`);
                            useConversationStore.getState().addToolCall?.(data.data);
                        } else if (eventType === "annotated_message") {
                            const annotations = data.data?.choices?.[0]?.delta?.annotations || [];
                            logger.info("ASSISTANT_DEBUG", `Otrzymano adnotowaną wiadomość z ${annotations.length} adnotacjami`);
                            if (annotations.length > 0) {
                                logger.info("ANNOTATION_DEBUG", `Struktura adnotacji: ${JSON.stringify(annotations)}`);
                                // Dodaj obsługę adnotacji - przekazanie ich do stanu konwersacji
                                const messageId = useConversationStore.getState().getLastAssistantMessageId();
                                if (messageId) {
                                    useConversationStore.getState().updateMessageWithAnnotations?.(messageId, annotations);
                                } else {
                                    logger.warn("ANNOTATION_DEBUG", "Nie znaleziono ID ostatniej wiadomości asystenta do dodania adnotacji");
                                }
                            }
                        }

                        onMessage(data);
                    } catch (err) {
                        logger.error("ASSISTANT_DEBUG", `Błąd parsowania danych: ${err}`);
                    }
                }
            }
        }

        if (buffer && buffer.startsWith("data: ")) {
            logger.info("ASSISTANT_DEBUG", "Przetwarzanie końcowego bufora");
            const dataStr = buffer.slice(6);
            if (dataStr !== "[DONE]") {
                try {
                    const data = JSON.parse(dataStr);
                    logger.info("ASSISTANT_DEBUG", `Typ końcowych danych: ${data.event}`);
                    if (data.event === "tool_call") {
                        useConversationStore.getState().addToolCall?.(data.data);
                    }
                    onMessage(data);
                } catch (err) {
                    logger.error("ASSISTANT_DEBUG", `Błąd parsowania końcowego bufora: ${err}`);
                }
            }
        }

        logger.info("ASSISTANT_DEBUG", "Zakończenie przetwarzania odpowiedzi");
    } catch (error) {
        logger.error("ASSISTANT_DEBUG", `Błąd podczas przetwarzania zapytania: ${error}`);
    }
};

export const streamMessages = async ({
    provider = "openai",
    model = "gpt-4o-mini",
    onToken,
    onToolCall,
}: {
    provider?: string;
    model?: string;
    onToken?: (token: string) => void;
    onToolCall?: (toolCall: any) => void;
}) => {
    const { conversationItems } = useConversationStore.getState();
    const tools = getTools();

    // Pobierz konfigurację wyszukiwania z useToolsStore
    const { webSearchEnabled, webSearchConfig } = useToolsStore.getState();

    logger.info("ASSISTANT_DEBUG", `Rozpoczęcie streamMessages: Provider=${provider}, Model=${model}`);
    logger.info("ASSISTANT_DEBUG", `Liczba elementów konwersacji: ${conversationItems.length}`);

    const allConversationItems = [
        { role: "developer", content: DEVELOPER_PROMPT },
        ...conversationItems,
    ];

    await handleTurn(
        allConversationItems,
        tools,
        ({ event, data }) => {
            if (event === "message") {
                const token = data?.choices?.[0]?.delta?.content || "";
                if (onToken && token) {
                    onToken(token);
                }
            } else if (event === "tool_call") {
                logger.info("ASSISTANT_DEBUG", `Otrzymano wywołanie narzędzia`);

                if (data?.choices?.[0]?.delta?.tool_calls) {
                    const toolCallsData = data.choices[0].delta.tool_calls;

                    for (const toolCall of toolCallsData) {
                        if (toolCall.function) {
                            if (toolCall.function.name && toolCall.function.arguments) {
                                try {
                                    const args = parse(toolCall.function.arguments);
                                    const messageAssistantId = useConversationStore.getState().addAssistantMessage();

                                    // Przekazujemy informacje o wywołaniu narzędzia do interfejsu użytkownika
                                    if (onToolCall && (toolCall.function.name === "web_search" || toolCall.type === "web_search")) {
                                        onToolCall({
                                            type: "web_search",
                                            query: args.query || "Wyszukiwanie w sieci...",
                                            timestamp: new Date().toISOString()
                                        });
                                    }

                                    handleTool({
                                        name: toolCall.function.name,
                                        args,
                                        message_id: messageAssistantId,
                                    });
                                } catch (e) {
                                    logger.error("ASSISTANT_DEBUG", `Błąd podczas przetwarzania wywołania narzędzia: ${e}`);
                                }
                            }
                        }
                    }
                }
            } else if (event === "annotated_message") {
                const annotations = data?.choices?.[0]?.delta?.annotations;
                if (annotations && annotations.length > 0) {
                    logger.info("ANNOTATION_DEBUG", `Otrzymano ${annotations.length} adnotacji w streamMessages`);
                    logger.info("ANNOTATION_DEBUG", `Szczegóły adnotacji: ${JSON.stringify(annotations)}`);

                    // Pobierz ID ostatniej wiadomości asystenta
                    const messageId = useConversationStore.getState().getLastAssistantMessageId();
                    if (messageId) {
                        // Zaktualizuj wiadomość adnotacjami
                        useConversationStore.getState().updateMessageWithAnnotations(messageId, annotations);
                        logger.info("ANNOTATION_DEBUG", `Zaktualizowano wiadomość ${messageId} adnotacjami`);
                    } else {
                        logger.warn("ANNOTATION_DEBUG", "Nie można znaleźć ID wiadomości asystenta do aktualizacji adnotacji");
                    }
                }
            }
        },
        provider,
        model,
        webSearchEnabled,
        webSearchConfig
    );
};
