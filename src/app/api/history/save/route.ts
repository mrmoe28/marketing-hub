import { addOrUpdateRun, type HistoryRun } from "@/lib/history/store";
import { createSheet, appendRows } from "@/lib/google/sheets";
import { writeRunRows } from "@/lib/history/rows";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEADERS = [
  "company",
  "email",
  "phone",
  "website",
  "city",
  "state",
  "url",
  "source",
];

export async function POST(req: Request) {
  try {
    const { id, metadata, rows, saveToSheets = true } = await req.json();

    if (!id || !rows || !Array.isArray(rows)) {
      throw new Error("id and rows[] required");
    }

    // 1) Save rows locally
    await writeRunRows(id, rows);

    // 2) Optionally save to Google Sheets (default true)
    let sheetId: string | undefined;
    let sheetUrl: string | undefined;

    if (saveToSheets) {
      const title = `${metadata?.industry || "Leads"} — ${metadata?.center || ""} — ${new Date().toISOString().slice(0, 10)}`;
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;
      const created = await createSheet(title, HEADERS, folderId);
      sheetId = created.spreadsheetId;
      sheetUrl = created.spreadsheetUrl;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const values = rows.map((r: any) =>
        HEADERS.map((h) => ((r[h] ?? "") as string))
      );
      await appendRows(sheetId, values);
    }

    const run: HistoryRun = {
      id,
      createdAt: new Date().toISOString(),
      industry: metadata?.industry || "",
      center: metadata?.center || "",
      radiusMiles: Number(metadata?.radiusMiles || 0),
      count: rows.length,
      sheetId,
      sheetUrl,
    };
    await addOrUpdateRun(run);

    return Response.json({ ok: true, sheetId, sheetUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
