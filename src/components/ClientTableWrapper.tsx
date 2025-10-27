"use client";

import { useState, useMemo } from "react";
import type { Client, Tag, TagOnClient } from "@prisma/client";
import { ClientTable } from "@/components/ClientTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Table as TableIcon, LayoutGrid, Settings2 } from "lucide-react";

type ClientWithTags = Client & {
  tags: (TagOnClient & { tag: Tag })[];
};

interface ClientTableWrapperProps {
  clients: ClientWithTags[];
  totalCount: number;
}

type ViewMode = "table" | "card";

const DEFAULT_COLUMNS = [
  { id: "name", label: "Name", enabled: true },
  { id: "phone", label: "Phone", enabled: true },
  { id: "address", label: "Address", enabled: true },
  { id: "email", label: "Email", enabled: true },
  { id: "company", label: "Company", enabled: true },
  { id: "tags", label: "Tags", enabled: true },
];

export function ClientTableWrapper({ clients, totalCount }: ClientTableWrapperProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    DEFAULT_COLUMNS.forEach(col => {
      initial[col.id] = col.enabled;
    });
    return initial;
  });

  // Collect all unique custom field names
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

  // Initialize custom field visibility
  useMemo(() => {
    customFieldNames.forEach(fieldName => {
      if (!(fieldName in visibleColumns)) {
        setVisibleColumns(prev => ({ ...prev, [fieldName]: true }));
      }
    });
  }, [customFieldNames, visibleColumns]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const allColumns = [
    ...DEFAULT_COLUMNS,
    ...customFieldNames.map(name => ({ id: name, label: name, enabled: true })),
  ];

  return (
    <>
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">All Clients ({totalCount})</h2>
            <p className="text-sm text-muted-foreground">View and manage your imported clients</p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center rounded-lg border bg-background p-1">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3"
              >
                <TableIcon className="mr-2 h-4 w-4" />
                Table
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("card")}
                className="h-8 px-3"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Card
              </Button>
            </div>

            {/* Column Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[400px] overflow-y-auto">
                  {allColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={visibleColumns[column.id] !== false}
                      onCheckedChange={() => toggleColumn(column.id)}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="p-6">
        {viewMode === "table" ? (
          <ClientTable clients={clients} visibleColumns={visibleColumns} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="group relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-blue-600 dark:text-blue-400">
                      {client.firstName || client.lastName
                        ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
                        : "—"}
                    </h3>
                    {visibleColumns.email !== false && (
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    )}
                  </div>

                  {visibleColumns.phone !== false && client.phone && (
                    <div className="text-sm">
                      <span className="font-medium">Phone:</span> {client.phone}
                    </div>
                  )}

                  {visibleColumns.company !== false && client.company && (
                    <div className="text-sm">
                      <span className="font-medium">Company:</span> {client.company}
                    </div>
                  )}

                  {visibleColumns.address !== false && (
                    <>
                      {(client.address1 || client.city || client.state) && (
                        <div className="text-sm">
                          <span className="font-medium">Address:</span>
                          <br />
                          {[
                            client.address1,
                            client.address2,
                            client.city,
                            client.state,
                            client.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}
                    </>
                  )}

                  {visibleColumns.tags !== false && client.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {client.tags.map((t) => (
                        <span
                          key={t.tagId}
                          className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs"
                        >
                          {t.tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
