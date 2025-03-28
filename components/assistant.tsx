"use client";
import React, { useEffect, useState } from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { Item, streamMessages } from "@/lib/assistant";
import useToolsStore from "@/stores/useToolsStore";
import logger from "@/lib/logger";

export default function Assistant({
    provider = "openai",
    model = "gpt-4o-mini",
}) {
    const {
        chatMessages,
        addChatMessage,
        addConversationItem,
        appendToLastAssistantMessage,
        addAssistantMessage,
        addToolCall
    } = useConversationStore();

    const { webSearchEnabled } = useToolsStore();
    const [currentProvider, setCurrentProvider] = useState(provider);
    const [currentModel, setCurrentModel] = useState(model);

    useEffect(() => {
        setCurrentProvider(provider);
    }, [provider]);

    useEffect(() => {
        setCurrentModel(model);
    }, [model]);

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return;

        const userItem: Item = {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: message.trim() }],
        };

        addChatMessage(userItem);
        addConversationItem({ role: "user", content: message });

        // Start assistant message
        const assistantMessageId = addAssistantMessage();

        try {
            await streamMessages({
                provider: currentProvider,
                model: currentModel,
                onToken: (token) => {
                    // Usunięto zbędny log Console.log
                    appendToLastAssistantMessage(token, assistantMessageId);
                },
                onToolCall: (toolCall) => {
                    // Dodana obsługa narzędzi takich jak WebSearch
                    if (toolCall.type === "web_search") {
                        logger.info("TOOL_CALL", `Wywołanie wyszukiwania internetowego: ${toolCall.query}`);

                        const webSearchCall = {
                            type: "tool_call",
                            tool_type: "web_search_call",
                            status: "searching",
                            id: `websearch-${Date.now()}`,
                            name: "web_search",
                            arguments: JSON.stringify({ query: toolCall.query }),
                            parsedArguments: { query: toolCall.query }
                        };

                        addToolCall(webSearchCall);
                    }
                }
            });
        } catch (err) {
            console.error("Streaming error:", err);
            appendToLastAssistantMessage("⚠️ Błąd podczas przetwarzania odpowiedzi", assistantMessageId);
        }
    };

    return (
        <div className="h-full p-4 w-full bg-white rounded-lg shadow-sm">
            <Chat
                items={chatMessages}
                onSendMessage={handleSendMessage}
                providerName={currentProvider}
                modelName={currentModel}
            />
        </div>
    );
}


