"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsers } from "@/lib/api/queries";
import { setStoredUserId, useStoredUserId } from "@/lib/utils";

const seededUsers = [
  { id: "11111111-1111-1111-1111-111111111111", label: "admin", description: "Global admin" },
  { id: "22222222-2222-2222-2222-222222222222", label: "user1", description: "VIEW on prodA/prodB" },
  { id: "33333333-3333-3333-3333-333333333333", label: "user2", description: "No access" },
];

export default function SelectUserPage() {
  const router = useRouter();
  const storedUserId = useStoredUserId();
  const [draftUserId, setDraftUserId] = useState<string | null>(null);
  const selectedUserId = draftUserId ?? storedUserId ?? seededUsers[1].id;

  const usersQuery = useUsers(Boolean(selectedUserId), selectedUserId || null);
  const currentUser = useMemo(
    () => (usersQuery.data ?? []).find((user) => user.id === selectedUserId),
    [selectedUserId, usersQuery.data],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Select dev user</CardTitle>
          <CardDescription>Pick a seeded user or paste a custom X-User-Id. The value is stored in localStorage as plm_user_id.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {seededUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className={`rounded-xl border p-4 text-left transition ${selectedUserId === user.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400"}`}
                onClick={() => setDraftUserId(user.id)}
              >
                <p className="font-semibold">{user.label}</p>
                <p className="mt-1 break-all text-xs opacity-80">{user.id}</p>
                <p className="mt-2 text-sm opacity-80">{user.description}</p>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-id">X-User-Id</Label>
            <Input id="user-id" value={selectedUserId} onChange={(event) => setDraftUserId(event.target.value)} placeholder="Paste user UUID" />
          </div>
          <Button
            type="button"
            onClick={() => {
              setStoredUserId(selectedUserId);
              router.push("/products");
            }}
          >
            Save and continue
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Current user info</CardTitle>
          <CardDescription>Loaded using the selected X-User-Id header.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>User ID:</strong> {selectedUserId || "Not set"}</p>
          {currentUser ? (
            <>
              <p><strong>Name:</strong> {currentUser.name}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Global admin:</strong> {currentUser.is_global_admin ? "Yes" : "No"}</p>
            </>
          ) : (
            <p className="text-slate-500">Save this user ID to use it across the app. If the backend is running, user details appear here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
