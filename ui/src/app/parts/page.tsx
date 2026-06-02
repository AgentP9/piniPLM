"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useParts } from "@/lib/api/queries";

export default function PartsPage() {
  const partsQuery = useParts();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return (partsQuery.data ?? []).filter((part) => `${part.key} ${part.name}`.toLowerCase().includes(query.toLowerCase()));
  }, [partsQuery.data, query]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parts</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search by key or name" value={query} onChange={(event) => setQuery(event.target.value)} />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((part) => (
          <Card key={part.id}>
            <CardHeader>
              <CardTitle className="text-base">{part.key}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{part.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
