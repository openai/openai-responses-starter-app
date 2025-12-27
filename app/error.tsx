"use client";
import React from "react";
import ErrorPage from "@/components/error-page";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <ErrorPage code={500} title="Server error" message="An unexpected server error occurred." />
      <div className="flex justify-center mt-4">
        <button onClick={() => reset()} className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Try again</button>
      </div>
    </div>
  );
}
