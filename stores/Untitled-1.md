Cel: Zaktualizować logikę aplikacji, aby korzystała z nowego OpenAI Responses API zamiast Chat Completions API.

Kroki:

1.  **Zidentyfikuj miejsca wywołań API**:
    *   Znajdź wszystkie miejsca w kodzie, gdzie wywoływana jest funkcja `openai.chat.completions.create()` (lub odpowiednik w używanej bibliotece). Prawdopodobne lokalizacje to `lib/assistant.ts` (np. w `handleTurn` lub podobnej funkcji) oraz potencjalnie w trasach API (np. `app/api/.../route.ts`).

2.  **Zmień metodę wywołania API**:
    *   Zastąp wywołania `openai.chat.completions.create()` nową metodą `openai.responses.create()`.

3.  **Dostosuj parametry wejściowe**:
    *   Zmień nazwę parametru przekazującego historię konwersacji z `messages` na `input`. Upewnij się, że format danych przekazywanych do `input` jest zgodny z oczekiwaniami Responses API (prawdopodobnie tablica obiektów `{ role: '...', content: '...' }`).
    *   Jeśli używasz narzędzi (function calling), dostosuj format definicji narzędzi zgodnie z dokumentacją Responses API.

4.  **Dostosuj przetwarzanie odpowiedzi strumieniowej**:
    *   **Analiza struktury zdarzeń**: Responses API emituje "zdarzenia semantyczne" zamiast ciągłego dołączania do pola `content`. Zbadaj strukturę tych nowych zdarzeń (np. `text_delta`, `tool_call_delta`, `message_stop` itp.) zwracanych przez `openai.responses.create({ stream: true })`.
    *   **Aktualizacja logiki strumienia**: Zmodyfikuj logikę przetwarzania strumienia (np. w `create_stream_response` w `app/api/turn_response/route.ts` lub w pętli `while` w `lib/assistant.ts`). Zamiast szukać danych w `chunk.choices[0].delta.content` lub `chunk.choices[0].delta.tool_calls`, odczytuj dane na podstawie typu zdarzenia semantycznego zwróconego w strumieniu.
    *   **Ekstrakcja danych**: Zaktualizuj sposób wyodrębniania treści tekstowej, adnotacji i wywołań narzędzi z poszczególnych zdarzeń strumienia. Na przykład, treść tekstowa może znajdować się w zdarzeniu typu `text_delta` w polu `text`. Adnotacje mogą być częścią tego samego zdarzenia lub osobnym zdarzeniem.

5.  **Dostosuj przetwarzanie odpowiedzi niestrumieniowej (jeśli dotyczy)**:
    *   Jeśli w niektórych miejscach nie używasz strumieniowania, zmodyfikuj kod tak, aby odczytywał odpowiedź z pola `output` (lub używał helpera `output_text`), zamiast iterować po tablicy `choices` i odczytywać `message.content`.

6.  **Zaktualizuj obsługę narzędzi (Function Calling)**:
    *   Dostosuj sposób definiowania narzędzi przekazywanych w żądaniu.
    *   Zmień logikę obsługi odpowiedzi zawierających wywołania narzędzi, aby pasowała do struktury zwracanej przez Responses API.

7.  **Wykorzystaj zarządzanie stanem (Opcjonalnie)**:
    *   Rozważ użycie parametru `previous_response_id` w kolejnych wywołaniach `openai.responses.create()`, aby uprościć zarządzanie stanem konwersacji, jeśli obecna implementacja jest skomplikowana.

8.  **Dostosuj komponenty Frontendowe**:
    *   Przejrzyj komponenty takie jak `components/message.tsx` i `components/annotations.tsx`.
    *   Zaktualizuj sposób dostępu do danych wiadomości, treści i adnotacji, aby odzwierciedlić nową strukturę odpowiedzi z Responses API (np. dostęp do `message.content[0].text.value` zamiast `message.content[0].text`, jeśli tak zwraca API).

9.  **Weryfikacja modelu**:
    *   Sprawdź w dokumentacji OpenAI, czy używane modele (np. `gpt-4o-mini`) są w pełni kompatybilne z Responses API i jego funkcjami (np. narzędziami).

10. **Testowanie**:
    *   Dokładnie przetestuj całą aplikację, zwracając szczególną uwagę na:
        *   Poprawne generowanie i wyświetlanie odpowiedzi tekstowych.
        *   Płynne działanie strumieniowania.
        *   Poprawne działanie narzędzi (jeśli są używane).
        *   Poprawne wyświetlanie adnotacji (`url_citation`, `file_citation`).
