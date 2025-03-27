"use client";
import React from "react";
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

            // Przekazanie parametrów provider i model do funkcji przetwarzającej wiadomości
            await processMessages(provider, model);
        } catch (error) {
            console.error("Błąd podczas przetwarzania wiadomości:", error);
        }
    };

    return (
        <div className="h-full p-4 w-full bg-white rounded-lg shadow-sm">
            <Chat items={chatMessages} onSendMessage={handle_send_message} />
        </div>
    );
}
