"use client";
import React from "react";
import FileSearchSetup from "./file-search-setup";
import WebSearchConfig from "./websearch-config";
import FunctionsView from "./functions-view";
import PanelConfig from "./panel-config";
import useToolsStore from "@/stores/useToolsStore";

/**
 * Panel narzędzi wyświetlający aktywne narzędzia asystenta
 * Dynamicznie renderuje komponenty na podstawie stanu w useToolsStore
 *
 * @returns Komponent panelu narzędzi
 */
export default function ToolsPanel() {
    // Pobieranie stanu narzędzi z magazynu
    const {
        fileSearchEnabled,
        webSearchEnabled,
        functionsEnabled,
        toggleFileSearch,
        toggleWebSearch,
        toggleFunctions,
    } = useToolsStore();

    // Sprawdzanie, czy jakiekolwiek narzędzie jest włączone
    const any_tool_enabled = fileSearchEnabled || webSearchEnabled || functionsEnabled;

    return (
        <div className="h-full p-4 w-full bg-white rounded-t-xl md:rounded-none border-l-1 border-stone-100">
            <div className="flex flex-col h-full">
                <div className="mb-4 pb-2 border-b border-gray-100">
                    <h2 className="text-lg font-semibold">Narzędzia</h2>
                    <p className="text-sm text-gray-500">Aktywne narzędzia asystenta</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Wyświetlanie informacji, gdy żadne narzędzie nie jest włączone */}
                    {!any_tool_enabled && (
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-500 text-sm">
                                Wszystkie narzędzia są wyłączone. Możesz je włączyć w ustawieniach.
                            </p>
                        </div>
                    )}

                    {/* Panel wyszukiwania plików */}
                    {fileSearchEnabled && (
                        <PanelConfig
                            title="Wyszukiwanie plików"
                            tooltip="Pozwala na wyszukiwanie w bazie wiedzy (magazynie wektorowym)"
                            enabled={fileSearchEnabled}
                            setEnabled={toggleFileSearch}
                        >
                            <FileSearchSetup />
                        </PanelConfig>
                    )}

                    {/* Panel wyszukiwania w internecie */}
                    {webSearchEnabled && (
                        <PanelConfig
                            title="Wyszukiwanie w internecie"
                            tooltip="Pozwala na wyszukiwanie w internecie"
                            enabled={webSearchEnabled}
                            setEnabled={toggleWebSearch}
                        >
                            <WebSearchConfig />
                        </PanelConfig>
                    )}

                    {/* Panel funkcji */}
                    {functionsEnabled && (
                        <PanelConfig
                            title="Funkcje"
                            tooltip="Pozwala na używanie lokalnie zdefiniowanych funkcji"
                            enabled={functionsEnabled}
                            setEnabled={toggleFunctions}
                        >
                            <FunctionsView />
                        </PanelConfig>
                    )}
                </div>
            </div>
        </div>
    );
}
