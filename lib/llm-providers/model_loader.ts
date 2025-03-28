/**
 * @fileoverview Moduł odpowiedzialny za ładowanie list dostępnych modeli LLM z różnych źródeł.
 */

/**
 * @async
 * @function fetch_openrouter_models
 * @description Pobiera listę modeli z OpenRouter API.
 * @returns {Promise<any[]>} Lista modeli z OpenRouter.
 * @throws {Error} W przypadku błędu podczas pobierania danych.
 */
async function fetch_openrouter_models(): Promise<any[]> {
    const openrouter_url = "https://openrouter.ai/api/v1/models";
    const api_key = process.env.OPENROUTER_API_KEY;

    try {
        const response = await fetch(openrouter_url, {
            headers: {
                "Authorization": `Bearer ${api_key}`
            }
        });

        if (!response.ok) {
            throw new Error(`Błąd HTTP: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data.data) ? data.data : [];
    } catch (error: any) {
        console.error("Błąd podczas pobierania modeli z OpenRouter:", error);
        return []; // Zwracamy pustą tablicę zamiast rzucać błędem
    }
}

/**
 * @async
 * @function fetch_openai_models
 * @description Pobiera listę modeli z OpenAI API.
 * @returns {Promise<any[]>} Lista modeli z OpenAI.
 * @throws {Error} W przypadku błędu podczas pobierania danych.
 */
async function fetch_openai_models(): Promise<any[]> {
    const openai_url = "https://api.openai.com/v1/models";
    const api_key = process.env.OPENAI_API_KEY;

    console.info("MODEL_LOADER", "Rozpoczęto pobieranie modeli z OpenAI API");

    try {
        const response = await fetch(openai_url, {
            headers: {
                "Authorization": `Bearer ${api_key}`
            }
        });

        if (!response.ok) {
            throw new Error(`Błąd HTTP: ${response.status}`);
        }

        const data = await response.json();

        console.info("MODEL_LOADER", `Załadowano ${data.data.length} modeli z OpenAI API`);

        return Array.isArray(data.data) ? data.data : [];
    } catch (error: any) {
        console.error("Błąd podczas pobierania modeli z OpenAI:", error);
        return []; // Zwracamy pustą tablicę zamiast rzucać błędem
    }
}

/**
 * @async
 * @function validate_model
 * @description Sprawdza, czy podany model jest prawidłowy. Jeśli nie, zwraca domyślny model `gpt-3.5-turbo`.
 * @param {string} model - Identyfikator modelu do walidacji.
 * @returns {string} Prawidłowy identyfikator modelu.
 */
function validate_model(model: string): string {
    const valid_models = [
        "gpt-3.5-turbo",
        "gpt-4o",
        "gpt-4-turbo",
        "gpt-4o-mini",
        "claude-3-haiku",
        "llama-3-8b",
        "mixtral-8x7b"
    ];

    if (!valid_models.includes(model)) {
        console.warn(`Nieprawidłowy model: ${model}. Używam domyślnego modelu: gpt-3.5-turbo.`);
        return "gpt-3.5-turbo";
    }

    return model;
}

/**
 * @async
 * @function load_models
 * @description Agreguje listę modeli z różnych źródeł (OpenRouter, OpenAI).
 * @returns {Promise<any[]>} Agregowana lista modeli.
 */
async function load_models(): Promise<any[]> {
    try {
        const [openrouter_models, openai_models] = await Promise.allSettled([
            fetch_openrouter_models(),
            fetch_openai_models()
        ]);

        const models = [
            ...(openrouter_models.status === 'fulfilled' ? openrouter_models.value : []),
            ...(openai_models.status === 'fulfilled' ? openai_models.value : [])
        ];

        if (models.length === 0) {
            console.warn("Nie udało się pobrać żadnych modeli. Używam modeli domyślnych.");
            return [
                { id: "gpt-4o-mini", name: "GPT-4 Mini (OpenRouter)" },
                { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (OpenAI)" }
            ];
        }

        const validated_models = models.map((model) => validate_model(model.id));
        console.info("MODEL_LOADER", `Załadowano ${validated_models.length} modeli po walidacji.`);

        return validated_models;
    } catch (error: any) {
        console.error("Błąd podczas ładowania modeli:", error);
        return [
            { id: "gpt-4o-mini", name: "GPT-4 Mini (OpenRouter)" },
            { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (OpenAI)" }
        ];
    }
}
export interface Provider {
    id: string;
    name: string;
    supportsWebSearch: boolean;
    webSearchType?: 'responses' | 'api' | 'agnostic';
    models: string[];
}

/**
 * @async
 * @function load_providers
 * @description Pobiera listę dostawców i ich modeli z konfiguracją wyszukiwania internetowego
 * @returns {Promise<Record<string, Provider>>} Mapa dostawców i ich konfiguracji
 */
async function load_providers(): Promise<Record<string, Provider>> {
    console.info("MODEL_LOADER", "Rozpoczęto ładowanie dostawców i ich modeli");

    try {
        const [openrouter_models, openai_models] = await Promise.allSettled([
            fetch_openrouter_models(),
            fetch_openai_models()
        ]);

        const providers: Record<string, Provider> = {
            openai: {
                id: 'openai',
                name: 'OpenAI',
                supportsWebSearch: true,
                webSearchType: 'responses',
                models: openai_models.status === 'fulfilled'
                    ? openai_models.value.map((model: any) => model.id)
                    : ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo']
            },
            openrouter: {
                id: 'openrouter',
                name: 'OpenRouter',
                supportsWebSearch: true,
                webSearchType: 'api',
                models: openrouter_models.status === 'fulfilled'
                    ? openrouter_models.value.map((model: any) => model.id)
                    : ['gpt-4o-mini', 'claude-3-haiku']
            },
            local: {
                id: 'local',
                name: 'Lokalne LLM',
                supportsWebSearch: false,
                models: ['llama-3-8b', 'mixtral-8x7b']
            }
        };

        console.info("MODEL_LOADER", `Dostawca OpenAI: ${providers.openai.models.length} modeli`);
        console.info("MODEL_LOADER", `Dostawca OpenRouter: ${providers.openrouter.models.length} modeli`);

        return providers;
    } catch (error: any) {
        console.error("Błąd podczas ładowania dostawców i modeli:", error);
        return {
            openai: {
                id: 'openai',
                name: 'OpenAI',
                supportsWebSearch: true,
                webSearchType: 'responses',
                models: ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo']
            },
            openrouter: {
                id: 'openrouter',
                name: 'OpenRouter',
                supportsWebSearch: true,
                webSearchType: 'api',
                models: ['gpt-4o-mini', 'claude-3-haiku']
            },
            local: {
                id: 'local',
                name: 'Lokalne LLM',
                supportsWebSearch: false,
                models: ['llama-3-8b', 'mixtral-8x7b']
            }
        };
    }
}

export { load_models, load_providers };
