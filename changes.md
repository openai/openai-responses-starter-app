# Zmiany wprowadzone w projekcie

## ✅ Backend
- Naprawiono błąd `tools[0].function` w `app/api/turn_response/route.ts`.
- Dodano warunkowe wstawianie `tools` tylko jeśli są prawidłowo zdefiniowane.
- Wprowadzono obsługę `OpenRouter agnostic web search` poprzez dodanie sufiksu `:online` do modeli.
- Ujednolicono routing dostawców i modeli z uwzględnieniem:
  - `OpenAI`: używa `web_search_options` (response API)
  - `OpenRouter`: korzysta z `chat.completions` z sufiksem `:online`

## ✅ Frontend
- Stworzono nowy komponent `ProviderModelSelector`:
  - Ładuje dynamicznie providerów i modele z `/api/models/list`
  - Obsługuje wybór providera i modelu
  - Włącza opcję web search tylko jeśli provider go wspiera
  - Informuje użytkownika, czy używa OpenAI native search czy OpenRouter agnostic search

## 🧹 Usunięcia
- Usunięto z listy providerów nieobsługiwany `local`
