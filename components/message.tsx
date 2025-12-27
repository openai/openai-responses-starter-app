import { MessageItem } from "@/lib/assistant";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import ImageWithSigned from "./image-with-signed";
import { Copy, Check, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

interface MessageProps {
  message: MessageItem;
  onActionClick?: (action: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onActionClick }) => {
  const [copied, setCopied] = useState(false);
  const content = message.content && message.content.length > 0 ? message.content[0] : null;
  if (!content) return null;

  const handleCopy = () => {
    if (content.text) {
      navigator.clipboard.writeText(content.text as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parseActions = (text: string) => {
    const actionRegex = /\[Action:\s*(.*?)\]/g;
    const actions: string[] = [];
    let match;
    while ((match = actionRegex.exec(text)) !== null) {
      actions.push(match[1]);
    }
    return actions;
  };

  const cleanText = (text: string) => {
    return text.replace(/\[Action:\s*.*?\]/g, "").trim();
  };

  const actions = message.role === "assistant" && content.text ? parseActions(content.text as string) : [];
  const displayText = message.role === "assistant" && content.text ? cleanText(content.text as string) : (content.text as string);

  return (
    <div className="text-sm group">
      {message.role === "user" ? (
        <div className="flex justify-end">
          <div>
            <div className="ml-4 rounded-[20px] px-4 py-2.5 md:ml-24 bg-primary/10 text-foreground border border-primary/20 shadow-sm">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>
                  {displayText}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex">
            <div className="mr-4 rounded-[20px] px-4 py-2.5 md:mr-24 text-foreground bg-card border border-border shadow-sm relative">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>
                  {displayText}
                </ReactMarkdown>
                {content.annotations &&
                  content.annotations
                    .filter(
                      (a) =>
                        a.type === "container_file_citation" &&
                        a.filename &&
                        /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
                    )
                    .map((a, i) => {
                      const src = `/api/container_files/content?file_id=${a.fileId}${a.containerId ? `&container_id=${a.containerId}` : ""}${a.filename ? `&filename=${encodeURIComponent(a.filename)}` : ""}`;
                      return (
                        <div key={i} className="mt-3 w-full max-w-full">
                          {/* ImageWithSigned will resolve CDN/signed URLs and provide a preview modal */}
                          <ImageWithSigned originalSrc={src} alt={a.filename} />
                        </div>
                      );
                    })}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/50 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted hover:text-foreground"
                title="Copy message"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-500">
              {actions.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-background/50 border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-xs h-8 px-4 flex items-center gap-2 group/btn"
                  onClick={() => onActionClick?.(action)}
                >
                  {action}
                  <ArrowRight size={12} className="text-primary opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Message;
