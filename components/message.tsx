import { MessageItem } from "@/lib/assistant";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import logger from "@/lib/logger";
import Annotations, { Annotation } from "./annotations";
import ToolCall from "./tool-call";

interface MessageProps {
    message: MessageItem;
}

const Message: React.FC<MessageProps> = ({ message }) => {
    const contentText = message.content?.[0]?.text || "";
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
            logger.info("ANNOTATIONS_DEBUG", `Szczegóły adnotacji: ${JSON.stringify(annotations)}`);
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

                    {hasValidAnnotations() && (
                        <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1 ml-4">Źródła:</div>
                            <Annotations annotations={annotations} />
                            <div className="text-xs text-gray-500 ml-4 mt-1 p-1 bg-gray-50 rounded-md overflow-x-auto">
                                <code>{JSON.stringify(annotations[0], null, 2)}</code>
                            </div>
                        </div>
                    )}

                    {toolCall && (
                        <div className="mt-2">
                            <h4 className="text-xs font-semibold text-gray-600 ml-4">Użyte narzędzie:</h4>
                            <ToolCall toolCall={toolCall} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Message;
