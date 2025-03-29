import { useEffect, useState } from "react";
import { ToolCallItem } from "@/lib/assistant";
import SyntaxHighlighter from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";
import logger from "@/lib/logger";
import { CheckCircle, XCircle, Loader2, Globe, Search } from "lucide-react";
import useToolsStore from "@/stores/useToolsStore";

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
                                {toolCall.name || "Funkcja"}
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
                                {toolCall.arguments || "{}"}
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
                                        marginBottom: 0,
                                        maxHeight: "300px",
                                    }}
                                    language="json"
                                    style={coy}
                                >
                                    {typeof toolCall.output === "string" ? toolCall.output : JSON.stringify(toolCall.output, null, 2)}
                                </SyntaxHighlighter>
                            ) : (
                                <div className="text-gray-400 italic">Oczekiwanie na wynik...</div>
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
                                Wyszukiwanie plików
                            </div>
                            <div className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                                <Search size={12} className="inline mr-1" />
                                Pliki
                            </div>
                        </div>
                    </div>

                    {toolCall.output && (
                        <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
                            <div className="max-h-96 overflow-y-scroll mx-6 p-2 text-xs">
                                <div className="text-xs font-medium text-gray-500 mb-1">Znalezione pliki:</div>
                                <pre className="whitespace-pre-wrap text-xs">
                                    {typeof toolCall.output === "string" ? toolCall.output : JSON.stringify(toolCall.output, null, 2)}
                                </pre>
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
                                <Loader2 size={16} className="animate-spin text-yellow-500" />
                            )}
                            <div className="text-sm font-medium">
                                {providerName}
                            </div>
                            <div className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                                <Globe size={12} className="inline mr-1" />
                                Web
                            </div>
                        </div>
                    </div>

                    {toolCall.output && (
                        <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
                            <div className="max-h-96 overflow-y-scroll mx-6 p-2 text-xs">
                                <div className="text-xs font-medium text-gray-500 mb-1">Wyniki wyszukiwania:</div>
                                {Array.isArray(toolCall.output) ? (
                                    <div className="space-y-3">
                                        {toolCall.output.map((result: any, index: number) => (
                                            <div key={index} className="border-b border-gray-200 pb-2 last:border-0">
                                                <a 
                                                    href={result.url || result.link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-blue-500 hover:underline block mb-1"
                                                >
                                                    {result.title}
                                                </a>
                                                <div className="text-gray-700">{result.snippet || result.content}</div>
                                                <div className="text-xs text-gray-500 mt-1">{result.url || result.link}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <pre className="whitespace-pre-wrap text-xs">
                                        {typeof toolCall.output === "string" ? toolCall.output : JSON.stringify(toolCall.output, null, 2)}
                                    </pre>
                                )}
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
