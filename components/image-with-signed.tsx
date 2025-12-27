"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import ImageModal from "./image-modal";

export default function ImageWithSigned({ originalSrc, alt }: { originalSrc: string; alt?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function resolveSrc() {
      setLoading(true);
      try {
        // Ask server for CDN config
        const cfg = await fetch("/api/cdn/config").then((r) => r.json());
        const base = cfg.baseUrl || null;
        const signingEnabled = cfg.signingEnabled;
        if (signingEnabled) {
          // Request signed url from server
          const q = new URLSearchParams({ url: originalSrc }).toString();
          const resp = await fetch(`/api/cdn/sign?${q}`).then((r) => r.json());
          if (mounted) setSrc(resp.signedUrl || originalSrc);
        } else if (base) {
          // Rewrite to CDN base
          try {
            const parsed = new URL(originalSrc, window.location.origin);
            const cdn = new URL(base);
            cdn.pathname = parsed.pathname;
            cdn.search = parsed.search;
            if (mounted) setSrc(cdn.toString());
          } catch {
            if (mounted) setSrc(originalSrc);
          }
        } else {
          if (mounted) setSrc(originalSrc);
        }
      } catch {
        if (mounted) setSrc(originalSrc);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    resolveSrc();
    return () => {
      mounted = false;
    };
  }, [originalSrc]);

  if (loading) {
    return <div className="h-36 bg-muted rounded animate-pulse" />;
  }

  if (!src) return null;

  return (
    <div className="mt-3 w-full max-w-full">
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <Image
          src={src}
          alt={alt || "image"}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain rounded"
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Source: {src.startsWith("http") ? new URL(src).hostname : window.location.hostname}
        </div>
        <div>
          <ImageModal src={src} alt={alt} />
        </div>
      </div>
    </div>
  );
}
