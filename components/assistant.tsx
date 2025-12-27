"use client";
import React from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import useToolsStore from "@/stores/useToolsStore";
import { Item, processMessages } from "@/lib/assistant";

export default function Assistant() {
  const { chatMessages, addConversationItem, addChatMessage, setAssistantLoading } =
    useConversationStore();
  const { vectorStore, setVectorStore, setFileSearchEnabled } = useToolsStore();

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleSendMessage = async (message: string, file?: File) => {
    if (!message.trim() && !file) return;

    try {
      setAssistantLoading(true);

      let fileInfo = "";
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const base64Content = arrayBufferToBase64(arrayBuffer);
        
        // 1. Upload file
        const uploadResponse = await fetch("/api/vector_stores/upload_file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileObject: { name: file.name, content: base64Content },
          }),
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          const fileId = uploadData.id;
          
          let currentStoreId = vectorStore?.id;
          
          // 2. Create store if needed
          if (!currentStoreId) {
            const createResponse = await fetch("/api/vector_stores/create_store", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: "Chat Uploads" }),
            });
            if (createResponse.ok) {
              const createData = await createResponse.json();
              if (createData?.id) {
                currentStoreId = createData.id;
                setVectorStore({ id: createData.id, name: "Chat Uploads" });
              }
            }
          }
          
          // 3. Add to store
          if (currentStoreId) {
            await fetch("/api/vector_stores/add_file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileId, vectorStoreId: currentStoreId }),
            });
            setFileSearchEnabled(true);
            fileInfo = `\n\n[Uploaded file: ${file.name}]`;
          }
        }
      }

      const fullMessage = message.trim() + fileInfo;

      const userItem: Item = {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: fullMessage }],
      };
      const userMessage: any = {
        role: "user",
        content: fullMessage,
      };

      addConversationItem(userMessage);
      addChatMessage(userItem);
      await processMessages();
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleApprovalResponse = async (
    approve: boolean,
    id: string
  ) => {
    const approvalItem = {
      type: "mcp_approval_response",
      approve,
      approval_request_id: id,
    } as any;
    try {
      addConversationItem(approvalItem);
      await processMessages();
    } catch (error) {
      console.error("Error sending approval response:", error);
    }
  };

  return (
    <div className="h-full w-full bg-background">
      <Chat
        items={chatMessages}
        onSendMessage={handleSendMessage}
        onApprovalResponse={handleApprovalResponse}
      />
    </div>
  );
}
