import { create } from "zustand";
import { Item, MessageItem } from "@/lib/assistant";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { INITIAL_MESSAGE } from "@/config/constants";
import { Annotation } from "@/components/annotations";
import logger from "@/lib/logger";

interface ConversationState {
    chatMessages: Item[];
    conversationItems: any[];
    setChatMessages: (items: Item[]) => void;
    setConversationItems: (messages: any[]) => void;
    addChatMessage: (item: Item) => void;
    addConversationItem: (message: ChatCompletionMessageParam) => void;
    rawSet: (state: any) => void;
    addToolCall: (toolCall: any) => void;
    addAssistantMessage: () => string;
    appendToLastAssistantMessage: (text: string, id: string) => void;
    getLastAssistantMessageId: () => string | undefined;
    updateMessageWithAnnotations: (messageId: string, annotations: Annotation[]) => void;
}

const useConversationStore = create<ConversationState>((set, get) => ({
    chatMessages: [
        {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: INITIAL_MESSAGE }],
        },
    ],
    conversationItems: [],
    setChatMessages: (items) => set({ chatMessages: items }),
    setConversationItems: (messages) => set({ conversationItems: messages }),
    addChatMessage: (item) =>
        set((state) => ({ chatMessages: [...state.chatMessages, item] })),
    addConversationItem: (message) =>
        set((state) => ({
            conversationItems: [...state.conversationItems, message],
        })),
    addToolCall: (toolCall) =>
        set((state) => ({
            chatMessages: [...state.chatMessages, { type: "tool_call", ...toolCall }],
        })),
    addAssistantMessage: () => {
        const id = crypto.randomUUID();
        const newMessage: Item = {
            type: "message",
            role: "assistant",
            id,
            content: [{ type: "output_text", text: "" }],
        };
        set((state) => ({
            chatMessages: [...state.chatMessages, newMessage],
        }));
        return id;
    },
    appendToLastAssistantMessage: (text, id) => {
        set((state) => {
            const updated = state.chatMessages.map((msg) => {
                if (msg.type === "message" && msg.role === "assistant" && msg.id === id) {
                    if (msg.content && msg.content.length > 0 && msg.content[0].text !== undefined) {
                        const current = msg.content[0].text || "";
                        msg.content[0].text = current + text;
                    }
                }
                return msg;
            });
            return { chatMessages: updated };
        });
    },
    getLastAssistantMessageId: () => {
        const { chatMessages } = get();
        // Szukamy od końca ostatniej wiadomości asystenta z ID
        for (let i = chatMessages.length - 1; i >= 0; i--) {
            const msg = chatMessages[i];
            if (msg.type === "message" && msg.role === "assistant" && msg.id) {
                return msg.id;
            }
        }
        return undefined;
    },
    updateMessageWithAnnotations: (messageId, annotations) => {
        logger.info("CONVERSATION_STORE", `Aktualizacja wiadomości ${messageId} z ${annotations.length} adnotacjami`);

        set((state) => {
            const updated = state.chatMessages.map((msg) => {
                if (msg.type === "message" && msg.id === messageId) {
                    // Kopia wiadomości do aktualizacji
                    const updatedMsg = { ...msg } as MessageItem;

                    // Upewnij się, że istnieje tablica content
                    if (!updatedMsg.content || updatedMsg.content.length === 0) {
                        updatedMsg.content = [{ type: "output_text", text: "" }];
                    }

                    // Dodaj adnotacje do pierwszego elementu content
                    updatedMsg.content[0] = {
                        ...updatedMsg.content[0],
                        annotations: [...(updatedMsg.content[0].annotations || []), ...annotations]
                    };

                    logger.info("CONVERSATION_STORE", `Zaktualizowano wiadomość, teraz zawiera ${updatedMsg.content[0].annotations?.length} adnotacji`);
                    return updatedMsg;
                }
                return msg;
            });

            return { chatMessages: updated };
        });
    },
    rawSet: set,
}));

export default useConversationStore;
