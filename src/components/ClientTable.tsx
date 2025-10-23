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

type ClientWithTags = Client & {
  tags: (TagOnClient & { tag: Tag })[];
};

interface ClientTableProps {
  clients: ClientWithTags[];
}

export function ClientTable({ clients }: ClientTableProps) {
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="group">
              <TableCell>
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
                <div className="flex flex-wrap gap-1">
                  {client.tags.length > 0 ? (
                    client.tags.slice(0, 3).map((t) => (
                      <Badge key={t.tagId} variant="secondary" className="text-xs">
                        {t.tag.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                  {client.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{client.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
