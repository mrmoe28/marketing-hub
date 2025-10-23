import { CSVImport } from "@/components/CSVImport";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Clients</h1>
        <p className="text-muted-foreground">Upload a CSV file to add or update clients</p>
      </div>

      <div className="max-w-2xl">
        <CSVImport />
      </div>

      <div className="max-w-2xl space-y-4 rounded-lg border p-6">
        <h2 className="font-semibold">CSV Format</h2>
        <p className="text-sm text-muted-foreground">
          Your CSV should have these columns (all optional except email):
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>email (required)</li>
          <li>firstName</li>
          <li>lastName</li>
          <li>company</li>
          <li>phone</li>
          <li>address1, address2</li>
          <li>city, state, postalCode, country</li>
          <li>tags (comma-separated, e.g., "solar,residential")</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Existing clients (by email) will be updated. New clients will be created.
        </p>
      </div>
    </div>
  );
}
