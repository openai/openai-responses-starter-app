import { functionsMap } from "../../config/functions";

type ToolName = keyof typeof functionsMap;

export const handleTool = async (toolName: ToolName, parameters: any) => {
  console.log("Handle tool", toolName, parameters);
  if (functionsMap[toolName]) {
    return await functionsMap[toolName](parameters);
  }
  throw new Error(`Unknown tool: ${toolName}`);
};
