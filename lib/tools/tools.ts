import { toolsList } from "../../config/tools-list";
import { ToolsState, WebSearchConfig } from "@/stores/useToolsStore";
import { getFreshAccessToken } from "@/lib/connectors-auth";
import { getGoogleConnectorTools } from "./connectors";

interface WebSearchTool extends WebSearchConfig {
  type: "web_search";
}

export const getTools = async (toolsState: ToolsState) => {
  const {
    webSearchEnabled,
    fileSearchEnabled,
    functionsEnabled,
    codeInterpreterEnabled,
    vectorStore,
    webSearchConfig,
    mcpEnabled,
    mcpConfig,
    googleIntegrationEnabled,
  } = toolsState;

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

  if (fileSearchEnabled) {
    const fileSearchTool = {
      type: "file_search",
      vector_store_ids: [vectorStore?.id],
    };
    tools.push(fileSearchTool);
  }

  if (codeInterpreterEnabled) {
    tools.push({ type: "code_interpreter", container: { type: "auto" } });
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

  if (mcpEnabled && mcpConfig.server_url && mcpConfig.server_label) {
    const mcpTool: any = {
      type: "mcp",
      server_label: mcpConfig.server_label,
      server_url: mcpConfig.server_url,
    };
    if (mcpConfig.skip_approval) {
      mcpTool.require_approval = "never";
    }
    if (mcpConfig.allowed_tools.trim()) {
      mcpTool.allowed_tools = mcpConfig.allowed_tools
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    }
    tools.push(mcpTool);
  }

  if (googleIntegrationEnabled) {
    // Get fresh tokens (refresh if near expiry or missing access token when refresh exists)
    const { accessToken } = await getFreshAccessToken();
    tools.push(...getGoogleConnectorTools(accessToken!));
  }

  return tools;
};
