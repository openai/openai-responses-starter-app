"use client";
import React, { useEffect } from "react";
import ErrorPage from "@/components/error-page";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <ErrorPage 
      code={500} 
      title="Server error" 
      message={error.message || "An unexpected server error occurred."} 
      onReset={reset}
    />
  );
}
