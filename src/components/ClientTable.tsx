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
import { useMemo, useRef, useState, useEffect } from "react";

type ClientWithTags = Client & {
  tags: (TagOnClient & { tag: Tag })[];
};

interface ClientTableProps {
  clients: ClientWithTags[];
  visibleColumns?: Record<string, boolean>;
}

// Helper to format field names nicely
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
}

export function ClientTable({ clients, visibleColumns = {} }: ClientTableProps) {
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

  // Helper to check if column is visible
  const isColumnVisible = (columnId: string) => {
    return visibleColumns[columnId] !== false;
  };

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

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Click and drag to scroll functionality
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setStartX(e.pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (container) {
        container.style.cursor = 'grab';
        container.style.userSelect = 'auto';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, startX, scrollLeft]);

  return (
    <div className="relative">
      {/* Scroll hint */}
      {customFieldNames.length > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Scroll right to see all {5 + customFieldNames.length} columns →</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-medium">
            Use scrollbar below or click & drag table
          </span>
        </div>
      )}

      <div
        ref={tableContainerRef}
        className="overflow-x-auto rounded-lg border cursor-grab"
        style={{
          scrollbarWidth: 'auto',
          scrollbarColor: 'hsl(var(--primary)) hsl(var(--muted))',
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            height: 16px;
          }
          div::-webkit-scrollbar-track {
            background: hsl(var(--muted));
            border-radius: 8px;
            margin: 4px;
          }
          div::-webkit-scrollbar-thumb {
            background: hsl(var(--primary));
            border-radius: 8px;
            border: 2px solid hsl(var(--muted));
            min-width: 80px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--primary) / 0.8);
            cursor: grab;
          }
          div::-webkit-scrollbar-thumb:active {
            background: hsl(var(--primary) / 0.9);
            cursor: grabbing;
          }
        `}</style>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {isColumnVisible("name") && (
                <TableHead className="sticky left-0 z-10 bg-background min-w-[200px] shadow-md">Name</TableHead>
              )}
              {isColumnVisible("phone") && (
                <TableHead className="min-w-[150px]">Phone</TableHead>
              )}
              {isColumnVisible("address") && (
                <TableHead className="min-w-[200px]">Address</TableHead>
              )}
              {isColumnVisible("email") && (
                <TableHead className="min-w-[200px]">Email</TableHead>
              )}
              {isColumnVisible("company") && (
                <TableHead className="min-w-[150px]">Company</TableHead>
              )}
              {isColumnVisible("tags") && (
                <TableHead className="min-w-[150px]">Tags</TableHead>
              )}
              {/* Dynamic custom field columns */}
              {customFieldNames.map((fieldName) => (
                isColumnVisible(fieldName) && (
                  <TableHead key={fieldName} className="min-w-[150px]">
                    {formatFieldName(fieldName)}
                  </TableHead>
                )
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const customFields = (client.customFields || {}) as Record<string, unknown>;
              const fullAddress = [
                client.address1,
                client.address2,
                client.city,
                client.state,
                client.postalCode
              ].filter(Boolean).join(", ");

              return (
                <TableRow key={client.id} className="group">
                  {isColumnVisible("name") && (
                    <TableCell className="sticky left-0 z-10 bg-background group-hover:bg-accent shadow-md">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {client.firstName || client.lastName
                          ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
                          : <span className="text-muted-foreground">—</span>}
                      </Link>
                    </TableCell>
                  )}
                  {isColumnVisible("phone") && (
                    <TableCell>
                      {client.phone || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  )}
                  {isColumnVisible("address") && (
                    <TableCell>
                      {fullAddress || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  )}
                  {isColumnVisible("email") && (
                    <TableCell className="font-medium">
                      {client.email}
                    </TableCell>
                  )}
                  {isColumnVisible("company") && (
                    <TableCell>
                      {client.company || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  )}
                  {isColumnVisible("tags") && (
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
                  )}
                  {/* Dynamic custom field values */}
                  {customFieldNames.map((fieldName) => (
                    isColumnVisible(fieldName) && (
                      <TableCell key={fieldName} className="font-mono text-sm">
                        {customFields[fieldName] !== null &&
                         customFields[fieldName] !== undefined &&
                         String(customFields[fieldName]).trim() !== ""
                          ? String(customFields[fieldName])
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    )
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
