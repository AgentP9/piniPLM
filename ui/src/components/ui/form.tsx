import * as React from "react";
import { Controller, FormProvider, useFormContext, type ControllerProps, type FieldPath, type FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";

const Form = FormProvider;

function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(props: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}

function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}

function FormControl({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-500", className)} {...props} />;
}

function FormMessage() {
  const { formState } = useFormContext();
  const messages = Object.values(formState.errors).map((error) => error?.message).filter(Boolean);
  if (!messages.length) return null;
  return <p className="text-sm text-red-600">{String(messages[0])}</p>;
}

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage };
