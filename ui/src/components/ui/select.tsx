import * as React from "react";

import { cn } from "@/lib/utils";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm", props.className)} {...props} />;
}
export const SelectTrigger = Select;
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}
export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function SelectItem(props: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return <option {...props} />;
}
