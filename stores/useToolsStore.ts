import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultVectorStore } from "@/config/constants";
import logger from "@/lib/logger"; // Import logger

type File = {
    id: string;
    name: string;
    content: string;
};

type VectorStore = {
    id: string;
    name: string;
    files?: File[];
};

export type WebSearchConfig = {
    user_location?: {
        type: "approximate";
        country?: string;
        city?: string;
        region?: string;
    };
    search_context_size?: "low" | "medium" | "high";
};

/**
 * Interfejs stanu magazynu narzędzi
 * Przechowuje informacje o włączonych narzędziach i ich konfiguracji
 */
interface StoreState {
    // Stan narzędzi
    fileSearchEnabled: boolean;
    webSearchEnabled: boolean;
    functionsEnabled: boolean;

    // Metody ustawiania stanu
    setFileSearchEnabled: (enabled: boolean) => void;
    setWebSearchEnabled: (enabled: boolean) => void;
    setFunctionsEnabled: (enabled: boolean) => void;

    // Metody przełączania stanu (toggle)
    toggleFileSearch: () => void;
    toggleWebSearch: () => void;
    toggleFunctions: () => void;

    // Magazyn wektorowy
    vectorStore: VectorStore | null;
    setVectorStore: (store: VectorStore) => void;

    // Konfiguracja wyszukiwania w sieci
    webSearchConfig: WebSearchConfig;
    setWebSearchConfig: (config: WebSearchConfig) => void;

    // Informacje o aktualnym dostawcy
    currentProvider: string;
    setCurrentProvider: (provider: string) => void;

    // Metody aktualizacji informacji o dostawcy
    updateProviderInfo: (provider: string) => void;

    // Metoda sprawdzająca czy używamy Response API czy ChatCompletions
    useResponseApiForSearch: () => boolean;

    // Sprawdza czy provider wspiera wyszukiwanie internetowe
    isWebSearchSupported: () => boolean;
}

/**
 * Magazyn stanu narzędzi używanych w aplikacji
 * Przechowuje informacje o włączonych narzędziach oraz ich konfiguracji
 */
const useToolsStore = create<StoreState>()(
    persist(
        (set, get) => ({
            // Stany narzędzi
            vectorStore: defaultVectorStore.id !== "" ? defaultVectorStore : null,
            webSearchConfig: {
                user_location: {
                    type: "approximate",
                    country: "",
                    city: "",
                    region: "",
                },
            },
            fileSearchEnabled: false,
            webSearchEnabled: false,
            functionsEnabled: true,

            // Informacje o dostawcy
            currentProvider: "openai",

            // Metody ustawiania stanu
            setFileSearchEnabled: (enabled) => {
                const previousValue = get().fileSearchEnabled;
                logger.info("TOOLS", `Zmiana stanu wyszukiwania plików: ${previousValue} -> ${enabled}`);
                set({ fileSearchEnabled: enabled });
            },

            setWebSearchEnabled: (enabled) => {
                const previousValue = get().webSearchEnabled;
                const provider = get().currentProvider;

                // Sprawdź czy dostawca obsługuje wyszukiwanie
                if (enabled && !get().isWebSearchSupported()) {
                    logger.warn("TOOLS", `Próba włączenia wyszukiwania internetowego dla nieobsługiwanego dostawcy: ${provider}`);
                    return;
                }

                logger.info("TOOLS", `Zmiana stanu wyszukiwania internetowego: ${previousValue} -> ${enabled}, dostawca: ${provider}`);
                set({ webSearchEnabled: enabled });
            },

            setFunctionsEnabled: (enabled) => {
                const previousValue = get().functionsEnabled;
                logger.info("TOOLS", `Zmiana stanu funkcji: ${previousValue} -> ${enabled}`);
                set({ functionsEnabled: enabled });
            },

            // Metody przełączania stanu (toggle)
            toggleFileSearch: () => set((state) => {
                const newState = !state.fileSearchEnabled;
                logger.info("TOOLS", `Przełączenie wyszukiwania plików: ${state.fileSearchEnabled} -> ${newState}`);
                return { fileSearchEnabled: newState };
            }),

            toggleWebSearch: () => set((state) => {
                const provider = state.currentProvider;
                const isSupported = provider.toLowerCase() === "openai" || provider.toLowerCase() === "openrouter";

                if (!isSupported && !state.webSearchEnabled) {
                    // Jeśli próbujemy włączyć wyszukiwanie, ale dostawca go nie obsługuje
                    logger.warn("TOOLS", `Próba włączenia wyszukiwania internetowego dla nieobsługiwanego dostawcy: ${provider}`);
                    return state; // Nie zmieniaj stanu
                }

                const newState = !state.webSearchEnabled;
                logger.info("TOOLS", `Przełączenie wyszukiwania internetowego: ${state.webSearchEnabled} -> ${newState}, dostawca: ${provider}`);

                return { webSearchEnabled: newState };
            }),

            toggleFunctions: () => set((state) => {
                const newState = !state.functionsEnabled;
                logger.info("TOOLS", `Przełączenie funkcji: ${state.functionsEnabled} -> ${newState}`);
                return { functionsEnabled: newState };
            }),

            // Pozostałe metody
            setVectorStore: (store) => set({ vectorStore: store }),

            setWebSearchConfig: (config) => {
                const previousConfig = JSON.stringify(get().webSearchConfig);
                const newConfig = JSON.stringify(config);
                logger.info("TOOLS", `Aktualizacja konfiguracji wyszukiwania internetowego:
                    Z: ${previousConfig}
                    Na: ${newConfig}`);
                set({ webSearchConfig: config });
            },

            setCurrentProvider: (provider) => {
                const previousProvider = get().currentProvider;
                logger.info("TOOLS", `Zmiana dostawcy: ${previousProvider} -> ${provider}`);
                set({ currentProvider: provider });
            },

            // Aktualizacja informacji o dostawcy
            updateProviderInfo: (provider) => {
                const previousProvider = get().currentProvider;
                logger.info("TOOLS", `Aktualizacja dostawcy: ${previousProvider} -> ${provider}`);
                set({ currentProvider: provider });
            },

            // Sprawdza czy używamy Response API czy ChatCompletions dla wyszukiwania
            useResponseApiForSearch: () => {
                const provider = get().currentProvider.toLowerCase();
                // Używaj Response API tylko dla OpenAI
                return provider === "openai";
            },

            // Sprawdza czy aktualny provider wspiera wyszukiwanie
            isWebSearchSupported: () => {
                const provider = get().currentProvider.toLowerCase();
                // Obecnie tylko OpenAI i OpenRouter obsługują wyszukiwanie
                return provider === "openai" || provider === "openrouter";
            }
        }),
        {
            name: "tools-store",
        }
    )
);

export default useToolsStore;
