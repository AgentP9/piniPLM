"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResolveResponse } from "@/lib/api/schemas";

export function ValidationPanel({ messages }: { messages: ResolveResponse["validationMessages"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4" /> Validation messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">No validation issues were reported.</p>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.message}-${index}`} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
              <div className="space-y-1">
                <Badge variant={message.severity === "ERROR" ? "destructive" : "warning"}>{message.severity}</Badge>
                <p className="text-sm text-slate-700">{message.message}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
