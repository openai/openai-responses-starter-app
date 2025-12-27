"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import useToolsStore from "@/stores/useToolsStore";
import { Check, Github } from "lucide-react";

export default function GithubIntegrationPanel() {
  const [connected, setConnected] = useState<boolean>(false);
  const [oauthConfigured, setOauthConfigured] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/oauth/github/status")
      .then((r) => r.json())
      .then((d) => {
        setConnected(Boolean(d.connected));
        setOauthConfigured(Boolean(d.oauthConfigured));
      })
      .catch(() => {
        setConnected(false);
        setOauthConfigured(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      {!connected ? (
        <div className="space-y-2">
          {oauthConfigured ? (
            <a href="/api/oauth/github/auth" onClick={() => useToolsStore.getState().setGithubEnabled(true)}>
              <Button className="w-full flex items-center gap-2">
                <Github size={16} />
                Connect GitHub
              </Button>
            </a>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex w-full">
                    <Button disabled className="w-full flex items-center gap-2">
                      <Github size={16} />
                      Connect GitHub
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and
                    GITHUB_REDIRECT_URI must be set in .env to use the
                    GitHub Integration.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg shadow-sm border border-border p-3 bg-card">
            <div className="bg-primary/10 text-primary rounded-md p-1">
              <Check size={16} />
            </div>
            <p className="text-sm text-foreground">GitHub connected</p>
          </div>
        </div>
      )}
    </div>
  );
}
