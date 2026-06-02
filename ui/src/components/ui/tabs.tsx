import * as React from "react";

import { cn } from "@/lib/utils";

export function Tabs({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("inline-flex rounded-md bg-slate-100 p-1", className)}>{children}</div>;
}
export function TabsTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn("rounded px-3 py-1.5 text-sm", className)} {...props}>{children}</button>;
}
export function TabsContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
