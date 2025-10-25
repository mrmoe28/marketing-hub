import { readRunRows } from "@/lib/history/rows";
import Papa from "papaparse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const rows = await readRunRows(id);
    const csv = Papa.unparse(rows, { header: true });

    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="novaagent-run-${id}.csv"`,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
