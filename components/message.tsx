import { MessageItem } from "@/lib/assistant";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import logger from "@/lib/logger";
import Annotations, { Annotation } from "./annotations";
import ToolCall from "./tool-call";

interface MessageProps {
    message: MessageItem;
}

/**
 * Komponent Message - wyświetla pojedynczą wiadomość w interfejsie czatu
 * Obsługuje zarówno format Chat Completions API jak i Responses API
 */
const Message: React.FC<MessageProps> = ({ message }) => {
    // Obsługa obu formatów API (Responses API i Chat Completions API)
    const getMessageText = (): string => {
        if (!message.content || message.content.length === 0) {
            return "";
        }
        
        const contentBlock = message.content[0];
        
        // Format Responses API: content[0].text.value
        if (contentBlock.text && typeof contentBlock.text === 'object' && 'value' in contentBlock.text) {
            return contentBlock.text.value || "";
        }
        
        // Format Chat Completions API: content[0].text (jako string bezpośrednio)
        if (typeof contentBlock.text === 'string') {
            return contentBlock.text;
        }
        
        return "";
    };
    
    const contentText = getMessageText();
    const annotations = message.content?.[0]?.annotations || [];
    const toolCall = message.tool_call;
    const [hasRenderedAnnotations, setHasRenderedAnnotations] = useState(false);

    useEffect(() => {
        const role = message.role;
        const contentPreview = contentText.length > 50
            ? contentText.substring(0, 50) + "..."
            : contentText;

        logger.info("UI_DEBUG", `Renderowanie wiadomości typu '${role}' z ID: ${message.id || 'brak ID'}`);

        if (annotations && annotations.length > 0) {
            logger.info("UI_DEBUG", `Wiadomość zawiera ${annotations.length} adnotacji`);
            logger.info("ANNOTATIONS_DEBUG", `Format pierwszej adnotacji: ${JSON.stringify(annotations[0])}`);
            setHasRenderedAnnotations(true);
        }

        if (!contentText.trim()) {
            logger.warn("UI_DEBUG", `Pusta wiadomość (brak treści) dla roli: ${role}`);
        }
    }, [message, contentText, annotations]);

    // Funkcja pomocnicza do sprawdzania, czy adnotacje są prawidłowo zdefiniowane
    const hasValidAnnotations = () => {
        return annotations && 
               Array.isArray(annotations) && 
               annotations.length > 0 && 
               annotations.every(ann => ann && typeof ann === 'object' && ann.type);
    };

    // Jeśli wiadomość jest pusta i nie ma wywołania narzędzia, nie renderuj niczego
    if (!contentText.trim() && !toolCall) return null;

    return (
        <div className="text-sm">
            {message.role === "user" ? (
                <div className="flex justify-end">
                    <div>
                        <div className="ml-4 rounded-[16px] px-4 py-2 md:ml-24 bg-[#ededed] text-stone-900 font-light">
                            <ReactMarkdown>{contentText}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    <div className="flex">
                        <div className="mr-4 rounded-[16px] px-4 py-2 md:mr-24 text-black bg-white font-light">
                            <ReactMarkdown>{contentText}</ReactMarkdown>
                        </div>
                    </div>
                    
                    {/* Wyświetlanie adnotacji (linki, cytaty, etc.) */}
                    {hasValidAnnotations() && (
                        <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1 ml-4">Źródła:</div>
                            <Annotations annotations={annotations} />
                            {/* Wyświetlanie szczegółów adnotacji tylko w trybie debugowania */}
                            {process.env.NODE_ENV === "development" && (
                                <div className="text-xs text-gray-500 ml-4 mt-1 p-1 bg-gray-50 rounded-md overflow-x-auto">
                                    <pre className="text-xs whitespace-pre-wrap">
                                        {JSON.stringify(annotations[0], null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Wyświetlanie wywołań narzędzi (funkcje, wyszukiwanie) */}
                    {toolCall && (
                        <div className="mt-2">
                            <ToolCall toolCall={toolCall} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Message;
