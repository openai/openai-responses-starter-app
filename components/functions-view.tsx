"use client";

import { toolsList } from "@/config/tools-list";
import { Code } from "lucide-react";
import React from "react";

type ToolParameter = {
  type: string;
  description?: string;
  enum?: string[];
  properties?: { [key: string]: string | unknown };
};

const getToolArgs = (parameters: {
  [key: string]: ToolParameter | undefined;
}) => {
  return (
    <div className="ml-4">
      {Object.entries(parameters).map(([key, value]) => (
        <div key={key} className="flex items-center text-xs space-x-2 my-1">
          <span className="text-primary font-medium">{key}:</span>
          <span className="text-muted-foreground">{value?.type}</span>
        </div>
      ))}
    </div>
  );
};

export default function FunctionsView() {
  return (
    <div className="flex flex-col space-y-4">
      {toolsList.map((tool) => (
        <div key={tool.name} className="flex items-start gap-2">
          <div className="bg-primary/10 text-primary rounded-md p-1">
            <Code size={16} />
          </div>
          <div className="text-foreground font-mono text-sm mt-0.5">
            {tool.name}(
            {tool.parameters && Object.keys(tool.parameters).length > 0
              ? getToolArgs(tool.parameters)
              : ""}
            )
          </div>
        </div>
      ))}
    </div>
  );
}
