"use client";

import { Download } from "lucide-react";

import { UsageTable } from "@/components/UsageTable";
import { ValidationPanel } from "@/components/ValidationPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResolveResponse } from "@/lib/api/schemas";

export function ResolveResultView({ result }: { result: ResolveResponse }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Resolved codes</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Product {result.productKey} • {result.baseline ? `Baseline ${result.baseline}` : `Branch ${result.branch}`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${result.productKey}-resolve.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {result.resolvedCodes.length === 0 ? (
            <span className="text-sm text-slate-500">No resolved codes.</span>
          ) : (
            result.resolvedCodes.map((code) => <Badge key={code} variant="secondary">{code}</Badge>)
          )}
        </CardContent>
      </Card>
      <ValidationPanel messages={result.validationMessages} />
      <UsageTable usages={result.usages} />
    </div>
  );
}
