import { toolsList } from "../../config/tools-list";
import useToolsStore from "@/stores/useToolsStore";
import { WebSearchConfig } from "@/stores/useToolsStore";
import logger from "@/lib/logger";

interface WebSearchTool extends WebSearchConfig {
  type: "web_search";
}

/**
 * Pobiera listę narzędzi na podstawie aktualnych ustawień
 * Obsługuje zarówno format Chat Completions API, jak i Responses API
 *
 * @returns {Array} Tablica skonfigurowanych narzędzi do użycia z API
 */
export const getTools = () => {
  const {
    webSearchEnabled,
    fileSearchEnabled,
    functionsEnabled,
    vectorStore,
    webSearchConfig,
    getApiType
  } = useToolsStore.getState();

  const isResponsesApi = getApiType() === "response";
  const tools = [];

  // Specjalne narzędzia do wyszukiwania w internecie i plikach
  // Responses API obsługuje je inaczej niż Chat Completions
  if (!isResponsesApi) {
    // Dla Chat Completions API dodajemy narzędzia bezpośrednio do tablicy narzędzi
    if (webSearchEnabled) {
      const webSearchTool: WebSearchTool = {
        type: "web_search",
      };
      if (
        webSearchConfig.user_location &&
        (webSearchConfig.user_location.country !== "" ||
          webSearchConfig.user_location.region !== "" ||
          webSearchConfig.user_location.city !== "")
      ) {
        webSearchTool.user_location = webSearchConfig.user_location;
      }

      tools.push(webSearchTool);
      logger.info("TOOLS", "Dodano narzędzie wyszukiwania internetowego (Chat Completions format)");
    }

    if (fileSearchEnabled && vectorStore?.id) {
      const fileSearchTool = {
        type: "file_search",
        vector_store_ids: [vectorStore.id],
      };
      tools.push(fileSearchTool);
      logger.info("TOOLS", `File search tool enabled with vector store: ${vectorStore.id}`);
    } else if (fileSearchEnabled) {
      logger.warn("TOOLS", "File search enabled but no vector store available");
    }
  }
  // Dla Responses API narzędzia wyszukiwania są przekazywane osobno w apiConfig

  // Obsługa funkcji (wspólne dla obu API, ale format jest dostosowywany w route.ts)
  if (functionsEnabled) {
    const functionTools = toolsList.map((tool) => {
      return {
        type: "function",
        name: tool.name,
        description: tool.description,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties: { ...tool.parameters },
            required: Object.keys(tool.parameters),
            additionalProperties: false,
          },
        },
        strict: true,
      };
    });
    
    tools.push(...functionTools);
    logger.info("TOOLS", `Dodano ${functionTools.length} funkcji narzędziowych`);
  }

  // Informacja o ilości skonfigurowanych narzędzi
  if (tools.length === 0) {
    logger.warn("TOOLS", "Brak skonfigurowanych narzędzi.");
  } else {
    logger.info("TOOLS", `Skonfigurowano ${tools.length} narzędzi (format API: ${isResponsesApi ? 'Responses' : 'Chat Completions'})`);
  }

  return tools;
};
