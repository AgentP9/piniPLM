"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBaseline, useProducts } from "@/lib/api/queries";

const schema = z.object({
  name: z.string().min(1),
  fromBranch: z.string().min(1),
  description: z.string().optional(),
  productKeys: z.array(z.string()).min(1),
});

type FormValues = z.infer<typeof schema>;

export default function ReleasesPage() {
  const productsQuery = useProducts();
  const createBaseline = useCreateBaseline();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      fromBranch: "main",
      description: "",
      productKeys: [],
    },
  });
  const selectedProductKeys = useWatch({ control: form.control, name: "productKeys" }) ?? [];

  const onSubmit = form.handleSubmit(async (values) => {
    await createBaseline.mutateAsync(values);
    form.reset({ name: "", fromBranch: values.fromBranch, description: "", productKeys: [] });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create baseline</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="baseline-name">Name</Label>
              <Input id="baseline-name" {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-branch">From branch</Label>
              <Input id="from-branch" {...form.register("fromBranch")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label>Product keys</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {(productsQuery.data ?? []).map((product) => (
                <label key={product.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedProductKeys.includes(product.key)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selectedProductKeys, product.key]
                        : selectedProductKeys.filter((item) => item !== product.key);
                      form.setValue("productKeys", next, { shouldValidate: true });
                    }}
                  />
                  <span>{product.name} ({product.key})</span>
                </label>
              ))}
            </div>
          </div>
          {form.formState.errors.productKeys && <p className="text-sm text-red-600">Select at least one product.</p>}
          <Button type="submit" disabled={createBaseline.isPending}>{createBaseline.isPending ? "Creating..." : "Create baseline"}</Button>
          {createBaseline.isSuccess && <p className="text-sm text-emerald-600">Baseline created successfully.</p>}
          {createBaseline.error && <p className="text-sm text-red-600">{createBaseline.error.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
