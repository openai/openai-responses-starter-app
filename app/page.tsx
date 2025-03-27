"use client";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import { Menu, X, Settings } from "lucide-react";
import { useState, useCallback } from "react";
import { ModelSelector } from "@/components/model-selector";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import useToolsStore from "@/stores/useToolsStore";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Główny komponent aplikacji
 * Zawiera interfejs czatu oraz panel narzędzi
 *
 * @returns Komponent React z interfejsem aplikacji
 */
export default function Main() {
    // Stan przechowujący informację o widoczności panelu narzędzi na małych ekranach
    const [is_tools_panel_open, set_is_tools_panel_open] = useState(false);
    const [is_settings_open, set_is_settings_open] = useState(false);

    // Stany do przechowywania wybranego dostawcy i modelu
    const [selected_provider, set_selected_provider] = useState<string>("openai");
    const [selected_model, set_selected_model] = useState<string>("gpt-4o-mini");

    // Pobranie stanu narzędzi z useToolsStore
    const {
        webSearchEnabled,
        fileSearchEnabled,
        functionsEnabled,
        toggleWebSearch,
        toggleFileSearch,
        toggleFunctions
    } = useToolsStore();

    /**
     * Obsługuje zmianę dostawcy modeli
     *
     * @param provider - Wybrany dostawca
     */
    const handle_provider_change = (provider: string) => {
        set_selected_provider(provider);
    };

    /**
     * Obsługuje zmianę modelu
     *
     * @param model - Wybrany model
     */
    const handle_model_change = (model: string) => {
        set_selected_model(model);
    };

    /**
     * Obsługuje zmianę stanu narzędzia (włączenie/wyłączenie)
     * @param toggleFunction - Funkcja przełączająca stan narzędzia
     */
    const handle_tool_toggle = useCallback((toggleFunction: () => void) => {
        toggleFunction();
    }, []);

    return (
        <div className="flex flex-col md:flex-row h-screen w-full">
            {/* Główna sekcja z asystentem */}
            <div className="flex-1 flex flex-col items-center bg-gray-100 p-4">
                <div className="w-full max-w-4x overflow-y-hidden">
                    {/* Komponent asystenta */}
                    <Assistant
                        provider={selected_provider}
                        model={selected_model}
                    />

                    {/* Pasek ustawień */}
                    <div className="flex justify-end items-center mt-2">
                        {/* Dialog ustawień */}
                        <Dialog open={is_settings_open} onOpenChange={set_is_settings_open}>
                            <DialogTrigger asChild>
                                <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                                    <Settings size={18} className="text-gray-600" />
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Ustawienia aplikacji</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-6">
                                    {/* Ustawienia modelu */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Model AI</h3>
                                        <ModelSelector
                                            onProviderChange={handle_provider_change}
                                            onModelChange={handle_model_change}
                                            defaultProvider={selected_provider}
                                            defaultModel={selected_model}
                                        />
                                    </div>

                                    {/* Ustawienia narzędzi */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Narzędzia</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="web-search" className="text-sm">
                                                    Wyszukiwanie w internecie
                                                    <div className="text-xs text-gray-500">
                                                        Pozwala asystentowi na wyszukiwanie informacji w internecie.
                                                    </div>
                                                </Label>
                                                <Switch
                                                    id="web-search"
                                                    checked={webSearchEnabled}
                                                    onCheckedChange={() => handle_tool_toggle(toggleWebSearch)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="file-search" className="text-sm">
                                                    Wyszukiwanie plików
                                                    <div className="text-xs text-gray-500">
                                                        Pozwala asystentowi na wyszukiwanie w przesłanych plikach.
                                                    </div>
                                                </Label>
                                                <Switch
                                                    id="file-search"
                                                    checked={fileSearchEnabled}
                                                    onCheckedChange={() => handle_tool_toggle(toggleFileSearch)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="functions" className="text-sm">
                                                    Funkcje
                                                    <div className="text-xs text-gray-500">
                                                        Pozwala asystentowi na używanie funkcji zewnętrznych.
                                                    </div>
                                                </Label>
                                                <Switch
                                                    id="functions"
                                                    checked={functionsEnabled}
                                                    onCheckedChange={() => handle_tool_toggle(toggleFunctions)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Sekcja panelu narzędzi - widoczna na większych ekranach i tylko jeśli aktywowane narzędzia */}
            {(webSearchEnabled || fileSearchEnabled || functionsEnabled) && (
                <div className="hidden md:block w-[300px] bg-white shadow-lg overflow-y-auto">
                    <ToolsPanel />
                </div>
            )}

            {/* Przycisk hamburger dla małych ekranów - widoczny tylko gdy aktywowane narzędzia */}
            {(webSearchEnabled || fileSearchEnabled || functionsEnabled) && (
                <div className="fixed top-4 right-4 md:hidden z-10">
                    <button
                        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all"
                        onClick={() => set_is_tools_panel_open(true)}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            )}

            {/* Nakładka panelu narzędzi dla małych ekranów */}
            {is_tools_panel_open && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-30">
                    <div className="w-[80%] max-w-sm bg-white h-full overflow-y-auto p-4 shadow-lg">
                        <button
                            className="mb-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
                            onClick={() => set_is_tools_panel_open(false)}
                        >
                            <X size={24} />
                        </button>
                        <ToolsPanel />
                    </div>
                </div>
            )}
        </div>
    );
}
