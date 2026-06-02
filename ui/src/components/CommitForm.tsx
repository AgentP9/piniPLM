"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { MatrixEditor } from "@/components/MatrixEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCommit } from "@/lib/api/queries";
import { createIdentityMatrix } from "@/lib/utils";

const schema = z.object({
  objectType: z.enum(["PRODUCT", "PART", "USAGE", "CODE", "RULE", "PRODUCT_PCSS"]),
  objectMasterId: z.string().min(1),
  branch: z.string().min(1),
  message: z.string().min(3),
  parentCommitId: z.string().optional(),
  mergeParentId: z.string().optional(),
  conditionExpr: z.string().optional(),
  flags: z.string().optional(),
  payloadJson: z.string().optional(),
});

type CommitFormValues = z.infer<typeof schema>;

export function CommitForm({
  objectType = "PRODUCT_PCSS",
  objectOptions,
  branch = "main",
  disabled = false,
}: {
  objectType?: CommitFormValues["objectType"];
  objectOptions: Array<{ value: string; label: string }>;
  branch?: string;
  disabled?: boolean;
}) {
  const createCommit = useCreateCommit();
  const [matrix, setMatrix] = useState(createIdentityMatrix());
  const form = useForm<CommitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      objectType,
      objectMasterId: objectOptions[0]?.value ?? "",
      branch,
      message: "",
      parentCommitId: "",
      mergeParentId: "",
      conditionExpr: "",
      flags: "",
      payloadJson: "",
    },
  });
  const watchedObjectType = useWatch({ control: form.control, name: "objectType" });

  const payloadPreview = useMemo(() => {
    const values = form.getValues();
    const flags = values.flags?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
    const basePayload: Record<string, unknown> = flags.length ? { flags } : {};
    if (values.objectType === "PRODUCT_PCSS") {
      return { ...basePayload, transform_4x4: matrix };
    }
    if (values.objectType === "USAGE") {
      return { ...basePayload, position_4x4: matrix, condition_expr: values.conditionExpr || null };
    }
    if (values.payloadJson) {
      try {
        return { ...basePayload, ...JSON.parse(values.payloadJson) };
      } catch {
        return { ...basePayload, invalid_json: true };
      }
    }
    return basePayload;
  }, [form, matrix]);

  const onSubmit = form.handleSubmit(async (values) => {
    await createCommit.mutateAsync({
      objectType: values.objectType,
      objectMasterId: values.objectMasterId,
      branch: values.branch,
      message: values.message,
      parentCommitId: values.parentCommitId || undefined,
      mergeParentId: values.mergeParentId || undefined,
      payload: payloadPreview,
    });
    form.reset({ ...values, message: "", payloadJson: "", parentCommitId: "", mergeParentId: "" });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create commit</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="object-master-id">Object</Label>
              <select
                id="object-master-id"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                {...form.register("objectMasterId")}
                disabled={disabled}
              >
                {objectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input id="branch" {...form.register("branch")} disabled={disabled} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Input id="message" {...form.register("message")} disabled={disabled} />
          </div>
          {watchedObjectType === "USAGE" && (
            <div className="space-y-2">
              <Label htmlFor="conditionExpr">Condition expression</Label>
              <Input id="conditionExpr" {...form.register("conditionExpr")} disabled={disabled} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="flags">Flags (comma separated)</Label>
            <Input id="flags" {...form.register("flags")} disabled={disabled} />
          </div>
          {["PRODUCT_PCSS", "USAGE"].includes(watchedObjectType ?? "") ? (
            <MatrixEditor value={matrix} onChange={setMatrix} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="payloadJson">Payload JSON</Label>
              <Textarea id="payloadJson" {...form.register("payloadJson")} disabled={disabled} />
            </div>
          )}
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <strong>Payload preview:</strong>
            <pre className="mt-2 overflow-auto">{JSON.stringify(payloadPreview, null, 2)}</pre>
          </div>
          <Button type="submit" disabled={disabled || createCommit.isPending}>
            {createCommit.isPending ? "Creating..." : "Create commit"}
          </Button>
          {createCommit.isSuccess && <p className="text-sm text-emerald-600">Commit created successfully.</p>}
          {createCommit.error && <p className="text-sm text-red-600">{createCommit.error.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
