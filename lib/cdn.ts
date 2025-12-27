import fs from "fs/promises";
import path from "path";

const configPath = path.resolve(process.cwd(), "config/cdn.json");

export type CdnConfig = {
  baseUrl: string;
  host: string;
  signingEnabled: boolean;
  signingSecret: string;
  defaultTTL: number;
};

export async function readCdnConfig(): Promise<CdnConfig> {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const cfg = JSON.parse(raw) as CdnConfig;
    return cfg;
  } catch {
    // Return defaults if file missing or invalid
    return {
      baseUrl: "",
      host: "",
      signingEnabled: false,
      signingSecret: "",
      defaultTTL: 3600,
    };
  }
}

export async function writeCdnConfig(cfg: Partial<CdnConfig>) {
  const current = await readCdnConfig();
  const next = { ...current, ...cfg } as CdnConfig;
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(next, null, 2), "utf-8");
  return next;
}
