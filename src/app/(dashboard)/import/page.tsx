import { CSVImport } from "@/components/CSVImport";
import { FileSpreadsheet } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Clients</h1>
        <p className="text-muted-foreground">Upload a CSV file to add or update clients</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <CSVImport />

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold">CSV Format</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Your CSV should have these columns (all optional except email):
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <code className="font-mono text-blue-600">email</code>
                <span className="ml-auto text-xs text-muted-foreground">required</span>
              </div>
              {[
                "firstName",
                "lastName",
                "company",
                "phone",
                "address1",
                "address2",
                "city",
                "state",
                "postalCode",
                "country",
              ].map((field) => (
                <div
                  key={field}
                  className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  <code className="font-mono text-muted-foreground">{field}</code>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600/10 to-blue-600/10 px-3 py-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                <code className="font-mono text-violet-600">tags</code>
                <span className="ml-auto text-xs text-muted-foreground">
                  comma-separated
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-gradient-to-br from-blue-600/5 to-violet-600/5 p-6">
            <h3 className="mb-2 font-semibold">Pro Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span>•</span>
                <span>Existing clients (by email) will be updated</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>New clients will be automatically subscribed to emails</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Tags are case-sensitive and auto-created if they don't exist</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Duplicate emails in the same file will be skipped</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
