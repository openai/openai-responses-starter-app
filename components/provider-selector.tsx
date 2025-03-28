"use client";

import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/stores/AppProviderContext"; // Dodaj import

export default function ProviderSelector() {
    // Użyj hooka useAppContext
    const {
        providers,
        selectedProvider,
        setSelectedProvider,
        loading,
        error,
    } = useAppContext();

    // Obsługa ładowania i błędów z kontekstu
    if (loading) return <div>Ładowanie...</div>;
    if (error) return <div>{error}</div>;

    // Renderowanie Select z danymi z kontekstu
    return (
        <Select value={selectedProvider ?? ""} onValueChange={setSelectedProvider}>
            <SelectTrigger>
                <SelectValue placeholder="Wybierz providera" />
            </SelectTrigger>
            <SelectContent>
                {providers.map((p) => (
                    <SelectItem key={p} value={p}>
                        {p}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
