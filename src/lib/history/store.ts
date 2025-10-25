import { promises as fs } from "fs";
import path from "path";
import { existsRunRows } from "./rows";

const HISTORY_FILE = path.join(process.cwd(), "data", "history.json");

export type HistoryRun = {
  id: string;
  createdAt: string;
  industry: string;
  center: string;
  radiusMiles: number;
  count: number;
  sheetId?: string;
  sheetUrl?: string;
};

async function ensureDataDir() {
  const dir = path.dirname(HISTORY_FILE);
  await fs.mkdir(dir, { recursive: true });
}

export async function getAllRuns(): Promise<HistoryRun[]> {
  try {
    await ensureDataDir();
    const txt = await fs.readFile(HISTORY_FILE, "utf8");
    return JSON.parse(txt);
  } catch {
    return [];
  }
}

export async function addOrUpdateRun(run: HistoryRun): Promise<void> {
  await ensureDataDir();
  const runs = await getAllRuns();
  const idx = runs.findIndex((r) => r.id === run.id);
  if (idx >= 0) {
    runs[idx] = run;
  } else {
    runs.push(run);
  }
  await fs.writeFile(HISTORY_FILE, JSON.stringify(runs, null, 2), "utf8");
}

export async function hasRows(id: string): Promise<boolean> {
  return existsRunRows(id);
}
