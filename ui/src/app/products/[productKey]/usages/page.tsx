"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { OrgTreeView } from "@/components/OrgTreeView";
import { RestrictedAccess } from "@/components/RestrictedAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOrgNodes, useParts, useProducts, useUsageMasters } from "@/lib/api/queries";

export default function ProductUsagesPage() {
  const params = useParams<{ productKey: string }>();
  const productsQuery = useProducts();
  const orgNodesQuery = useOrgNodes();
  const partsQuery = useParts();
  const product = (productsQuery.data ?? []).find((item) => item.key === params.productKey);
  const usagesQuery = useUsageMasters(product?.id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [selectedUsageId, setSelectedUsageId] = useState<string | null>(null);
  const [partFilter, setPartFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [pcssFilter, setPcssFilter] = useState("");

  const activeSelectedNodeId = selectedNodeId ?? orgNodesQuery.data?.[0]?.id;

  const enrichedUsages = useMemo(() => {
    return (usagesQuery.data ?? []).map((usage) => ({
      ...usage,
      partKey: partsQuery.data?.find((part) => part.id === usage.part_master_id)?.key ?? usage.part_master_id,
      orgNodeKey: orgNodesQuery.data?.find((node) => node.id === usage.org_node_id)?.key ?? usage.org_node_id,
    }));
  }, [orgNodesQuery.data, partsQuery.data, usagesQuery.data]);

  const filteredUsages = enrichedUsages.filter((usage) => {
    if (activeSelectedNodeId && usage.org_node_id !== activeSelectedNodeId) return false;
    if (partFilter && !usage.partKey.toLowerCase().includes(partFilter.toLowerCase())) return false;
    if (conditionFilter && !usage.variant_key.toLowerCase().includes(conditionFilter.toLowerCase())) return false;
    if (pcssFilter && !usage.pcss_expr.toLowerCase().includes(pcssFilter.toLowerCase())) return false;
    return true;
  });

  const selectedUsage = filteredUsages.find((usage) => usage.id === selectedUsageId) ?? null;

  if (productsQuery.isSuccess && !product) {
    return <RestrictedAccess />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Org tree</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgTreeView nodes={orgNodesQuery.data ?? []} selectedId={activeSelectedNodeId} onSelect={(node) => setSelectedNodeId(node.id)} />
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage filters</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Input placeholder="Part key" value={partFilter} onChange={(event) => setPartFilter(event.target.value)} />
            <Input placeholder="Condition contains" value={conditionFilter} onChange={(event) => setConditionFilter(event.target.value)} />
            <Input placeholder="PCSS contains" value={pcssFilter} onChange={(event) => setPcssFilter(event.target.value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage masters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredUsages.map((usage) => (
              <button
                key={usage.id}
                type="button"
                className="w-full rounded-lg border border-slate-200 p-4 text-left hover:border-slate-400"
                onClick={() => setSelectedUsageId(usage.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{usage.partKey}</p>
                    <p className="text-sm text-slate-500">Org node {usage.orgNodeKey}</p>
                  </div>
                  <Badge variant="secondary">{usage.variant_key}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">PCSS: {usage.pcss_expr}</p>
              </button>
            ))}
            {filteredUsages.length === 0 && <p className="text-sm text-slate-500">No usages match the current filters.</p>}
          </CardContent>
        </Card>
      </div>
      {selectedUsage && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-slate-200 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Usage detail</h2>
              <p className="text-sm text-slate-500">{selectedUsage.id}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setSelectedUsageId(null)}>Close</Button>
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p><strong>Part:</strong> {selectedUsage.partKey}</p>
            <p><strong>Org node:</strong> {selectedUsage.orgNodeKey}</p>
            <p><strong>Variant key:</strong> {selectedUsage.variant_key}</p>
            <p><strong>PCSS expression:</strong> {selectedUsage.pcss_expr}</p>
            <p className="rounded-lg bg-slate-50 p-3">Condition text is not directly listable via API; variant key is shown as the available branch/baseline proxy.</p>
          </div>
        </div>
      )}
    </div>
  );
}
