"use client";
import { useEffect, useState } from "react";

type Run = {
  id: string;
  createdAt: string;
  industry: string;
  center: string;
  radiusMiles: number;
  count: number;
  sheetUrl?: string;
};

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/history/list");
      const data = await res.json();
      setRuns(
        (data.runs || []).sort((a: Run, b: Run) =>
          (b.createdAt || "").localeCompare(a.createdAt || "")
        )
      );
    })();
  }, []);

  async function viewJSON(id: string) {
    const res = await fetch(`/api/history/run/${id}/rows`);
    const data = await res.json();
    if (data.ok) {
      setJsonText(JSON.stringify(data.rows, null, 2));
      setJsonOpen(true);
    } else {
      setJsonText(`Error: ${data.error || "Unable to load rows."}`);
      setJsonOpen(true);
    }
  }

  function downloadCSV(id: string) {
    const a = document.createElement("a");
    a.href = `/api/history/run/${id}/csv`;
    a.download = `novaagent-run-${id}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Search History & Saved Spreadsheets
      </h1>
      <div className="rounded-2xl border border-neutral-800 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900">
            <tr>
              {[
                "Date",
                "Industry",
                "Center",
                "Radius(mi)",
                "Leads",
                "Sheet",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="odd:bg-neutral-950">
                <td className="px-3 py-2">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2">{r.industry}</td>
                <td className="px-3 py-2">{r.center}</td>
                <td className="px-3 py-2">{r.radiusMiles}</td>
                <td className="px-3 py-2">{r.count}</td>
                <td className="px-3 py-2">
                  {r.sheetUrl ? (
                    <a
                      className="text-amber-400 underline"
                      href={r.sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Sheet
                    </a>
                  ) : (
                    <span className="opacity-50">—</span>
                  )}
                </td>
                <td className="px-3 py-2 space-x-2">
                  <button
                    onClick={() => downloadCSV(r.id)}
                    className="rounded-xl bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700 transition-colors"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={() => viewJSON(r.id)}
                    className="rounded-xl bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700 transition-colors"
                  >
                    View JSON
                  </button>
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center opacity-60" colSpan={7}>
                  No history yet. Save a run from the Lead Agent.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Simple JSON modal */}
      {jsonOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="w-[min(900px,92vw)] rounded-2xl border border-neutral-700 bg-neutral-950 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Run JSON</h2>
              <button
                onClick={() => setJsonOpen(false)}
                className="rounded-lg bg-neutral-800 px-3 py-1 text-sm hover:bg-neutral-700 transition-colors"
              >
                Close
              </button>
            </div>
            <textarea
              className="w-full h-[60vh] rounded-xl border border-neutral-800 bg-neutral-900 p-3 font-mono text-xs"
              value={jsonText}
              readOnly
            />
          </div>
        </div>
      )}
    </div>
  );
}
