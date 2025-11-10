"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Client, Tag, TagOnClient } from "@prisma/client";

type ClientWithTags = Client & {
  tags: (TagOnClient & { tag: Tag })[];
};

interface SegmentBuilderProps {
  clients: ClientWithTags[];
  onAudienceChange: (clientIds: string[]) => void;
}

export function SegmentBuilder({ clients, onAudienceChange }: SegmentBuilderProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState("");

  const allTags = Array.from(
    new Set(clients.flatMap((c) => c.tags.map((t) => t.tag.name)))
  ).sort();

  const filteredClients = clients.filter((client) => {
    const hasTag =
      selectedTags.length === 0 ||
      client.tags.some((t) => selectedTags.includes(t.tag.name));

    const hasState =
      !stateFilter ||
      client.state?.toLowerCase().includes(stateFilter.toLowerCase());

    return hasTag && hasState;
  });

  const handleApply = () => {
    onAudienceChange(filteredClients.map((c) => c.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audience</CardTitle>
        <CardDescription>Select who should receive this campaign</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Filter by Tags</Label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                className={`rounded-full px-3 py-1 text-sm ${
                  selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Filter by State</Label>
          <Input
            id="state"
            placeholder="e.g., GA, FL"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filteredClients.length} recipients</p>
          <Button onClick={handleApply}>Apply Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
}
