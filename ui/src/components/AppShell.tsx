"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useStoredUserId } from "@/lib/utils";

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/parts", label: "Parts" },
  { href: "/codes-and-rules", label: "Codes & rules" },
  { href: "/releases", label: "Releases" },
  { href: "/admin", label: "Admin" },
  { href: "/select-user", label: "Select user" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const userId = useStoredUserId();

  useEffect(() => {
    if (!userId && pathname !== "/select-user") {
      router.replace("/select-user");
    }
  }, [pathname, router, userId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <Link href="/products" className="text-lg font-semibold">
              piniPLM UI
            </Link>
            <p className="text-sm text-slate-500">FastAPI-backed PLM frontend</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm hover:bg-slate-100">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden md:inline">User: {userId ?? "none selected"}</span>
            <Button variant="outline" size="sm" onClick={() => router.push("/select-user")}>Switch user</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
