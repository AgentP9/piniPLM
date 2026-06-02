"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function BaselineBranchSelector({
  baseline,
  branch,
  onChange,
}: {
  baseline?: string | null;
  branch?: string | null;
  onChange: (values: { mode: "baseline" | "branch"; baseline: string; branch: string }) => void;
}) {
  const [mode, setMode] = useState<"baseline" | "branch">(baseline ? "baseline" : "branch");
  const [baselineValue, setBaselineValue] = useState(baseline ?? "");
  const [branchValue, setBranchValue] = useState(branch ?? "main");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button type="button" variant={mode === "baseline" ? "default" : "outline"} onClick={() => setMode("baseline")}>
            Release
          </Button>
          <Button type="button" variant={mode === "branch" ? "default" : "outline"} onClick={() => setMode("branch")}>
            Preview
          </Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className={cn("space-y-2", mode !== "baseline" && "opacity-60")}> 
            <Label htmlFor="baseline-name">Baseline</Label>
            <Input
              id="baseline-name"
              placeholder="R2026.01"
              value={baselineValue}
              onChange={(event) => setBaselineValue(event.target.value)}
              disabled={mode !== "baseline"}
            />
          </div>
          <div className={cn("space-y-2", mode !== "branch" && "opacity-60")}> 
            <Label htmlFor="branch-name">Branch</Label>
            <Input
              id="branch-name"
              placeholder="main"
              value={branchValue}
              onChange={(event) => setBranchValue(event.target.value)}
              disabled={mode !== "branch"}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() =>
                onChange({
                  mode,
                  baseline: baselineValue,
                  branch: branchValue || "main",
                })
              }
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
