"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";

export function CSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  async function handleUpload() {
    if (!file) return;

    setUploading(true);

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

      toast({
        title: "Import successful",
        description: `Created ${result.created}, updated ${result.updated} clients`,
      });

      setFile(null);

      window.location.reload();
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
    <Card>
      <CardHeader>
        <CardTitle>Import Clients</CardTitle>
        <CardDescription>
          Upload a CSV file with columns: email, firstName, lastName, company, phone, city, state,
          postalCode, country, tags
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload CSV"}
        </Button>
      </CardContent>
    </Card>
  );
}
