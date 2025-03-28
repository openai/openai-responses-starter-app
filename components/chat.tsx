"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ToolCall from "./tool-call";
import Message from "./message";
import { Item } from "@/lib/assistant";

interface ChatProps {
    items: Item[];
    onSendMessage: (message: string) => void;
    providerName?: string;
    modelName?: string;
}

/**
 * Komponent interfejsu czatu
 *
 * @param items - Lista elementów czatu (wiadomości, wywołania narzędzi)
 * @param onSendMessage - Funkcja wywoływana przy wysyłaniu wiadomości
 * @param providerName - Nazwa aktualnego dostawcy modelu (nieużywane w interfejsie)
 * @param modelName - Nazwa aktualnego modelu (nieużywane w interfejsie)
 */
const Chat: React.FC<ChatProps> = ({
    items,
    onSendMessage,
    providerName,
    modelName
}) => {
    const items_end_ref = useRef<HTMLDivElement>(null);
    const [input_message_text, set_input_message_text] = useState<string>("");
    const [is_composing, set_is_composing] = useState(false);

    const scroll_to_bottom = () => {
        items_end_ref.current?.scrollIntoView({ behavior: "instant" });
    };

    const handle_key_down = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !is_composing) {
            event.preventDefault();
            if (input_message_text.trim()) {
                onSendMessage(input_message_text);
                set_input_message_text("");
            }
        }
    }, [onSendMessage, input_message_text, is_composing]);

    useEffect(() => {
        scroll_to_bottom();
    }, [items]);

    return (
        <div className="flex justify-center items-center size-full">
            <div className="flex grow flex-col h-full max-w-[750px] gap-2">
                <div className="h-[90vh] overflow-y-scroll px-10 flex flex-col">
                    <div className="mt-auto space-y-5 pt-4">
                        {items.map((item, index) => (
                            <React.Fragment key={index}>
                                {item.type === "tool_call" ? (
                                    <ToolCall toolCall={item} />
                                ) : item.type === "message" ? (
                                    <div className="flex flex-col gap-1">
                                        <Message message={item} />
                                        {/* Adnotacje są już wyświetlane w komponencie Message */}
                                    </div>
                                ) : null}
                            </React.Fragment>
                        ))}
                        <div ref={items_end_ref} />
                    </div>
                </div>
                <div className="flex-1 p-4 px-10">
                    <div className="flex items-center">
                        <div className="flex w-full items-center pb-4 md:pb-1">
                            <div className="flex w-full flex-col gap-1.5 rounded-[20px] p-2.5 pl-1.5 transition-colors bg-white border border-stone-200 shadow-sm">
                                <div className="flex items-end gap-1.5 md:gap-2 pl-4">
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <textarea
                                            id="prompt-textarea"
                                            tabIndex={0}
                                            dir="auto"
                                            rows={2}
                                            placeholder="Message..."
                                            className="mb-2 resize-none border-0 focus:outline-none text-sm bg-transparent px-0 pb-6 pt-2"
                                            value={input_message_text}
                                            onChange={(e) => set_input_message_text(e.target.value)}
                                            onKeyDown={handle_key_down}
                                            onCompositionStart={() => set_is_composing(true)}
                                            onCompositionEnd={() => set_is_composing(false)}
                                        />
                                    </div>
                                    <button
                                        disabled={!input_message_text.trim()}
                                        data-testid="send-button"
                                        className="flex size-8 items-end justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100"
                                        onClick={() => {
                                            if (input_message_text.trim()) {
                                                onSendMessage(input_message_text);
                                                set_input_message_text("");
                                            }
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="32"
                                            height="32"
                                            fill="none"
                                            viewBox="0 0 32 32"
                                            className="icon-2xl"
                                        >
                                            <path
                                                fill="currentColor"
                                                fillRule="evenodd"
                                                d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616 1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143 1.143 0 1 1-1.616-1.616z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
