"use client";
import useToolsStore from "@/stores/useToolsStore";
import React from "react";
import FileSearchSetup from "./file-search-setup";
import FunctionsView from "./functions-view";
import PanelConfig from "./panel-config";
import WebSearchConfig from "./websearch-config";

export default function ContextPanel() {
  const {
    fileSearchEnabled,
    setFileSearchEnabled,
    webSearchEnabled,
    setWebSearchEnabled,
    functionsEnabled,
    setFunctionsEnabled,
  } = useToolsStore();
  return (
    <div className="h-full p-8 w-full bg-[#f9f9f9] rounded-t-xl md:rounded-none border-l-1 border-stone-100">
      <div className="flex flex-col overflow-y-scroll h-full">
        <PanelConfig
          title="File Search"
          tooltip="Allows to search a knowledge base (vector store)"
          enabled={fileSearchEnabled}
          setEnabled={setFileSearchEnabled}
        >
          <FileSearchSetup />
        </PanelConfig>
        <PanelConfig
          title="Web Search"
          tooltip="Allows to search the web"
          enabled={webSearchEnabled}
          setEnabled={setWebSearchEnabled}
        >
          <WebSearchConfig />
        </PanelConfig>
        <PanelConfig
          title="Functions"
          tooltip="Allows to use locally defined functions"
          enabled={functionsEnabled}
          setEnabled={setFunctionsEnabled}
        >
          <FunctionsView />
        </PanelConfig>
      </div>
    </div>
  );
}
