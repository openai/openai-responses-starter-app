"use client";

import React from "react";
import useToolsStore from "@/stores/useToolsStore";
import { Input } from "./ui/input";
import CountrySelector from "./country-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logger from "@/lib/logger";

/**
 * Komponent konfiguracji wyszukiwania internetowego
 * Umożliwia ustawienie lokalizacji użytkownika oraz ilości pobieranych danych
 *
 * @returns Komponent React z formularzem konfiguracji wyszukiwania
 */
export default function WebSearchSettings() {
    const { webSearchConfig, setWebSearchConfig, currentProvider } = useToolsStore();

    /**
     * Czyści konfigurację wyszukiwania internetowego
     */
    const handle_clear = () => {
        logger.info("WEB_SEARCH", "Czyszczenie konfiguracji wyszukiwania internetowego");
        setWebSearchConfig({
            user_location: {
                type: "approximate",
                country: "",
                region: "",
                city: "",
            },
            search_context_size: "medium", // domyślna wartość
        });
    };

    /**
     * Obsługuje zmianę parametrów lokalizacji użytkownika
     *
     * @param field - Pole lokalizacji do zmiany (kraj, region, miasto)
     * @param value - Nowa wartość pola
     */
    const handle_location_change = (
        field: "country" | "region" | "city",
        value: string
    ) => {
        logger.info("WEB_SEARCH", `Zmiana lokalizacji - ${field}: ${value}`);
        setWebSearchConfig({
            ...webSearchConfig,
            user_location: {
                type: "approximate",
                ...webSearchConfig.user_location,
                [field]: value,
            },
        });
    };

    /**
     * Obsługuje zmianę rozmiaru kontekstu wyszukiwania
     *
     * @param value - Nowa wartość rozmiaru kontekstu (low, medium, high)
     */
    const handle_context_size_change = (value: "low" | "medium" | "high") => {
        logger.info("WEB_SEARCH", `Zmiana rozmiaru kontekstu wyszukiwania: ${value}`);
        setWebSearchConfig({
            ...webSearchConfig,
            search_context_size: value,
        });
    };

    // Określ, czy pokazać wybór rozmiaru kontekstu wyszukiwania (dla OpenAI i OpenRouter)
    const show_context_size_selector = currentProvider === "openai" || currentProvider === "openrouter";

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="text-zinc-600 text-sm">Lokalizacja użytkownika</div>
                <div
                    className="text-zinc-400 text-sm px-1 transition-colors hover:text-zinc-600 cursor-pointer"
                    onClick={handle_clear}
                >
                    Wyczyść
                </div>
            </div>
            <div className="mt-3 space-y-3 text-zinc-400">
                <div className="flex items-center gap-2">
                    <label htmlFor="country" className="text-sm w-20">
                        Kraj
                    </label>
                    <CountrySelector
                        value={webSearchConfig.user_location?.country ?? ""}
                        onChange={(value) => handle_location_change("country", value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="region" className="text-sm w-20">
                        Region
                    </label>
                    <Input
                        id="region"
                        type="text"
                        placeholder="Region"
                        className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                        value={webSearchConfig.user_location?.region ?? ""}
                        onChange={(e) => handle_location_change("region", e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="city" className="text-sm w-20">
                        Miasto
                    </label>
                    <Input
                        id="city"
                        type="text"
                        placeholder="City"
                        className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                        value={webSearchConfig.user_location?.city ?? ""}
                        onChange={(e) => handle_location_change("city", e.target.value)}
                    />
                </div>

                {/* Selektor rozmiaru kontekstu wyszukiwania - dla OpenAI i OpenRouter */}
                {show_context_size_selector && (
                    <div className="flex flex-col gap-2 mt-4 border-t pt-3">
                        <label htmlFor="context-size" className="text-sm text-zinc-600">
                            Rozmiar kontekstu wyszukiwania
                        </label>
                        <Select
                            value={webSearchConfig.search_context_size || "medium"}
                            onValueChange={(value: "low" | "medium" | "high") => handle_context_size_change(value)}
                        >
                            <SelectTrigger id="context-size" className="w-full">
                                <SelectValue placeholder="Wybierz rozmiar kontekstu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">
                                    Mały (szybszy, mniej danych)
                                </SelectItem>
                                <SelectItem value="medium">
                                    Średni (zalecany)
                                </SelectItem>
                                <SelectItem value="high">
                                    Duży (wolniejszy, więcej danych)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-zinc-500 mt-1">
                            {currentProvider === "openai"
                                ? "Wpływa na ilość danych pobieranych z internetu. Większy rozmiar zapewnia lepsze odpowiedzi, ale wydłuża czas oczekiwania."
                                : "Wpływa na jakość wyszukiwania internetowego. Większy rozmiar oznacza dokładniejsze wyniki, ale dłuższy czas odpowiedzi."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
