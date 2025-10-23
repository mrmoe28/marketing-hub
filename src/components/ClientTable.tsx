"use client";

import type { Client, Tag, TagOnClient } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

type ClientWithTags = Client & {
  tags: (TagOnClient & { tag: Tag })[];
};

interface ClientTableProps {
  clients: ClientWithTags[];
}

export function ClientTable({ clients }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
        <p className="text-sm text-muted-foreground">No clients yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Import a CSV to get started</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Tags</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>
              <Link
                href={`/clients/${client.id}`}
                className="font-medium hover:underline"
              >
                {client.email}
              </Link>
            </TableCell>
            <TableCell>
              {client.firstName || client.lastName
                ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
                : "—"}
            </TableCell>
            <TableCell>{client.company || "—"}</TableCell>
            <TableCell>
              {client.city && client.state
                ? `${client.city}, ${client.state}`
                : client.city || client.state || "—"}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {client.tags.length > 0 ? (
                  client.tags.map((t) => (
                    <Badge key={t.tagId} variant="secondary">
                      {t.tag.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
