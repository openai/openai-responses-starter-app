import React from "react";
import { Brain, RotateCcw } from "lucide-react";
import Link from "next/link";

type Props = {
  code?: number;
  title?: string;
  message?: string;
  onReset?: () => void;
};

export default function ErrorPage({ 
  code = 500, 
  title = "Something went wrong", 
  message = "An unexpected error occurred.",
  onReset
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-xl w-full text-center bg-card/80 border border-border rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
            <Brain size={28} className="text-primary-foreground" />
          </div>
        </div>
        <div className="text-5xl font-extrabold mb-2">{code}</div>
        <h1 className="text-xl font-semibold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-center gap-3">
          {onReset && (
            <button 
              onClick={onReset}
              className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium gap-2"
            >
              <RotateCcw size={18} />
              Try again
            </button>
          )}
          <Link href="/" className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium">Go home</Link>
        </div>
      </div>
    </div>
  );
}
