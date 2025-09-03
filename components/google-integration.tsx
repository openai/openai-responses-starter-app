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
import { Check } from "lucide-react";

export default function GoogleIntegrationPanel() {
  const [connected, setConnected] = useState<boolean>(false);
  const [oauthConfigured, setOauthConfigured] = useState<boolean>(false);
  const googleIntegrationEnabled = useToolsStore(
    (s) => s.googleIntegrationEnabled
  );

  useEffect(() => {
    fetch("/api/google/status")
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
            googleIntegrationEnabled ? (
              <a href="/api/google/auth">
                <Button>Connect Google Integration</Button>
              </a>
            ) : (
              <span className="inline-flex">
                <Button disabled>Connect Google Integration</Button>
              </span>
            )
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button disabled>Connect Google Integration</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and
                    GOOGLE_REDIRECT_URI must be set in .env.local to use the
                    Google Integration.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg shadow-sm border p-3 bg-white">
            <div className="bg-blue-100 text-blue-500 rounded-md p-1">
              <Check size={16} />
            </div>
            <p className="text-sm text-zinc-800">Google OAuth set up</p>
          </div>
        </div>
      )}
    </div>
  );
}
