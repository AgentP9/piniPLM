"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResolveUsage } from "@/lib/api/schemas";
import { formatMatrix, groupUsagesByOrg } from "@/lib/utils";

function MatrixMiniView({ value }: { value: number[] }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-md bg-slate-100 p-2 text-[11px]">
      {value.map((cell, index) => (
        <div key={index} className="rounded bg-white px-1 py-0.5 text-center text-slate-600">
          {Number(cell).toFixed(2)}
        </div>
      ))}
    </div>
  );
}

export function UsageTable({ usages }: { usages: ResolveUsage[] }) {
  const grouped = useMemo(() => groupUsagesByOrg(usages), [usages]);

  if (usages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resolved usages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No usages resolved for the selected codes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([orgNodeKey, rows]) => (
        <Card key={orgNodeKey}>
          <CardHeader>
            <CardTitle className="text-base">{orgNodeKey}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>PCSS</TableHead>
                  <TableHead>Transform</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((usage) => (
                  <TableRow key={usage.usageMasterId}>
                    <TableCell className="font-medium">{usage.partKey}</TableCell>
                    <TableCell>{usage.conditionExpr || "Always"}</TableCell>
                    <TableCell>{usage.pcssExpr}</TableCell>
                    <TableCell className="min-w-48"><MatrixMiniView value={usage.finalTransform4x4} /></TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(formatMatrix(usage.finalTransform4x4))}
                      >
                        Copy
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
