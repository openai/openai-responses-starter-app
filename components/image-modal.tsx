"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import Image from "next/image";

export default function ImageModal({ src, alt }: { src: string; alt?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="underline text-sm">Preview</button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{alt || "Image preview"}</DialogTitle>
        </DialogHeader>
        <div className="w-full h-[60vh] relative">
          <Image
            src={src}
            alt={alt || "preview"}
            fill
            unoptimized
            sizes="100vw"
            className="object-contain"
          />
        </div>
        <div className="mt-4 text-right">
          <DialogClose className="text-sm text-muted-foreground">Close</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
