"use client";

import React from "react";
import { Switch } from "./ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { TooltipProvider } from "./ui/tooltip";

export default function PanelConfig({
  title,
  tooltip,
  enabled,
  setEnabled,
  disabled,
  children,
}: {
  title: string;
  tooltip: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const handleToggle = () => {
    setEnabled(!enabled);
  };

  return (
    <div className="space-y-4 mb-6 p-4 rounded-xl bg-muted/30 border border-border/50 transition-all hover:border-primary/20">
      <div className="flex justify-between items-start gap-4">
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="text-sm font-semibold text-foreground tracking-tight">{title}</h1>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-[11px] leading-relaxed text-muted-foreground mt-1 max-w-xs">{tooltip}</p>
        </div>

        <Switch
          id={title}
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={disabled}
          className="data-[state=checked]:bg-primary"
        />
      </div>
      {enabled && children && (
        <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}
