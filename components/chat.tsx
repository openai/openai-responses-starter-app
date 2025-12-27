"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ToolCall from "./tool-call";
import Message from "./message";
import Annotations from "./annotations";
import McpToolsList from "./mcp-tools-list";
import McpApproval from "./mcp-approval";
import { Item, McpApprovalRequestItem } from "@/lib/assistant";
import LoadingMessage from "./loading-message";
import useConversationStore from "@/stores/useConversationStore";
import { Brain, Paperclip, X } from "lucide-react";
import { INITIAL_MESSAGE } from "@/config/constants";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string, file?: File) => void;
  onApprovalResponse: (approve: boolean, id: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  items,
  onSendMessage,
  onApprovalResponse,
}) => {
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false);
  const { isAssistantLoading } = useConversationStore();

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey && !isComposing) {
        event.preventDefault();
        onSendMessage(inputMessageText, selectedFile || undefined);
        setinputMessageText("");
        setSelectedFile(null);
      }
    },
    [onSendMessage, inputMessageText, isComposing, selectedFile]
  );

  useEffect(() => {
    scrollToBottom();
  }, [items]);

  return (
    <div className="flex justify-center items-center size-full">
      <div className="flex grow flex-col h-full max-w-[1100px] gap-2">
        <div className="flex-1 overflow-y-auto px-4 md:px-10 flex flex-col">
          {items.length === 0 && !isAssistantLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                <Brain size={36} className="text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">TacticDev GenTel™</h2>
              <p className="text-muted-foreground max-w-[400px]">
                {INITIAL_MESSAGE}
              </p>
            </div>
          )}
          <div className="mt-auto space-y-5 pt-4 pb-4">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "tool_call" ? (
                  <ToolCall toolCall={item} />
                ) : item.type === "message" ? (
                  <div className="flex flex-col gap-1">
                    <Message 
                      message={item} 
                      onActionClick={(action) => onSendMessage(action)}
                    />
                    {item.content &&
                      item.content.length > 0 &&
                      item.content[0].annotations &&
                      item.content[0].annotations.length > 0 && (
                        <Annotations
                          annotations={item.content[0].annotations}
                        />
                      )}
                  </div>
                ) : item.type === "mcp_list_tools" ? (
                  <McpToolsList item={item} />
                ) : item.type === "mcp_approval_request" ? (
                  <McpApproval
                    item={item as McpApprovalRequestItem}
                    onRespond={onApprovalResponse}
                  />
                ) : null}
              </React.Fragment>
            ))}
            {isAssistantLoading && <LoadingMessage />}
            <div ref={itemsEndRef} />
          </div>
        </div>
        <div className="p-4 md:px-10 pb-6">
          <div className="flex items-center">
            <div className="flex w-full items-center">
              <div className="flex w-full flex-col gap-1.5 rounded-[26px] p-2.5 pl-2 transition-all bg-card border border-border shadow-xl focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5">
                {selectedFile && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl mb-1 mx-2 w-fit animate-in fade-in slide-in-from-bottom-2 border border-primary/20">
                    <Paperclip size={14} className="text-primary" />
                    <div className="text-xs font-medium truncate max-w-[200px] text-foreground">{selectedFile.name}</div>
                    <button 
                      onClick={() => setSelectedFile(null)} 
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-primary/10 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-1.5 md:gap-2 pl-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-all mb-0.5 shrink-0"
                    title="Upload file"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <textarea
                      id="prompt-textarea"
                      tabIndex={0}
                      dir="auto"
                      rows={1}
                      placeholder="Message TacticDev GenTel™..."
                      className="min-h-[44px] max-h-[200px] resize-none border-0 focus:outline-none text-sm bg-transparent px-0 py-3 text-foreground placeholder:text-muted-foreground/70"
                      value={inputMessageText}
                      onChange={(e) => {
                        setinputMessageText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={handleKeyDown}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={() => setIsComposing(false)}
                    />
                  </div>
                  <button
                    disabled={!inputMessageText && !selectedFile}
                    data-testid="send-button"
                    className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground disabled:hover:opacity-100 mb-0.5 mr-0.5 shrink-0 shadow-lg shadow-primary/20"
                  onClick={() => {
                      onSendMessage(inputMessageText, selectedFile || undefined);
                      setinputMessageText("");
                      setSelectedFile(null);
                      const textarea = document.getElementById('prompt-textarea');
                      if (textarea) textarea.style.height = 'auto';
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 32 32"
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
