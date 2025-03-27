import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultVectorStore } from "@/config/constants";

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

            // Metody ustawiania stanu
            setFileSearchEnabled: (enabled) => {
                set({ fileSearchEnabled: enabled });
            },
            setWebSearchEnabled: (enabled) => {
                set({ webSearchEnabled: enabled });
            },
            setFunctionsEnabled: (enabled) => {
                set({ functionsEnabled: enabled });
            },

            // Metody przełączania stanu (toggle)
            toggleFileSearch: () => {
                set({ fileSearchEnabled: !get().fileSearchEnabled });
            },
            toggleWebSearch: () => {
                set({ webSearchEnabled: !get().webSearchEnabled });
            },
            toggleFunctions: () => {
                set({ functionsEnabled: !get().functionsEnabled });
            },

            // Pozostałe metody
            setVectorStore: (store) => set({ vectorStore: store }),
            setWebSearchConfig: (config) => set({ webSearchConfig: config }),
        }),
        {
            name: "tools-store",
        }
    )
);

export default useToolsStore;
