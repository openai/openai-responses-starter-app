"use client";
import React, { useCallback, useState, FormEvent, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { FilePlus2, Plus, Trash2, CircleX } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ModelSelector } from "./model-selector";

interface FileUploadProps {
  vectorStoreId?: string;
  vectorStoreName?: string;
  onAddStore: (id: string) => void;
  onUnlinkStore: () => void;
}

export default function FileUpload({
  vectorStoreId,
  onAddStore,
  onUnlinkStore,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [newStoreName, setNewStoreName] = useState<string>("Default store");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  // Dodane stany dla wyboru providera i modelu
  const [selected_provider, set_selected_provider] = useState<string>("openai");
  const [selected_model, set_selected_model] = useState<string>("gpt-4o-mini");

  const acceptedFileTypes = {
    "text/x-c": [".c"],
    "text/x-c++": [".cpp"],
    "text/x-csharp": [".cs"],
    "text/css": [".css"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "text/x-golang": [".go"],
    "text/html": [".html"],
    "text/x-java": [".java"],
    "text/javascript": [".js"],
    "application/json": [".json"],
    "text/markdown": [".md"],
    "application/pdf": [".pdf"],
    "text/x-php": [".php"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      [".pptx"],
    "text/x-python": [".py"],
    "text/x-script.python": [".py"],
    "text/x-ruby": [".rb"],
    "application/x-sh": [".sh"],
    "text/x-tex": [".tex"],
    "application/typescript": [".ts"],
    "text/plain": [".txt"],
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: acceptedFileTypes,
  });

  const removeFile = () => {
    setFile(null);
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  /**
   * Obsługuje zmianę dostawcy modeli
   * 
   * @param provider - Wybrany dostawca
   */
  const handle_provider_change = (provider: string) => {
    set_selected_provider(provider);
  };

  /**
   * Obsługuje zmianę modelu
   * 
   * @param model - Wybrany model
   */
  const handle_model_change = (model: string) => {
    set_selected_model(model);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    if (!newStoreName.trim()) {
      alert("Please enter a vector store name.");
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Content = arrayBufferToBase64(arrayBuffer);
      const fileObject = {
        name: file.name,
        content: base64Content,
      };

      // Dodajemy informacje o providerze i modelu
      const uploadResponse = await fetch("/api/vector_stores/add_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileObject,
          collectionName: newStoreName,
          provider: selected_provider,
          model: selected_model
        }),
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Error uploading file");
      }
      
      const data = await uploadResponse.json();
      setUploadSuccess(true);
      setFilename(data.filename);
      
      // Jeśli odpowiedź zawiera ID vector store, przekaż je do rodzica
      if (data.vectorStoreId) {
        onAddStore(data.vectorStoreId);
      }
      
      // Zamykamy dialog po udanym przesłaniu
      setDialogOpen(false);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message || "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div className="bg-white rounded-full flex items-center justify-center py-1 px-3 border border-zinc-200 gap-1 font-medium text-sm cursor-pointer hover:bg-zinc-50 transition-all">
          <Plus size={16} />
          Upload
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add files to your vector store</DialogTitle>
          </DialogHeader>
          
          {/* Informacje o vector store */}
          <div className="my-6">
            {!vectorStoreId || vectorStoreId === "" ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 text-sm">
                  <label className="font-medium w-72" htmlFor="storeName">
                    New vector store name
                    <div className="text-xs text-zinc-400">
                      A new store will be created when you upload a file.
                    </div>
                  </label>
                  <Input
                    id="storeName"
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="border rounded p-2"
                  />
                </div>
                
                {/* Dodany selektor modeli */}
                <div className="flex items-start gap-2 text-sm">
                  <label className="font-medium w-72">
                    Model provider and type
                    <div className="text-xs text-zinc-400">
                      Select the provider and model to use for embeddings.
                    </div>
                  </label>
                  <div className="flex-1">
                    <ModelSelector 
                      onProviderChange={handle_provider_change}
                      onModelChange={handle_model_change}
                      defaultProvider={selected_provider}
                      defaultModel={selected_model}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-sm font-medium w-24 text-nowrap">
                    Vector store
                  </div>
                  <div className="text-zinc-400 text-xs font-mono flex-1 text-ellipsis truncate">
                    {vectorStoreId}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CircleX
                          onClick={() => onUnlinkStore()}
                          size={16}
                          className="cursor-pointer text-zinc-400 mb-0.5 shrink-0 mt-0.5 hover:text-zinc-700 transition-all"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Unlink vector store</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
          
          {/* Dropzone do przesyłania plików */}
          <div className="flex justify-center items-center mb-4 h-[200px]">
            {file ? (
              <div className="flex flex-col items-start">
                <div className="text-zinc-400">Loaded file</div>
                <div className="flex items-center mt-2">
                  <div className="text-zinc-900 mr-2">{file.name}</div>

                  <Trash2
                    onClick={removeFile}
                    size={16}
                    className="cursor-pointer text-zinc-900"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div
                  {...getRootProps()}
                  className="p-6 flex items-center justify-center relative focus-visible:outline-0"
                >
                  <input {...getInputProps()} />
                  <div
                    className={`absolute rounded-full transition-all duration-300 ${isDragActive
                      ? "h-56 w-56 bg-zinc-100"
                      : "h-0 w-0 bg-transparent"
                      }`}
                  ></div>
                  <div className="flex flex-col items-center text-center z-10 cursor-pointer">
                    <FilePlus2 className="mb-4 size-8 text-zinc-700" />
                    <div className="text-zinc-700">Upload a file</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Wyświetlanie błędów i informacji o sukcesie */}
          {uploadError && (
            <div className="text-red-500 mb-4 text-sm">{uploadError}</div>
          )}
          
          {uploadSuccess && (
            <div className="text-green-500 mb-4 text-sm">
              File uploaded successfully!
            </div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? "Uploading..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}