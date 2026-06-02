import * as React from "react";

import { cn } from "@/lib/utils";

export function Dialog({ open, children }: { open?: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return <>{children}</>;
}
export function DialogTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className={cn("w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl", className)}>{children}</div>
    </div>
  );
}
export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-500", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />;
}
