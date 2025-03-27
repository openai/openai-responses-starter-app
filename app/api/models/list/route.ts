import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { parse } from "toml";
import { join } from "path";

/**
 * Endpoint pobierający listę dostępnych dostawców i modeli z pliku konfiguracyjnego
 * 
 * @returns Odpowiedź JSON z dostępnymi dostawcami i modelami
 */
export async function GET() {
  try {
    // Ścieżka do pliku konfiguracyjnego
    const config_path = join(process.cwd(), "codemcp.toml");
    
    if (!existsSync(config_path)) {
      return NextResponse.json(
        { error: "Nie znaleziono pliku konfiguracyjnego" },
        { status: 404 }
      );
    }
    
    // Odczytaj i sparsuj plik konfiguracyjny
    const config_content = readFileSync(config_path, "utf-8");
    const parsed_config = parse(config_content);
    
    // Przygotuj dane do zwrócenia
    const providers_with_models: Record<string, string[]> = {};
    
    // Pobierz dostawców i ich modele
    for (const [provider_name, provider_config] of Object.entries(parsed_config.providers || {})) {
      const provider_data = provider_config as any;
      const models = provider_data.models || [];
      
      // Rozwiąż zmienne środowiskowe w nazwach modeli
      const resolved_models = models.map((model: string) => {
        return resolve_env_var(model);
      }).filter(Boolean);
      
      providers_with_models[provider_name] = resolved_models;
    }
    
    return NextResponse.json({
      default_provider: parsed_config.llm?.default_provider || "openai",
      default_model: parsed_config.llm?.default_model || "gpt-4o-mini",
      models: providers_with_models
    });
    
  } catch (error) {
    console.error("Błąd podczas pobierania listy modeli:", error);
    return NextResponse.json(
      { error: "Wystąpił problem podczas pobierania listy modeli" },
      { status: 500 }
    );
  }
}

/**
 * Rozwiązuje zmienne środowiskowe w ciągach znaków
 * 
 * @param value - Wartość, która może zawierać referencje do zmiennych środowiskowych
 * @returns Wartość z rozwiązanymi zmiennymi środowiskowymi
 */
function resolve_env_var(value: string): string {
  if (!value || typeof value !== "string") return value;
  
  // Szukaj ${NAZWA_ZMIENNEJ} i zastąp wartością ze środowiska
  return value.replace(/\${([^}]+)}/g, (_, var_name) => {
    return process.env[var_name] || "";
  });
}