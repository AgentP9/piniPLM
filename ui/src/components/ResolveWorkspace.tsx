"use client";

import { useState } from "react";

import { CodeMultiSelect } from "@/components/CodeMultiSelect";
import { ResolveResultView } from "@/components/ResolveResultView";
import { RestrictedAccess } from "@/components/RestrictedAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCodes, useResolve } from "@/lib/api/queries";
import { ForbiddenError } from "@/lib/api/client";

export function ResolveWorkspace({
  productKey,
  baseline,
  branch,
}: {
  productKey: string;
  baseline?: string | null;
  branch?: string | null;
}) {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const codesQuery = useCodes();
  const resolveMutation = useResolve(productKey);

  if (resolveMutation.error instanceof ForbiddenError) {
    return <RestrictedAccess description="No product access or insufficient clearance for this resolve request." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resolve structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeMultiSelect options={(codesQuery.data ?? []).map((code) => code.key)} value={selectedCodes} onChange={setSelectedCodes} />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => resolveMutation.mutate({ baseline, branch, selectedCodes })}
              disabled={resolveMutation.isPending || (!baseline && !branch)}
            >
              {resolveMutation.isPending ? "Resolving..." : "Run resolve"}
            </Button>
            <p className="text-sm text-slate-500">
              {baseline ? `Baseline mode: ${baseline}` : `Branch mode: ${branch ?? "main"}`}
            </p>
          </div>
          {resolveMutation.error && !(resolveMutation.error instanceof ForbiddenError) && (
            <p className="text-sm text-red-600">{resolveMutation.error.message}</p>
          )}
        </CardContent>
      </Card>
      {resolveMutation.data && <ResolveResultView result={resolveMutation.data} />}
    </div>
  );
}
