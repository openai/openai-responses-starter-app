import type { Annotation } from "@/components/annotations";
import { DEVELOPER_PROMPT } from "@/config/constants";
import type { functionsMap } from "@/config/functions";
import { handleTool } from "@/lib/tools/tools-handling";
import useConversationStore from "@/stores/useConversationStore";
import { parse } from "partial-json";
import { getTools } from "./tools/tools";

export interface ContentItem {
  type: "input_text" | "output_text" | "refusal" | "output_audio";
  annotations?: Annotation[];
  text?: string;
}

// Message items for storing conversation history matching API shape
export interface MessageItem {
  type: "message";
  role: "user" | "assistant" | "system";
  id?: string;
  content: ContentItem[];
}

// Custom items to display in chat
export interface ToolCallItem {
  type: "tool_call";
  tool_type: "file_search_call" | "web_search_call" | "function_call";
  status: "in_progress" | "completed" | "failed" | "searching";
  id: string;
  name?: string | null;
  call_id?: string;
  arguments?: string;
  parsedArguments?: any;
  output?: string | null;
}

export type Item = MessageItem | ToolCallItem;

export const handleTurn = async (messages: any[], tools: any[], onMessage: (data: any) => void) => {
  try {
    // Get response from the API (defined in app/api/turn_response/route.ts)
    const response = await fetch("/api/turn_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages,
        tools: tools,
      }),
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return;
    }

    if (!response.body) {
      console.error("Response body is null");
      return;
    }

    // Reader for streaming data
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      buffer += chunkValue;

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") {
            done = true;
            break;
          }
          const data = JSON.parse(dataStr);
          onMessage(data);
        }
      }
    }

    // Handle any remaining data in buffer
    if (buffer?.startsWith("data: ")) {
      const dataStr = buffer.slice(6);
      if (dataStr !== "[DONE]") {
        const data = JSON.parse(dataStr);
        onMessage(data);
      }
    }
  } catch (error) {
    console.error("Error handling turn:", error);
  }
};

export const processMessages = async () => {
  const { chatMessages, conversationItems, setChatMessages, setConversationItems } = useConversationStore.getState();

  const tools = getTools();
  const allConversationItems = [
    // Adding developer prompt as first item in the conversation
    {
      role: "developer",
      content: DEVELOPER_PROMPT,
    },
    ...conversationItems,
  ];

  let assistantMessageContent = "";
  let functionArguments = "";

  await handleTurn(allConversationItems, tools, async ({ event, data }) => {
    switch (event) {
      case "response.output_text.delta":
      case "response.output_text.annotation.added": {
        const { delta, item_id, annotation } = data;

        console.log("event", data);

        let partial = "";
        if (typeof delta === "string") {
          partial = delta;
        }
        assistantMessageContent += partial;

        // If the last message isn't an assistant message, create a new one
        const lastItem = chatMessages[chatMessages.length - 1];
        if (
          !lastItem ||
          lastItem.type !== "message" ||
          lastItem.role !== "assistant" ||
          (lastItem.id && lastItem.id !== item_id)
        ) {
          chatMessages.push({
            type: "message",
            role: "assistant",
            id: item_id,
            content: [
              {
                type: "output_text",
                text: assistantMessageContent,
              },
            ],
          } as MessageItem);
        } else {
          const contentItem = lastItem.content[0];
          if (contentItem && contentItem.type === "output_text") {
            contentItem.text = assistantMessageContent;
            if (annotation) {
              contentItem.annotations = [...(contentItem.annotations ?? []), annotation];
            }
          }
        }

        setChatMessages([...chatMessages]);
        break;
      }

      case "response.output_item.added": {
        const { item } = data || {};
        // New item coming in
        if (!item || !item.type) {
          break;
        }
        // Handle differently depending on the item type
        switch (item.type) {
          case "message": {
            const text = item.content?.text || "";
            chatMessages.push({
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text,
                },
              ],
            });
            conversationItems.push({
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text,
                },
              ],
            });
            setChatMessages([...chatMessages]);
            setConversationItems([...conversationItems]);
            break;
          }
          case "function_call": {
            functionArguments += item.arguments || "";
            chatMessages.push({
              type: "tool_call",
              tool_type: "function_call",
              status: "in_progress",
              id: item.id,
              name: item.name, // function name,e.g. "get_weather"
              arguments: item.arguments || "",
              parsedArguments: {},
              output: null,
            });
            setChatMessages([...chatMessages]);
            break;
          }
          case "web_search_call": {
            chatMessages.push({
              type: "tool_call",
              tool_type: "web_search_call",
              status: item.status || "in_progress",
              id: item.id,
            });
            setChatMessages([...chatMessages]);
            break;
          }
          case "file_search_call": {
            chatMessages.push({
              type: "tool_call",
              tool_type: "file_search_call",
              status: item.status || "in_progress",
              id: item.id,
            });
            setChatMessages([...chatMessages]);
            break;
          }
        }
        break;
      }

      case "response.output_item.done": {
        // After output item is done, adding tool call ID
        const { item } = data || {};

        const toolCallMessage = chatMessages.find((m) => m.id === item.id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.call_id = item.call_id;
          setChatMessages([...chatMessages]);
        }
        conversationItems.push(item);
        setConversationItems([...conversationItems]);
        break;
      }

      case "response.function_call_arguments.delta": {
        // Streaming arguments delta to show in the chat
        functionArguments += data.delta || "";
        let parsedFunctionArguments = {};
        if (functionArguments.length > 0) {
          parsedFunctionArguments = parse(functionArguments);
        }

        const toolCallMessage = chatMessages.find((m) => m.id === data.item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.arguments = functionArguments;
          try {
            toolCallMessage.parsedArguments = parsedFunctionArguments;
          } catch {
            // partial JSON can fail parse; ignore
          }
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.function_call_arguments.done": {
        // This has the full final arguments string
        const { item_id, arguments: finalArgs } = data;

        functionArguments = finalArgs;

        // Mark the tool_call as "completed" and parse the final JSON
        const toolCallMessage = chatMessages.find((m) => m.id === item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.arguments = finalArgs;
          toolCallMessage.parsedArguments = parse(finalArgs);
          toolCallMessage.status = "completed";
          setChatMessages([...chatMessages]);

          // Handle tool call (execute function)
          const toolResult = await handleTool(
            toolCallMessage.name as keyof typeof functionsMap,
            toolCallMessage.parsedArguments,
          );

          // Record tool output
          toolCallMessage.output = JSON.stringify(toolResult);
          setChatMessages([...chatMessages]);
          conversationItems.push({
            type: "function_call_output",
            call_id: toolCallMessage.call_id,
            status: "completed",
            output: JSON.stringify(toolResult),
          });
          setConversationItems([...conversationItems]);

          // Create another turn after tool output has been added
          await processMessages();
        }
        break;
      }

      case "response.web_search_call.completed": {
        const { item_id, output } = data;
        const toolCallMessage = chatMessages.find((m) => m.id === item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.output = output;
          toolCallMessage.status = "completed";
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.file_search_call.completed": {
        const { item_id, output } = data;
        const toolCallMessage = chatMessages.find((m) => m.id === item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.output = output;
          toolCallMessage.status = "completed";
          setChatMessages([...chatMessages]);
        }
        break;
      }

      // Handle other events as needed
    }
  });
};
