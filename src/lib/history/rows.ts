import { promises as fs } from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "data", "runs");

async function ensureDir() {
  await fs.mkdir(ROOT, { recursive: true });
}

export async function rowsPath(id: string) {
  await ensureDir();
  return path.join(ROOT, `${id}.json`);
}

export async function writeRunRows(id: string, rows: unknown[]) {
  const p = await rowsPath(id);
  await fs.writeFile(p, JSON.stringify(rows, null, 2), "utf8");
  return p;
}

export async function readRunRows(id: string) {
  const p = await rowsPath(id);
  const txt = await fs.readFile(p, "utf8");
  return JSON.parse(txt);
}

export async function existsRunRows(id: string) {
  try {
    const p = await rowsPath(id);
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
