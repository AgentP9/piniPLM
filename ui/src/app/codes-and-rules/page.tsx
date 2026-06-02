"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCodes, useRuleMasters } from "@/lib/api/queries";

export default function CodesAndRulesPage() {
  const codesQuery = useCodes();
  const rulesQuery = useRuleMasters();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Codes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(codesQuery.data ?? []).map((code) => (
            <Badge key={code.key} variant="secondary">{code.key}</Badge>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rule masters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(rulesQuery.data ?? []).map((rule) => (
            <div key={rule.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium">{rule.rule_type}</p>
              <p className="text-slate-500">Scope: {rule.scope_type} {rule.product_id ? `• ${rule.product_id}` : ""}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
