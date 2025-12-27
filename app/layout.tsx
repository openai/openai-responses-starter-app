import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { APP_NAME } from "@/config/constants";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "TacticDev Generative Intelligence Assistant",
  icons: {
    icon: "/brain.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen w-full flex-col">
          {/* Top-right theme switcher and other global controls */}
          <main className="flex-1 h-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
