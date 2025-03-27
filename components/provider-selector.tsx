"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProviderSelectorProps {
  provider: string;
  onProviderChange: (provider: string) => void;
}

export default function ProviderSelector({
  provider,
  onProviderChange,
}: ProviderSelectorProps) {
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pobierz listę dostępnych dostawców
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/models/list");
        if (!response.ok) {
          throw new Error("Nie udało się pobrać listy dostawców");
        }
        
        const data = await response.json();
        const providers = Object.keys(data.models || {});
        
        setAvailableProviders(providers);
        
        // Jeśli aktualny dostawca nie jest dostępny, użyj pierwszego z listy
        if (providers.length > 0 && !providers.includes(provider)) {
          onProviderChange(providers[0]);
        }
      } catch (error) {
        console.error("Błąd podczas pobierania listy dostawców:", error);
        setAvailableProviders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [provider, onProviderChange]);

  // Mapowanie nazw dostawców na bardziej przyjazne nazwy
  const getProviderDisplayName = (providerName: string): string => {
    const displayNames: Record<string, string> = {
      openai: "OpenAI",
      openrouter: "OpenRouter",
      custom: "Custom LLM",
    };
    
    return displayNames[providerName] || providerName;
  };

  return (
    <div className="w-full">
      <Select 
        value={provider} 
        onValueChange={onProviderChange}
        disabled={isLoading || availableProviders.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue 
            placeholder={isLoading ? "Ładowanie dostawców..." : "Wybierz dostawcę"} 
          />
        </SelectTrigger>
        <SelectContent>
          {availableProviders.map((providerName) => (
            <SelectItem key={providerName} value={providerName}>
              {getProviderDisplayName(providerName)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}