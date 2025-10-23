"use client";

import type { Client, Tag, TagOnClient } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Users, Upload } from "lucide-react";
import { useMemo } from "react";

type ClientWithTags = Client & {
  tags: (TagOnClient & { tag: Tag })[];
};

interface ClientTableProps {
  clients: ClientWithTags[];
}

// Helper to format field names nicely
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
}

export function ClientTable({ clients }: ClientTableProps) {
  // Collect all unique custom field names across all clients
  const customFieldNames = useMemo(() => {
    const fieldNames = new Set<string>();
    clients.forEach((client) => {
      if (client.customFields && typeof client.customFields === "object") {
        Object.keys(client.customFields as Record<string, unknown>).forEach((key) => {
          fieldNames.add(key);
        });
      }
    });
    return Array.from(fieldNames).sort();
  }, [clients]);

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 p-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/10 to-violet-600/10">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">No clients yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Get started by importing your first CSV file with customer data
        </p>
        <Button asChild className="mt-6">
          <Link href="/import">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scroll hint */}
      {customFieldNames.length > 0 && (
        <div className="mb-2 text-xs text-muted-foreground">
          Scroll right to see all {5 + customFieldNames.length} columns →
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 bg-background min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[150px]">Company</TableHead>
              <TableHead className="min-w-[150px]">Location</TableHead>
              <TableHead className="min-w-[120px]">Phone</TableHead>
              <TableHead className="min-w-[150px]">Tags</TableHead>
              {/* Dynamic custom field columns */}
              {customFieldNames.map((fieldName) => (
                <TableHead key={fieldName} className="min-w-[150px]">
                  {formatFieldName(fieldName)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const customFields = (client.customFields || {}) as Record<string, unknown>;

              return (
                <TableRow key={client.id} className="group">
                  <TableCell className="sticky left-0 z-10 bg-background group-hover:bg-accent">
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {client.email}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {client.firstName || client.lastName
                      ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {client.company || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {client.city && client.state ? (
                      `${client.city}, ${client.state}`
                    ) : client.city || client.state ? (
                      client.city || client.state
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.phone || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.tags.length > 0 ? (
                        client.tags.slice(0, 2).map((t) => (
                          <Badge key={t.tagId} variant="secondary" className="text-xs">
                            {t.tag.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                      {client.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{client.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {/* Dynamic custom field values */}
                  {customFieldNames.map((fieldName) => (
                    <TableCell key={fieldName} className="font-mono text-sm">
                      {customFields[fieldName] !== null &&
                       customFields[fieldName] !== undefined &&
                       String(customFields[fieldName]).trim() !== ""
                        ? String(customFields[fieldName])
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
