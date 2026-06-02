"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { BaselineBranchSelector } from "@/components/BaselineBranchSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/lib/api/queries";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ productKey: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productsQuery = useProducts();
  const product = (productsQuery.data ?? []).find((item) => item.key === params.productKey);

  const baseline = searchParams.get("baseline");
  const branch = searchParams.get("branch") ?? "main";

  const makeHref = (suffix = "") => {
    const paramsCopy = new URLSearchParams(searchParams.toString());
    if (!baseline && !paramsCopy.get("branch")) {
      paramsCopy.set("branch", "main");
    }
    const query = paramsCopy.toString();
    return `/products/${params.productKey}${suffix}${query ? `?${query}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{product?.name ?? params.productKey}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BaselineBranchSelector
            key={baseline ? `baseline:${baseline}` : `branch:${branch}`}
            baseline={baseline}
            branch={branch}
            onChange={({ mode, baseline: nextBaseline, branch: nextBranch }) => {
              const next = new URLSearchParams(searchParams.toString());
              if (mode === "baseline") {
                if (nextBaseline) next.set("baseline", nextBaseline);
                next.delete("branch");
              } else {
                next.delete("baseline");
                next.set("branch", nextBranch || "main");
              }
              router.push(`${pathname}?${next.toString()}`);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Link href={makeHref()} className="rounded-md bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">Summary</Link>
            <Link href={makeHref("/resolve")} className="rounded-md bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">Resolve</Link>
            <Link href={makeHref("/usages")} className="rounded-md bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">Usages</Link>
            <Link href={makeHref("/pcss")} className="rounded-md bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">PCSS</Link>
          </div>
        </CardContent>
      </Card>
      {children}
    </div>
  );
}
