"use client";

import { useParams, useSearchParams } from "next/navigation";

import { ResolveWorkspace } from "@/components/ResolveWorkspace";

export default function ProductResolvePage() {
  const params = useParams<{ productKey: string }>();
  const searchParams = useSearchParams();

  return (
    <ResolveWorkspace
      productKey={params.productKey}
      baseline={searchParams.get("baseline")}
      branch={searchParams.get("branch") ?? "main"}
    />
  );
}
