"use client";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import { Menu, X, Settings } from "lucide-react";
import { useState, useCallback } from "react";
import ModelSelector from "@/components/model-selector";
import ProviderSelector from "@/components/provider-selector";
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

const AVAILABLE_PROVIDERS = [
    {
        id: "openai",
        name: "OpenAI",
        models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        apiType: "response",
        webSearchType: "openai"
    },
    {
        id: "openrouter",
        name: "OpenRouter",
        models: ["anthropic/claude-3.5-sonnet", "google/gemini-pro-1.5", "mistralai/mixtral-8x7b"],
        apiType: "chat_completions",
        webSearchType: "openrouter"
    }
];

export default function Main() {
    const [is_tools_panel_open, set_is_tools_panel_open] = useState(false);
    const [is_settings_open, set_is_settings_open] = useState(false);
    const [selected_provider, set_selected_provider] = useState<string>(AVAILABLE_PROVIDERS[0].id);
    const [selected_model, set_selected_model] = useState<string>(AVAILABLE_PROVIDERS[0].models[0]);

    const {
        webSearchEnabled,
        fileSearchEnabled,
        functionsEnabled,
        toggleWebSearch,
        toggleFileSearch,
        toggleFunctions
    } = useToolsStore();

    const handle_provider_change = (providerId: string) => {
        const providerConfig = AVAILABLE_PROVIDERS.find(p => p.id === providerId);
        if (providerConfig) {
            set_selected_provider(providerId);
            set_selected_model(providerConfig.models[0]);
        }
    };

    const handle_model_change = (model: string) => {
        set_selected_model(model);
    };

    const handle_tool_toggle = useCallback((toggleFunction: () => void) => {
        toggleFunction();
    }, []);

    const currentModels = AVAILABLE_PROVIDERS.find(p => p.id === selected_provider)?.models || [];

    return (
        <div className="flex flex-col md:flex-row h-screen w-full">
            <div className="flex-1 flex flex-col items-center bg-gray-100 p-4">
                <div className="w-full max-w-4x overflow-y-hidden">
                    <Assistant provider={selected_provider} model={selected_model} />

                    <div className="flex justify-end items-center mt-2">
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
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Dostawca AI</h3>
                                        <ProviderSelector
                                            provider={selected_provider}
                                            onProviderChange={handle_provider_change}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Model AI</h3>
                                        <ModelSelector
                                            provider={selected_provider}
                                            model={selected_model}
                                            onModelChange={handle_model_change}
                                            models={currentModels}
                                        />
                                    </div>
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

            {(webSearchEnabled || fileSearchEnabled || functionsEnabled) && (
                <div className="hidden md:block w-[300px] bg-white shadow-lg overflow-y-auto">
                    <ToolsPanel />
                </div>
            )}

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
