// Interfejs definiujący metody, które muszą być zaimplementowane przez każdego dostawcę LLM
export interface LLMProvider {
  /**
   * Wysyła żądanie do API LLM i zwraca strumień wydarzeń
   * @param model - Nazwa modelu do użycia
   * @param messages - Wiadomości w konwersacji
   * @param tools - Narzędzia dostępne dla modelu
   * @returns Strumień wydarzeń z odpowiedzią modelu
   */
  createStreamingResponse(model: string, messages: any[], tools: any[]): Promise<ReadableStream>;
  
  /**
   * Sprawdza, czy dostawca obsługuje dany model
   * @param model - Nazwa modelu do sprawdzenia
   * @returns True, jeśli model jest obsługiwany przez dostawcę
   */
  supportsModel(model: string): boolean;
  
  /**
   * Zwraca listę modeli obsługiwanych przez dostawcę
   * @returns Lista obsługiwanych modeli
   */
  getSupportedModels(): string[];
}

/**
 * Konfiguracja dostawcy LLM
 */
export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  models: string[];
}

/**
 * Konfiguracja dla wszystkich dostawców LLM
 */
export interface LLMConfig {
  defaultModel: string;
  defaultProvider: string;
  providers: {
    [key: string]: ProviderConfig;
  };
}