# CLAUDE.md - OpenAI Responses Starter App Guidelines

## Project Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines
- **Imports**: Use absolute imports with @ alias (`@/components/*`). Group imports by external/internal.
- **TypeScript**: Use strict type checking. Define interfaces for data structures. Avoid `any` when possible.
- **Naming**: Use camelCase for variables/functions, PascalCase for components/types, kebab-case for files.
- **Components**: Follow React functional component patterns with explicit prop types.
- **Error Handling**: Use try/catch blocks with specific error messages and logging.
- **State Management**: Use Zustand for global state (see `useConversationStore.ts`).
- **Formatting**: Follow NextJS/TypeScript conventions with 2 space indentation.
- **File Organization**: Group related functionality in directories, separate UI/logic concerns.
- **Comments**: Add JSDoc comments for functions, especially for complex logic.
Struktura projektu React z Next.js
Twój projekt jest oparty na Next.js z TypeScript i React. Oto analiza struktury:

Główne technologie
Next.js - framework React z serwerowym renderowaniem
TypeScript - typowany JavaScript
React - biblioteka UI
npm/pnpm - zarządzanie pakietami (używasz pnpm - widoczne po pliku pnpm-lock.yaml)
Kluczowe katalogi
app/ - zawiera główne komponenty strony (układ, strona główna) zgodnie z konwencją Next.js App Router
components/ - komponenty React używane w aplikacji
Widoczne komponenty jak file-upload.tsx, chat.tsx, annotations.tsx itd.
Podkatalog ui/ prawdopodobnie zawiera bazowe komponenty interfejsu
config/ - pliki konfiguracyjne, stałe i definicje funkcji
lib/ - funkcje pomocnicze i logika biznesowa
public/ - pliki statyczne (obrazy, fonty)
stores/ - zarządzanie stanem aplikacji (widoczne są sklepy useConversationStore.ts, useToolsStore.ts) - prawdopodobnie używasz Zustand lub podobnej biblioteki
Pliki konfiguracyjne
.env i .env.example - zmienne środowiskowe
tailwind.config.ts - konfiguracja Tailwind CSS
next.config.mjs - konfiguracja Next.js
tsconfig.json - konfiguracja TypeScript
eslint.config.mjs - konfiguracja ESLint
Funkcjonalność
Bazując na plikach, projekt wydaje się być aplikacją konwersacyjną z asystentem AI:

Obsługuje czat (chat.tsx, message.tsx)
Zawiera narzędzia do przesyłania plików (file-upload.tsx)
Prawdopodobnie integruje się z OpenAI (openai-helpers.ts, openai_logo.svg)
Posiada funkcjonalność przetwarzania PDF (pdf-processing.ts, pdf-ocr.ts)
Obsługuje wyszukiwanie w plikach (file-search-setup.tsx)
Komponent file-upload.tsx, który jest aktualnie otwarty, służy do przesyłania plików i zarządzania magazynem wektorowym (vector store), co sugeruje funkcjonalność wyszukiwania podobieństwa semantycznego.
