// stores/AppProviderContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AppContextType {
    providers: string[];
    selectedProvider: string | null;
    setSelectedProvider: (provider: string) => void;
    loading: boolean;
    error: string | null;
    refreshProviders: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [providers, setProviders] = useState<string[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshProviders = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/models/list");
            const data = await res.json();

            const keys = Object.keys(data.models || {});
            setProviders(keys);

            if (!selectedProvider && keys.length > 0) {
                setSelectedProvider(keys[0]);
            }
        } catch (err: any) {
            setError("Błąd ładowania providerów");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshProviders();
    }, []);

    return (
        <AppContext.Provider
            value={{
                providers,
                selectedProvider,
                setSelectedProvider,
                loading,
                error,
                refreshProviders,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within AppProvider");
    return context;
};
