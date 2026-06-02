import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "piniPLM UI",
  description: "Next.js PLM frontend for the FastAPI backend",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
