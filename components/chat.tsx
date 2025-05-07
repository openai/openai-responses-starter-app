"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ToolCall from "./tool-call";
import Message from "./message";
import Annotations from "./annotations";
import { Item } from "@/lib/assistant";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ items, onSendMessage }) => {
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false);

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !isComposing) {
      event.preventDefault();
      onSendMessage(inputMessageText);
      setinputMessageText("");
    }
  }, [onSendMessage, inputMessageText]);

  useEffect(() => {
    scrollToBottom();
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
                    {item.content &&
                      item.content[0].annotations &&
                      item.content[0].annotations.length > 0 && (
                        <Annotations
                          annotations={item.content[0].annotations}
                        />
                      )}
                  </div>
                ) : null}
              </React.Fragment>
            ))}
            <div ref={itemsEndRef} />
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
                      value={inputMessageText}
                      onChange={(e) => setinputMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={() => setIsComposing(false)}
                    />
                  </div>
                  <button
                    disabled={!inputMessageText}
                    data-testid="send-button"
                    className="flex size-8 items-end justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100"
                    onClick={() => {
                      onSendMessage(inputMessageText);
                      setinputMessageText("");
                    }}
                    title="Send message"
                    aria-label="Send message"
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
