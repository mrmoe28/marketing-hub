"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, CheckCircle2, FileSpreadsheet } from "lucide-react";

export function CSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      setSuccess(true);
      toast({
        title: "Import successful",
        description: `Created ${result.created}, updated ${result.updated} clients`,
      });

      setFile(null);

      setTimeout(() => {
        window.location.href = "/clients";
      }, 1500);
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
            <FileSpreadsheet className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>Import your client list in seconds</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">Select File</Label>
          <div className="relative">
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
              disabled={uploading || success}
            />
          </div>
          {file && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <span className="flex-1 font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </div>

        {success ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-600/10 p-4 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Import successful! Redirecting...</span>
          </div>
        ) : (
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full shadow-lg shadow-blue-500/20"
            size="lg"
          >
            {uploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
