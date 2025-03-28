"use client";
import React from "react";
import FileSearchSetup from "./file-search-setup";
import WebSearchConfig from "./websearch-config";
import FunctionsView from "./functions-view";
import PanelConfig from "./panel-config";
import useToolsStore from "@/stores/useToolsStore";
import logger from "@/lib/logger";
import dynamic from "next/dynamic";
import ProviderSelector from "./provider-selector";

// Komponent selektora modeli (model-selector) jest importowany dynamicznie
const ModelSelector = dynamic(() => import("./model-selector"), {
    ssr: false,
    loading: () => <div className="p-2 text-gray-400">Ładowanie selektora modeli...</div>
});

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
        currentProvider,
        selectedModel,
        setCurrentProvider,
        setSelectedModel,
        availableProviders,
        isWebSearchSupported
    } = useToolsStore();

    const handleToggleWebSearch = () => {
        const is_supported = isWebSearchSupported();

        if (!webSearchEnabled && !is_supported) {
            console.log(`[TOOL_CHANGE] Wyszukiwanie internetowe niedostępne dla dostawcy: ${currentProvider}`);
            logger.warn("TOOLS", `Wyszukiwanie internetowe niedostępne dla dostawcy: ${currentProvider}`);
            return;
        }

        toggleWebSearch();
        const new_state = !webSearchEnabled;
        logger.info("TOOLS", `Wyszukiwanie internetowe: ${new_state ? 'włączone' : 'wyłączone'}`);
        console.log(`[TOOL_CHANGE] Wyszukiwanie internetowe: ${new_state ? 'włączone' : 'wyłączone'}`);
    };

    const handleToggleFileSearch = () => {
        toggleFileSearch();
        const new_state = !fileSearchEnabled;
        logger.info("TOOLS", `Wyszukiwanie plików: ${new_state ? 'włączone' : 'wyłączone'}`);
        console.log(`[TOOL_CHANGE] Wyszukiwanie plików: ${new_state ? 'włączone' : 'wyłączone'}`);
    };

    const handleToggleFunctions = () => {
        toggleFunctions();
        const new_state = !functionsEnabled;
        logger.info("TOOLS", `Funkcje: ${new_state ? 'włączone' : 'wyłączone'}`);
        console.log(`[TOOL_CHANGE] Funkcje: ${new_state ? 'włączone' : 'wyłączone'}`);
    };

    // Sprawdzanie, czy jakiekolwiek narzędzie jest włączone
    const any_tool_enabled = fileSearchEnabled || webSearchEnabled || functionsEnabled;

    // Określ opis API na podstawie aktualnego dostawcy
    const getWebSearchApiDescription = () => {
        const is_supported = isWebSearchSupported();

        if (!is_supported) return "Niedostępne dla tego dostawcy";

        if (currentProvider === "openai") {
            return "Wykorzystuje OpenAI Web Search API";
        } else if (currentProvider === "openrouter") {
            return "Wykorzystuje OpenRouter Web Search";
        } else {
            return "Aktywne";
        }
    };

    return (
        <div className="overflow-y-auto p-4 w-full bg-white rounded-t-xl md:rounded-none border-l-1 border-stone-100 mt-4">
            <div className="flex flex-col h-full mt-4">
                <div className="mb-4 pb-2 border-b border-gray-100 mt-2">
                    <h2 className="text-lg font-semibold">Narzędzia</h2>
                    <p className="text-sm text-gray-500">Aktywne narzędzia asystenta</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mt-2">
                    {/* Wyświetlanie informacji, gdy żadne narzędzie nie jest włączone */}
                    {!any_tool_enabled && (
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-500 text-sm">
                                Wszystkie narzędzia są wyłączone. Możesz je włączyć w ustawieniach.
                            </p>
                        </div>
                    )}

                    {/* Panel wyszukiwania plików */}
                    <PanelConfig
                        title="Wyszukiwanie plików"
                        tooltip="Pozwala na wyszukiwanie w bazie wiedzy (magazynie wektorowym)"
                        enabled={fileSearchEnabled}
                        setEnabled={handleToggleFileSearch}
                    >
                        {fileSearchEnabled && <FileSearchSetup />}
                    </PanelConfig>

                    {/* Zunifikowany panel wyszukiwania internetowego */}
                    <PanelConfig
                        title="Wyszukiwanie internetowe"
                        tooltip="Pozwala na wyszukiwanie w internecie przy użyciu odpowiedniego API"
                        enabled={webSearchEnabled}
                        setEnabled={handleToggleWebSearch}
                        disabled={!isWebSearchSupported()}
                    >
                        <div className="p-3 text-sm">
                            <p className="text-gray-500 mb-2">{getWebSearchApiDescription()}</p>
                            {webSearchEnabled && <WebSearchConfig />}
                        </div>
                    </PanelConfig>

                    {/* Panel funkcji */}
                    <PanelConfig
                        title="Funkcje"
                        tooltip="Pozwala na używanie lokalnie zdefiniowanych funkcji"
                        enabled={functionsEnabled}
                        setEnabled={handleToggleFunctions}
                    >
                        {functionsEnabled && <FunctionsView />}
                    </PanelConfig>

                    {/* Panel wyboru modelu */}
                    <PanelConfig
                        title="Dostawca i Model AI"
                        tooltip="Pozwala na wybór dostawcy i modelu językowego"
                        enabled={true}
                        setEnabled={() => {
                            // Panel wyboru modelu jest zawsze włączony, więc ta funkcja nic nie robi
                            logger.info("TOOLS", "Panel wyboru modelu jest zawsze włączony");
                        }}
                    >
                        <div className="p-3 space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1">Dostawca</label>
                                <ProviderSelector
                                    provider={currentProvider}
                                    onProviderChange={setCurrentProvider}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1">Model</label>
                                <ModelSelector
                                    provider={currentProvider}
                                    model={selectedModel}
                                    onModelChange={setSelectedModel}
                                    models={availableProviders[currentProvider] || []}
                                />
                            </div>
                        </div>
                    </PanelConfig>
                </div>
            </div>
        </div>
    );
}
