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
        return Array.isArray(data.data) ? data.data : [];
    } catch (error: any) {
        console.error("Błąd podczas pobierania modeli z OpenAI:", error);
        return []; // Zwracamy pustą tablicę zamiast rzucać błędem
    }
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

        return models;
    } catch (error: any) {
        console.error("Błąd podczas ładowania modeli:", error);
        return [
            { id: "gpt-4o-mini", name: "GPT-4 Mini (OpenRouter)" },
            { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (OpenAI)" }
        ];
    }
}

export { load_models };
