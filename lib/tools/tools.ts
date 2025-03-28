import { toolsList } from "../../config/tools-list";
import useToolsStore from "@/stores/useToolsStore";
import { WebSearchConfig } from "@/stores/useToolsStore";

interface WebSearchTool extends WebSearchConfig {
  type: "web_search";
}

/**
 * Pobiera listę narzędzi na podstawie aktualnych ustawień
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
  } = useToolsStore.getState();

  const tools = [];

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
  }

  if (fileSearchEnabled && vectorStore?.id) {
    const fileSearchTool = {
      type: "file_search",
      vector_store_ids: [vectorStore.id],
    };
    tools.push(fileSearchTool);
    console.log("File search tool enabled with vector store:", vectorStore.id);
  } else if (fileSearchEnabled) {
    console.warn("File search enabled but no vector store available");
  }

  if (functionsEnabled) {
    tools.push(
      ...toolsList.map((tool) => {
        return {
          type: "function",
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties: { ...tool.parameters },
            required: Object.keys(tool.parameters),
            additionalProperties: false,
          },
          strict: true,
        };
      })
    );
  }

  console.log("tools", tools);

  // Informacja o ilości skonfigurowanych narzędzi
  if (tools.length === 0) {
    console.warn("TOOLS", "Brak skonfigurowanych narzędzi.");
  } else {
    console.info("TOOLS", `Skonfigurowano ${tools.length} narzędzi.`);
  }

  return tools;
};
