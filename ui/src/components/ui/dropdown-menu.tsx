import * as React from "react";

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function DropdownMenuContent({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-slate-200 bg-white p-1 shadow-lg">{children}</div>;
}
export function DropdownMenuItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-slate-100" onClick={onClick}>
      {children}
    </button>
  );
}
