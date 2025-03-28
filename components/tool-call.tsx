import React, { useEffect, useState } from "react";

import { ToolCallItem } from "@/lib/assistant";
import { BookOpenText, Clock, Globe, Loader2, Zap, CheckCircle, Search, XCircle } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";
import useToolsStore from "@/stores/useToolsStore";
import logger from "@/lib/logger";

interface ToolCallProps {
    toolCall: ToolCallItem;
}

function ApiCallCell({ toolCall }: ToolCallProps) {
    // Dodaj efekt logowania wywołania narzędzia
    useEffect(() => {
        logger.info("TOOL_CALL_DEBUG", `Wywołanie funkcji: ${toolCall.name}, status: ${toolCall.status}`);
    }, [toolCall.name, toolCall.status]);

    return (
        <div className="flex flex-col w-[70%] relative mb-[-8px]">
            <div>
                <div className="flex flex-col text-sm rounded-[16px]">
                    <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
                        <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
                            {toolCall.status === "completed" ? (
                                <CheckCircle size={16} className="text-green-500" />
                            ) : toolCall.status === "failed" ? (
                                <XCircle size={16} className="text-red-500" />
                            ) : (
                                <Loader2 size={16} className="animate-spin text-yellow-500" />
                            )}
                            <div className="text-sm font-medium">
                                {toolCall.status === "completed"
                                    ? `Wywołano funkcję ${toolCall.name}`
                                    : toolCall.status === "failed"
                                        ? `Błąd wywołania funkcji ${toolCall.name}`
                                        : `Wywołuję funkcję ${toolCall.name}...`}
                            </div>
                            <div className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                                Funkcja
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
                        <div className="max-h-96 overflow-y-scroll text-xs border-b mx-6 p-2">
                            <div className="text-xs font-medium text-gray-500 mb-1">Argumenty:</div>
                            <SyntaxHighlighter
                                customStyle={{
                                    backgroundColor: "#fafafa",
                                    padding: "8px",
                                    paddingLeft: "0px",
                                    marginTop: 0,
                                    marginBottom: 0,
                                }}
                                language="json"
                                style={coy}
                            >
                                {JSON.stringify(toolCall.parsedArguments, null, 2)}
                            </SyntaxHighlighter>
                        </div>
                        <div className="max-h-96 overflow-y-scroll mx-6 p-2 text-xs">
                            <div className="text-xs font-medium text-gray-500 mb-1">Wynik:</div>
                            {toolCall.output ? (
                                <SyntaxHighlighter
                                    customStyle={{
                                        backgroundColor: "#fafafa",
                                        padding: "8px",
                                        paddingLeft: "0px",
                                        marginTop: 0,
                                    }}
                                    language="json"
                                    style={coy}
                                >
                                    {JSON.stringify(JSON.parse(toolCall.output), null, 2)}
                                </SyntaxHighlighter>
                            ) : (
                                <div className="text-zinc-500 flex items-center gap-2 py-2">
                                    <Clock size={16} className="animate-pulse" /> Oczekiwanie na wynik...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FileSearchCell({ toolCall }: ToolCallProps) {
    // Dodaj efekt logowania wyszukiwania plików
    useEffect(() => {
        logger.info("TOOL_CALL_DEBUG", `Wyszukiwanie plików, status: ${toolCall.status}`);
    }, [toolCall.status]);

    return (
        <div className="flex flex-col w-[70%] relative mb-[-8px]">
            <div>
                <div className="flex flex-col text-sm rounded-[16px]">
                    <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
                        <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
                            {toolCall.status === "completed" ? (
                                <CheckCircle size={16} className="text-green-500" />
                            ) : toolCall.status === "failed" ? (
                                <XCircle size={16} className="text-red-500" />
                            ) : (
                                <Loader2 size={16} className="animate-spin text-yellow-500" />
                            )}
                            <div className="text-sm font-medium">
                                {toolCall.status === "completed"
                                    ? "Przeszukano pliki"
                                    : toolCall.status === "failed"
                                        ? "Błąd wyszukiwania plików"
                                        : "Przeszukuję pliki..."}
                            </div>
                            <div className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                                Wyszukiwanie plików
                            </div>
                        </div>
                    </div>

                    {toolCall.output && (
                        <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
                            <div className="max-h-96 overflow-y-scroll mx-6 p-2 text-xs">
                                <div className="text-xs font-medium text-gray-500 mb-1">Wynik wyszukiwania:</div>
                                <SyntaxHighlighter
                                    customStyle={{
                                        backgroundColor: "#fafafa",
                                        padding: "8px",
                                        paddingLeft: "0px",
                                        marginTop: 0,
                                    }}
                                    language="json"
                                    style={coy}
                                >
                                    {JSON.stringify(JSON.parse(toolCall.output), null, 2)}
                                </SyntaxHighlighter>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function WebSearchCell({ toolCall }: ToolCallProps) {
    const { currentProvider } = useToolsStore();
    const [providerName, setProviderName] = useState("");

    // Ustaw odpowiednią nazwę providera
    useEffect(() => {
        if (currentProvider === "openai") {
            setProviderName("OpenAI Web Search");
        } else if (currentProvider === "openrouter") {
            setProviderName("OpenRouter Agnostic Web Search");
        } else {
            setProviderName("Web Search");
        }

        logger.info("TOOL_CALL_DEBUG", `Wyszukiwanie internetowe (${currentProvider}), status: ${toolCall.status}`);
    }, [currentProvider, toolCall.status]);

    return (
        <div className="flex flex-col w-[70%] relative mb-[-8px]">
            <div>
                <div className="flex flex-col text-sm rounded-[16px]">
                    <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
                        <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
                            {toolCall.status === "completed" ? (
                                <CheckCircle size={16} className="text-green-500" />
                            ) : toolCall.status === "failed" ? (
                                <XCircle size={16} className="text-red-500" />
                            ) : (
                                <Search size={16} className="animate-pulse text-yellow-500" />
                            )}
                            <div className="text-sm font-medium">
                                {toolCall.status === "completed"
                                    ? "Przeszukano Internet"
                                    : toolCall.status === "failed"
                                        ? "Błąd wyszukiwania internetowego"
                                        : "Przeszukuję Internet..."}
                            </div>
                            <div className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                                {providerName}
                            </div>
                        </div>
                    </div>

                    {toolCall.output && (
                        <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
                            <div className="max-h-96 overflow-y-scroll mx-6 p-2 text-xs">
                                <div className="text-xs font-medium text-gray-500 mb-1">Wynik wyszukiwania:</div>
                                <SyntaxHighlighter
                                    customStyle={{
                                        backgroundColor: "#fafafa",
                                        padding: "8px",
                                        paddingLeft: "0px",
                                        marginTop: 0,
                                    }}
                                    language="json"
                                    style={coy}
                                >
                                    {JSON.stringify(JSON.parse(toolCall.output), null, 2)}
                                </SyntaxHighlighter>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ToolCall({ toolCall }: ToolCallProps) {
    return (
        <div className="flex justify-start pt-2">
            {(() => {
                switch (toolCall.tool_type) {
                    case "function_call":
                        return <ApiCallCell toolCall={toolCall} />;
                    case "file_search_call":
                        return <FileSearchCell toolCall={toolCall} />;
                    case "web_search_call":
                        return <WebSearchCell toolCall={toolCall} />;
                    default:
                        return null;
                }
            })()}
        </div>
    );
}
