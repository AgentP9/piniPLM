"use client";

import { useParams, useSearchParams } from "next/navigation";

import { RestrictedAccess } from "@/components/RestrictedAccess";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductPcssMasters, useProducts, useUsageMasters } from "@/lib/api/queries";

export default function ProductSummaryPage() {
  const params = useParams<{ productKey: string }>();
  const searchParams = useSearchParams();
  const productsQuery = useProducts();
  const product = (productsQuery.data ?? []).find((item) => item.key === params.productKey);
  const usageQuery = useUsageMasters(product?.id);
  const pcssQuery = useProductPcssMasters(product?.id);
  const baseline = searchParams.get("baseline");
  const branch = searchParams.get("branch") ?? "main";

  if (productsQuery.isSuccess && !product) {
    return <RestrictedAccess />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active state</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p><strong>Product:</strong> {product?.name ?? params.productKey}</p>
          <p><strong>Mode:</strong> {baseline ? "Release / baseline" : "Preview / branch"}</p>
          <p><strong>Baseline:</strong> {baseline ?? "—"}</p>
          <p><strong>Branch:</strong> {baseline ? "Read only" : branch}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Usage masters</span>
            <Badge variant="secondary">{usageQuery.data?.length ?? 0}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Product PCSS masters</span>
            <Badge variant="secondary">{pcssQuery.data?.length ?? 0}</Badge>
          </div>
          <p className="pt-2">Use the quick links above to resolve a structure, browse usages, or create commits on branch mode.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Baselines are immutable snapshots addressed by name.</p>
          <p>Branches stay editable when your role is EDIT or higher.</p>
          <p>Resolve results show final transforms and rule validations for selected codes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
