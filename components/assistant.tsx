"use client";
import { type Item, processMessages } from "@/lib/assistant";
import useConversationStore from "@/stores/useConversationStore";
import React from "react";
import Chat from "./chat";

export default function Assistant() {
  const { chatMessages, addConversationItem, addChatMessage } = useConversationStore();

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userItem: Item = {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: message.trim() }],
    };
    const userMessage: any = {
      role: "user",
      content: message.trim(),
    };

    try {
      addConversationItem(userMessage);
      addChatMessage(userItem);
      await processMessages();
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  return (
    <div className="h-full p-4 w-full bg-white">
      <Chat items={chatMessages} onSendMessage={handleSendMessage} />
    </div>
  );
}
