"use client";
import React, { useState, useEffect } from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { Item, processMessages } from "@/lib/assistant";

/**
 * Główny komponent asystenta, obsługujący konwersację z użytkownikiem
 *
 * @param provider - Dostawca modelu LLM (np. openai, anthropic)
 * @param model - Nazwa modelu do użycia (np. gpt-4o-mini, claude-3-haiku)
 * @returns Komponent React z interfejsem czatu
 */
export default function Assistant({
    provider = "openai",
    model = "gpt-4o-mini"
}) {
    const { chatMessages, addConversationItem, addChatMessage } =
        useConversationStore();

    // Stany lokalne dla wartości dostawcy i modelu
    const [current_provider, set_current_provider] = useState(provider);
    const [current_model, set_current_model] = useState(model);

    // Aktualizacja stanów lokalnych, gdy zmienią się propsy
    useEffect(() => {
        if (provider !== current_provider) {
            set_current_provider(provider);
        }
        if (model !== current_model) {
            set_current_model(model);
        }
    }, [provider, model, current_provider, current_model]);

    /**
     * Obsługuje wysłanie wiadomości przez użytkownika
     *
     * @param message - Tekst wiadomości od użytkownika
     */
    const handle_send_message = async (message: string) => {
        if (!message.trim()) return;

        const user_item: Item = {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: message.trim() }],
        };
        const user_message: any = {
            role: "user",
            content: message.trim(),
        };

        try {
            addConversationItem(user_message);
            addChatMessage(user_item);

            // Przekazanie aktualnych parametrów provider i model do funkcji przetwarzającej wiadomości
            await processMessages(current_provider, current_model);
        } catch (error) {
            console.error("Błąd podczas przetwarzania wiadomości:", error);
        }
    };

    return (
        <div className="h-full p-4 w-full bg-white rounded-lg shadow-sm">
            <Chat
                items={chatMessages}
                onSendMessage={handle_send_message}
                providerName={current_provider}
                modelName={current_model}
            />
        </div>
    );
}
