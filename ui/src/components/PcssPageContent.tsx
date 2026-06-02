"use client";

import { useMemo, useState } from "react";

import { CommitForm } from "@/components/CommitForm";
import { RestrictedAccess } from "@/components/RestrictedAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGrants, usePcssSymbols, useProductPcssMasters, useProducts, useUsers } from "@/lib/api/queries";
import type { PcssSymbol, ProductPcssMaster } from "@/lib/api/schemas";
import { canEditRole, deriveProductRole } from "@/lib/permissions";
import { getStoredUserId } from "@/lib/utils";

export function PcssPageContent({
  productKey,
  baseline,
  branch,
  editableOverride,
  mastersOverride,
  symbolsOverride,
}: {
  productKey: string;
  baseline?: string | null;
  branch?: string | null;
  editableOverride?: boolean;
  mastersOverride?: ProductPcssMaster[];
  symbolsOverride?: PcssSymbol[];
}) {
  const [showCommitForm, setShowCommitForm] = useState(false);
  const productsQuery = useProducts();
  const usersQuery = useUsers();
  const grantsQuery = useGrants();
  const symbolsQuery = usePcssSymbols();
  const product = (productsQuery.data ?? []).find((item) => item.key === productKey);
  const mastersQuery = useProductPcssMasters(product?.id);

  const currentUser = useMemo(() => {
    const currentUserId = getStoredUserId();
    return (usersQuery.data ?? []).find((item) => item.id === currentUserId);
  }, [usersQuery.data]);

  const role = deriveProductRole({ currentUser, grants: grantsQuery.data, productId: product?.id });
  const canEdit = editableOverride ?? canEditRole(role);
  const isReadOnly = Boolean(baseline);
  const masters = mastersOverride ?? mastersQuery.data ?? [];
  const symbols = symbolsOverride ?? symbolsQuery.data ?? [];

  if (productsQuery.isSuccess && !product) {
    return <RestrictedAccess description="No product access for this PCSS workspace." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Product PCSS masters</CardTitle>
            <p className="mt-1 text-sm text-slate-500">{isReadOnly ? `Baseline ${baseline}` : `Branch ${branch ?? "main"}`}</p>
          </div>
          {canEdit ? (
            <Button type="button" onClick={() => setShowCommitForm((value) => !value)} disabled={isReadOnly}>
              Create commit
            </Button>
          ) : (
            <Badge variant="outline">View only</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {masters.map((master) => {
            const symbol = symbols.find((item) => item.key === master.pcss_key);
            return (
              <div key={master.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{master.pcss_key}</p>
                    <p className="text-sm text-slate-500">{symbol?.description || "No description"}</p>
                  </div>
                  <Badge variant="secondary">{master.id}</Badge>
                </div>
              </div>
            );
          })}
          {masters.length === 0 && <p className="text-sm text-slate-500">No product PCSS masters found.</p>}
        </CardContent>
      </Card>
      {showCommitForm && canEdit && (
        <CommitForm
          objectType="PRODUCT_PCSS"
          objectOptions={masters.map((master) => ({ value: master.id, label: `${master.pcss_key} (${master.id})` }))}
          branch={branch ?? "main"}
          disabled={isReadOnly}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">PCSS symbol catalog</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {symbols.map((symbol) => (
            <div key={symbol.key} className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium">{symbol.key}</p>
              <p className="text-sm text-slate-500">{symbol.description || "No description"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
