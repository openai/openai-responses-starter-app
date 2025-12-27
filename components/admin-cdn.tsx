"use client";
import React, { useEffect, useState } from "react";

import LoginForm from "./admin-login";

export default function AdminCdnPanel() {
  const [cfg, setCfg] = useState<any>(null);
  const [editing, setEditing] = useState({ baseUrl: "", host: "", signingEnabled: false, defaultTTL: 3600 });
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // check auth first
    fetch("/api/admin/check").then((r) => {
      if (r.ok) {
        fetch("/api/cdn/config").then((r) => r.json()).then((d) => {
          setCfg(d);
          setEditing({ baseUrl: d.baseUrl || "", host: d.host || "", signingEnabled: d.signingEnabled || false, defaultTTL: d.defaultTTL || 3600 });
        });
      } else {
        setCfg({});
      }
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const resp = await fetch("/api/cdn/config", { method: "POST", body: JSON.stringify(editing), headers: { "Content-Type": "application/json" } });
      const j = await resp.json();
      setCfg(j);
      setMessage("Saved");
    } catch {
      setMessage("Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 2400);
    }
  }

  async function saveSecret() {
    setSaving(true);
    try {
      const resp = await fetch("/api/cdn/secret", { method: "POST", body: JSON.stringify({ signingSecret: secret }), headers: { "Content-Type": "application/json" } });
      const j = await resp.json();
      setCfg(j);
      setMessage("Secret saved (hidden)");
    } catch {
      setMessage("Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 2400);
    }
  }

  if (!cfg) {
    return (
      <div className="text-sm text-muted-foreground">
        <p>Admin access required.</p>
        <LoginForm onSuccess={() => {
          // reload the panel to fetch config after successful login
          window.location.reload();
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">Configure the CDN used to serve images. These changes affect all users. In production, protect this UI with authentication.</div>
      <div>
        <label className="block text-xs font-medium">CDN Base URL</label>
        <input value={editing.baseUrl} onChange={(e) => setEditing({ ...editing, baseUrl: e.target.value })} className="w-full rounded border border-border px-2 py-1 bg-input text-sm" placeholder="https://cdn.example.com" />
      </div>
      <div>
        <label className="block text-xs font-medium">CDN Hostname (optional)</label>
        <input value={editing.host} onChange={(e) => setEditing({ ...editing, host: e.target.value })} className="w-full rounded border border-border px-2 py-1 bg-input text-sm" placeholder="cdn.example.com" />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs">Sign URLs</label>
        <input type="checkbox" checked={editing.signingEnabled} onChange={(e) => setEditing({ ...editing, signingEnabled: e.target.checked })} />
        <span className="text-xs text-muted-foreground">When enabled, images will be returned with exp & sig parameters via the signing endpoint.</span>
      </div>
      <div>
        <label className="block text-xs font-medium">Default TTL (seconds)</label>
        <input type="number" value={editing.defaultTTL} onChange={(e) => setEditing({ ...editing, defaultTTL: Number(e.target.value) })} className="w-full rounded border border-border px-2 py-1 bg-input text-sm" />
      </div>
      <div className="flex gap-2">
        <button disabled={saving} onClick={save} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">Save</button>
        <div className="text-sm text-muted-foreground">{message}</div>
      </div>

      <hr />
      <div className="text-xs text-muted-foreground">Signing secret (sensitive)</div>
      <div>
        <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} className="w-full rounded border border-border px-2 py-1 bg-input text-sm" placeholder="New signing secret" />
        <div className="mt-2 flex gap-2">
          <button onClick={saveSecret} disabled={saving || !secret} className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm">Set secret</button>
          <div className="text-sm text-muted-foreground">Note: this sets the signing secret used to HMAC sign CDN URLs. Keep it secure.</div>
        </div>
      </div>
    </div>
  );
}
