"use client";

import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ModelSelectorProps {
    provider: string;
    model: string;
    onModelChange: (model: string) => void;
    // Usuwam onProviderChange, ponieważ używamy ProviderSelector do zmiany dostawcy
    // onProviderChange: (provider: string) => void;
    // Dodaję opcjonalne właściwości models i providers
    models?: string[];
    providers?: Array<{
        id: string;
        name: string;
        models: string[];
        apiType: string;
        webSearchType: string;
    }>;
    defaultProvider?: string;
    defaultModel?: string;
}

export default function ModelSelector({
    provider,
    model,
    onModelChange,
    models: providedModels,
}: ModelSelectorProps) {
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pobierz listę dostępnych modeli dla wybranego dostawcy
    useEffect(() => {
        // Jeśli modele są przekazane jako prop, użyj ich
        if (providedModels && providedModels.length > 0) {
            setAvailableModels(providedModels);
            setIsLoading(false);

            // Jeśli aktualny model nie jest dostępny dla wybranego dostawcy, użyj pierwszego z listy
            if (!providedModels.includes(model)) {
                onModelChange(providedModels[0]);
            }
            return;
        }

        // W przeciwnym razie pobierz modele z API
        const fetchModels = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/models/list");
                if (!response.ok) {
                    throw new Error("Nie udało się pobrać listy modeli");
                }

                const data = await response.json();
                const models = data.models[provider] || [];

                setAvailableModels(models);

                // Jeśli aktualny model nie jest dostępny dla wybranego dostawcy, użyj pierwszego z listy
                if (models.length > 0 && !models.includes(model)) {
                    onModelChange(models[0]);
                }
            } catch (error) {
                console.error("Błąd podczas pobierania listy modeli:", error);
                setAvailableModels([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchModels();
    }, [provider, model, onModelChange, providedModels]);

    return (
        <div className="w-full">
            <Select
                value={model}
                onValueChange={onModelChange}
                disabled={isLoading || availableModels.length === 0}
            >
                <SelectTrigger className="w-full">
                    <SelectValue
                        placeholder={isLoading ? "Ładowanie modeli..." : "Wybierz model"}
                    />
                </SelectTrigger>
                <SelectContent>
                    {availableModels.map((modelName) => (
                        <SelectItem key={modelName} value={modelName}>
                            {modelName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
