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

    // Informacje o aktualnym modelu
    selectedModel: string;
    setSelectedModel: (model: string) => void;

    // Dostępni dostawcy i ich modele
    availableProviders: Record<string, string[]>;
    setAvailableProviders: (providers: Record<string, string[]>) => void;

    // Metody aktualizacji informacji o dostawcy
    updateProviderInfo: (provider: string) => void;

    // Metoda sprawdzająca czy używamy Response API czy ChatCompletions
    useResponseApiForSearch: () => boolean;

    // Sprawdza czy provider wspiera wyszukiwanie internetowe
    isWebSearchSupported: () => boolean;

    // Zwraca typ API dla aktualnie wybranego dostawcy
    getApiType: () => "response" | "chat_completions";

    // Zwraca typ wyszukiwania dla aktualnie wybranego dostawcy
    getWebSearchType: () => "openai" | "openrouter" | null;
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
            selectedModel: "gpt-4o-mini", // Domyślny model dla OpenAI
            availableProviders: {}, // Początkowo pusta lista dostawców i ich modeli

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

                // Pobierz dostępne modele dla nowego dostawcy
                const availableModels = get().availableProviders[provider] || [];

                // Ustaw pierwszy model z listy jako domyślny, jeśli są dostępne modele
                if (availableModels.length > 0) {
                    get().setSelectedModel(availableModels[0]);
                }

                set({ currentProvider: provider });

                // Jeśli wyszukiwanie internetowe jest włączone, a nowy dostawca go nie obsługuje, wyłącz je
                if (get().webSearchEnabled && !get().isWebSearchSupported()) {
                    set({ webSearchEnabled: false });
                    logger.warn("TOOLS", `Wyłączono wyszukiwanie internetowe dla nieobsługiwanego dostawcy: ${provider}`);
                }
            },

            // Metoda do ustawiania wybranego modelu
            setSelectedModel: (model) => {
                const previousModel = get().selectedModel;
                logger.info("TOOLS", `Zmiana modelu: ${previousModel} -> ${model}`);
                set({ selectedModel: model });
            },

            // Metoda do ustawiania listy dostępnych dostawców i ich modeli
            setAvailableProviders: (providers) => {
                logger.info("TOOLS", `Aktualizacja listy dostępnych dostawców i modeli: ${JSON.stringify(providers)}`);
                set({ availableProviders: providers });

                // Jeśli aktualny dostawca nie jest już dostępny, użyj pierwszego z listy
                const currentProvider = get().currentProvider;
                if (!Object.keys(providers).includes(currentProvider) && Object.keys(providers).length > 0) {
                    const newProvider = Object.keys(providers)[0];
                    get().setCurrentProvider(newProvider);
                }
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
            },

            // Zwraca typ API dla aktualnie wybranego dostawcy
            getApiType: () => {
                const provider = get().currentProvider.toLowerCase();
                return provider === "openai" ? "response" : "chat_completions";
            },

            // Zwraca typ wyszukiwania dla aktualnie wybranego dostawcy
            getWebSearchType: () => {
                const provider = get().currentProvider.toLowerCase();
                return provider === "openai" ? "openai" : provider === "openrouter" ? "openrouter" : null;
            }
        }),
        {
            name: "tools-store",
        }
    )
);

export default useToolsStore;
