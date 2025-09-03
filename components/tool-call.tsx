import React from "react";

import { ToolCallItem } from "@/lib/assistant";
import { BookOpenText, Clock, Globe, Zap, Code2, Download } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ToolCallProps {
  toolCall: ToolCallItem;
}

function ApiCallCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex flex-col w-[70%] relative mb-[-8px]">
      <div>
        <div className="flex flex-col text-sm rounded-[16px]">
          <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
            <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
              <Zap size={16} />
              <div className="text-sm font-medium">
                {toolCall.status === "completed"
                  ? `Called ${toolCall.name}`
                  : `Calling ${toolCall.name}...`}
              </div>
            </div>
          </div>

          <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
            <div className="max-h-96 overflow-y-scroll text-xs border-b mx-6 p-2">
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
                  <Clock size={16} /> Waiting for result...
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
  return (
    <div className="flex gap-2 items-center text-blue-500 mb-[-16px] ml-[-8px]">
      <BookOpenText size={16} />
      <div className="text-sm font-medium mb-0.5">
        {toolCall.status === "completed"
          ? "Searched files"
          : "Searching files..."}
      </div>
    </div>
  );
}

function WebSearchCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex gap-2 items-center text-blue-500 mb-[-16px] ml-[-8px]">
      <Globe size={16} />
      <div className="text-sm font-medium">
        {toolCall.status === "completed"
          ? "Searched the web"
          : "Searching the web..."}
      </div>
    </div>
  );
}

function McpCallCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex flex-col w-[70%] relative mb-[-8px]">
      <div>
        <div className="flex flex-col text-sm rounded-[16px]">
          <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
            <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
              <Zap size={16} />
              <div className="text-sm font-medium">
                {toolCall.status === "completed"
                  ? `Called ${toolCall.name} via MCP tool`
                  : `Calling ${toolCall.name} via MCP tool...`}
              </div>
            </div>
          </div>

          <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
            <div className="max-h-96 overflow-y-scroll text-xs border-b mx-6 p-2">
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
                  {(() => {
                    try {
                      const parsed = JSON.parse(toolCall.output!);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return toolCall.output!;
                    }
                  })()}
                </SyntaxHighlighter>
              ) : (
                <div className="text-zinc-500 flex items-center gap-2 py-2">
                  <Clock size={16} /> Waiting for result...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeInterpreterCell({ toolCall }: ToolCallProps) {
  return (
    <div className="flex flex-col w-[70%] relative mb-[-8px]">
      <div className="flex flex-col text-sm rounded-[16px]">
        <div className="font-semibold p-3 pl-0 text-gray-700 rounded-b-none flex gap-2">
          <div className="flex gap-2 items-center text-blue-500 ml-[-8px]">
            <Code2 size={16} />
            <div className="text-sm font-medium">
              {toolCall.status === "completed"
                ? "Code executed"
                : "Running code interpreter..."}
            </div>
          </div>
        </div>
        <div className="bg-[#fafafa] rounded-xl py-2 ml-4 mt-2">
          <div className="mx-6 p-2 text-xs">
            <SyntaxHighlighter
              customStyle={{
                backgroundColor: "#fafafa",
                padding: "8px",
                paddingLeft: "0px",
                marginTop: 0,
              }}
              language="python"
              style={coy}
            >
              {toolCall.code || ""}
            </SyntaxHighlighter>
          </div>
        </div>
        {toolCall.files && toolCall.files.length > 0 && (
          <div className="flex gap-2 mt-2 ml-4 flex-wrap">
            {toolCall.files.map((f) => (
              <a
                key={f.file_id}
                href={`/api/container_files/content?file_id=${f.file_id}${
                  f.container_id ? `&container_id=${f.container_id}` : ""
                }${
                  f.filename
                    ? `&filename=${encodeURIComponent(f.filename)}`
                    : ""
                }`}
                download
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ededed] text-xs text-zinc-500"
              >
                {f.filename || f.file_id}
                <Download size={12} />
              </a>
            ))}
          </div>
        )}
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
          case "mcp_call":
            return <McpCallCell toolCall={toolCall} />;
          case "code_interpreter_call":
            return <CodeInterpreterCell toolCall={toolCall} />;
          default:
            return null;
        }
      })()}
    </div>
  );
}
