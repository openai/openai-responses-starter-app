"use client";
import React, { useState } from "react";

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/login", { method: "POST", body: JSON.stringify({ password }), headers: { "Content-Type": "application/json" } });
      if (!resp.ok) {
        setError("Invalid password");
      } else {
        if (onSuccess) onSuccess();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div>
        <label className="block text-xs font-medium">Admin password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded border border-border px-2 py-1 bg-input text-sm" />
      </div>
      <div className="flex gap-2">
        <button disabled={loading} onClick={(e) => submit(e)} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">Sign in</button>
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>
    </form>
  );
}
