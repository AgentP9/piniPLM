"use client";

import { useParams, useSearchParams } from "next/navigation";

import { PcssPageContent } from "@/components/PcssPageContent";

export default function ProductPcssPage() {
  const params = useParams<{ productKey: string }>();
  const searchParams = useSearchParams();

  return (
    <PcssPageContent
      productKey={params.productKey}
      baseline={searchParams.get("baseline")}
      branch={searchParams.get("branch") ?? "main"}
    />
  );
}
