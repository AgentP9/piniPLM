"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/lib/api/schemas";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.key}?branch=main`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>{product.key}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Open product workspace, resolve structure, browse usages, and review PCSS mappings.</p>
        </CardContent>
      </Card>
    </Link>
  );
}
