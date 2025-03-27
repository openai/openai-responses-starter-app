"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ModelSelectorProps {
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  defaultProvider?: string;
  defaultModel?: string;
}

/**
 * Komponent umożliwiający wybór dostawcy modeli oraz konkretnego modelu
 * 
 * @param onProviderChange - Funkcja wywoływana przy zmianie dostawcy
 * @param onModelChange - Funkcja wywoływana przy zmianie modelu
 * @param defaultProvider - Domyślny dostawca
 * @param defaultModel - Domyślny model
 */
export function ModelSelector({ 
  onProviderChange, 
  onModelChange, 
  defaultProvider, 
  defaultModel 
}: ModelSelectorProps) {
  const [is_loading, set_is_loading] = useState<boolean>(true);
  const [error, set_error] = useState<string | null>(null);
  const [providers, set_providers] = useState<Record<string, string[]>>({});
  const [selected_provider, set_selected_provider] = useState<string>("");
  const [selected_model, set_selected_model] = useState<string>("");
  const [dialog_open, set_dialog_open] = useState<boolean>(false);
  
  // Pobieranie dostępnych dostawców i modeli przy pierwszym renderowaniu
  useEffect(() => {
    const fetch_models = async () => {
      try {
        set_is_loading(true);
        set_error(null);
        
        const response = await fetch("/api/models/list");
        
        if (!response.ok) {
          throw new Error(`Błąd HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        set_providers(data.models || {});
        
        // Ustaw domyślnego dostawcę i model
        const provider = defaultProvider || data.default_provider || Object.keys(data.models)[0] || "";
        set_selected_provider(provider);
        
        const available_models = data.models[provider] || [];
        const model = defaultModel || data.default_model || available_models[0] || "";
        set_selected_model(model);
        
      } catch (error) {
        console.error("Błąd podczas pobierania listy modeli:", error);
        set_error("Nie udało się pobrać listy modeli. Spróbuj ponownie później.");
      } finally {
        set_is_loading(false);
      }
    };
    
    fetch_models();
  }, [defaultProvider, defaultModel]);
  
  // Aktualizacja wybranego modelu po zmianie dostawcy
  useEffect(() => {
    if (selected_provider && providers[selected_provider]) {
      const available_models = providers[selected_provider];
      
      // Jeśli aktualny model nie jest dostępny u nowego dostawcy, wybierz pierwszy dostępny
      if (!available_models.includes(selected_model) && available_models.length > 0) {
        set_selected_model(available_models[0]);
      }
    }
  }, [selected_provider, providers, selected_model]);
  
  // Wywołanie funkcji zwrotnych przy zmianie dostawcy lub modelu
  useEffect(() => {
    if (selected_provider) {
      onProviderChange(selected_provider);
    }
  }, [selected_provider, onProviderChange]);
  
  useEffect(() => {
    if (selected_model) {
      onModelChange(selected_model);
    }
  }, [selected_model, onModelChange]);
  
  // Obsługa zmiany dostawcy
  const handle_provider_change = (provider: string) => {
    set_selected_provider(provider);
  };
  
  // Obsługa zmiany modelu
  const handle_model_change = (model: string) => {
    set_selected_model(model);
  };
  
  return (
    <Dialog open={dialog_open} onOpenChange={set_dialog_open}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="text-xs h-8 flex items-center gap-2"
        >
          {is_loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Ładowanie modeli...
            </>
          ) : (
            <>
              <span className="font-semibold">{selected_provider}</span>
              <span className="text-zinc-500">|</span>
              <span>{selected_model}</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Wybierz model</DialogTitle>
        </DialogHeader>
        
        {is_loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Ładowanie dostępnych modeli...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 py-4">{error}</div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="provider-select" className="text-sm font-medium">
                Dostawca
              </label>
              <Select 
                value={selected_provider}
                onValueChange={handle_provider_change}
              >
                <SelectTrigger id="provider-select">
                  <SelectValue placeholder="Wybierz dostawcę" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(providers).map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="model-select" className="text-sm font-medium">
                Model
              </label>
              <Select
                value={selected_model}
                onValueChange={handle_model_change}
                disabled={!selected_provider || providers[selected_provider]?.length === 0}
              >
                <SelectTrigger id="model-select">
                  <SelectValue placeholder="Wybierz model" />
                </SelectTrigger>
                <SelectContent>
                  {(providers[selected_provider] || []).map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}