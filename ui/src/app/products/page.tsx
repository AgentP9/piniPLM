"use client";

import { ProductCard } from "@/components/ProductCard";
import { RestrictedAccess } from "@/components/RestrictedAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/lib/api/queries";
import { ForbiddenError } from "@/lib/api/client";

export default function ProductsPage() {
  const productsQuery = useProducts();

  if (productsQuery.error instanceof ForbiddenError) {
    return <RestrictedAccess />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Visible products are filtered by backend RBAC.</p>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(productsQuery.data ?? []).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
