"use client";

import { Lock } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RestrictedAccess({
  title = "No product access",
  description = "Your current user does not have permission to view this resource.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Card className="max-w-lg border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Lock className="h-5 w-5" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Try switching to a different dev user from the user selector page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
