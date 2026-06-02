"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function CodeMultiSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => options.filter((item) => item.toLowerCase().includes(query.toLowerCase()) && !value.includes(item)),
    [options, query, value],
  );

  return (
    <div className="space-y-3">
      <Input placeholder="Search codes" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="flex flex-wrap gap-2">
        {value.length === 0 ? (
          <span className="text-sm text-slate-500">No codes selected.</span>
        ) : (
          value.map((code) => (
            <Badge key={code} variant="secondary" className="gap-2">
              {code}
              <button type="button" aria-label={`Remove ${code}`} onClick={() => onChange(value.filter((item) => item !== code))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      <Card className="max-h-56 overflow-auto p-2">
        <div className="flex flex-wrap gap-2">
          {filtered.map((code) => (
            <Button key={code} type="button" variant="outline" size="sm" onClick={() => onChange([...value, code])}>
              {code}
            </Button>
          ))}
          {filtered.length === 0 && <span className="p-2 text-sm text-slate-500">No matching codes.</span>}
        </div>
      </Card>
    </div>
  );
}
