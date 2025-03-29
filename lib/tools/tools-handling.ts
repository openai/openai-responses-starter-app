import { functionsMap } from "../../config/functions";
import useConversationStore from "@/stores/useConversationStore";
import logger from "@/lib/logger";

type ToolName = keyof typeof functionsMap;

interface ToolCallParams {
  name: string;
  args: any;
  message_id?: string;
}

/**
 * Obsługuje wywołanie narzędzia (funkcji)
 * Obsługuje wywołania zarówno z Chat Completions API jak i Responses API
 * 
 * @param {Object} params - Parametry wywołania narzędzia
 * @param {string} params.name - Nazwa wywoływanego narzędzia
 * @param {Object} params.args - Argumenty przekazywane do narzędzia
 * @param {string} [params.message_id] - Opcjonalne ID wiadomości do aktualizacji po wykonaniu narzędzia
 * @returns {Promise<any>} - Wynik działania narzędzia
 */
export const handleTool = async ({ name, args, message_id }: ToolCallParams) => {
  const toolName = name as ToolName;
  
  logger.info("TOOL_HANDLING", `Wywołanie narzędzia: ${toolName}`);
  logger.info("TOOL_HANDLING", `Argumenty: ${JSON.stringify(args)}`);
  
  if (functionsMap[toolName]) {
    try {
      // Stwórz tymczasowe ID narzędzia, jeśli nie zostało przekazane
      const toolId = crypto.randomUUID();
      
      // Dodaj informację o wywołaniu narzędzia do stanu konwersacji, jeśli mamy dostęp do magazynu
      if (useConversationStore) {
        const toolCall = {
          id: toolId,
          tool_type: "function_call",
          status: "in_progress",
          name: toolName,
          parsedArguments: args
        };
        useConversationStore.getState().addToolCall?.(toolCall);
      }
      
      // Wywołaj funkcję
      const result = await functionsMap[toolName](args);
      logger.info("TOOL_HANDLING", `Wynik działania narzędzia: ${JSON.stringify(result)}`);
      
      // Zaktualizuj stan narzędzia w magazynie konwersacji
      if (useConversationStore) {
        useConversationStore.getState().updateToolCallResult?.(toolId, result, "completed");
      }
      
      return result;
    } catch (error) {
      logger.error("TOOL_HANDLING", `Błąd podczas wywołania narzędzia ${toolName}: ${error}`);
      
      // Zaktualizuj stan narzędzia w magazynie konwersacji (jeśli błąd)
      if (useConversationStore && typeof useConversationStore.getState().updateToolCallResult === 'function') {
        useConversationStore.getState().updateToolCallResult?.(
          message_id || "", 
          error instanceof Error ? error.message : "Nieznany błąd", 
          "failed"
        );
      }
      
      throw error;
    }
  } else {
    const errorMessage = `Nieznane narzędzie: ${toolName}`;
    logger.error("TOOL_HANDLING", errorMessage);
    throw new Error(errorMessage);
  }
};
