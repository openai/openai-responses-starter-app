import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Ładowanie fontów lokalnych
const geist_sans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geist_mono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

// Metadane aplikacji
export const metadata: Metadata = {
    title: "AI Assistant | OpenAI Responses",
    description: "Inteligentny asystent AI wykorzystujący OpenAI Responses API",
    icons: {
        icon: "/openai_logo.svg",
    },
};

/**
 * Główny układ aplikacji
 * Definiuje strukturę HTML i zastosowanie fontów
 *
 * @param children - Komponenty potomne
 * @returns Komponent układu strony
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl" className="h-full">
            <body
                className={`${geist_sans.variable} ${geist_mono.variable} antialiased h-full`}
            >
                <div className="flex flex-col h-full w-full bg-gray-50 text-slate-900">
                    {/*
                      * Zoptymalizowana belka nagłówkowa:
                      * - Ograniczona wysokość do h-8 (32px)
                      * - Minimalny padding (py-0.5)
                      * - Mniejszy tekst dla oszczędności miejsca
                      * - Z-index 10 zapewnia, że belka będzie zawsze widoczna
                    */}
                    <header className="bg-white border-b border-gray-200 py-0.5 px-4 hidden md:flex h-8 shadow-sm z-10 items-center">
                        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
                            <h1 className="text-sm font-semibold">AI Assistant</h1>
                            <div className="text-xs text-gray-500">Powered by OpenAI Responses</div>
                        </div>
                    </header>

                    {/*
                      * Main zajmuje całą dostępną przestrzeń, ale nie więcej:
                      * - flex-1 zapewnia, że main wypełni dostępną przestrzeń
                      * - overflow-hidden zapobiega pojawienie się paska przewijania
                    */}
                    <main className="flex-1 overflow-hidden">{children}</main>
                </div>
            </body>
        </html>
    );
}
