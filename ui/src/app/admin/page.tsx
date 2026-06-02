"use client";

import { useMemo, useState } from "react";

import { RestrictedAccess } from "@/components/RestrictedAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateFlagClearance,
  useCreateGrant,
  useCreateSecurityFlag,
  useDeleteFlagClearance,
  useDeleteGrant,
  useFlagClearances,
  useGrants,
  useProducts,
  useSecurityFlags,
  useUserGroups,
  useUsers,
} from "@/lib/api/queries";
import { getStoredUserId } from "@/lib/utils";

export default function AdminPage() {
  const usersQuery = useUsers();
  const userGroupsQuery = useUserGroups();
  const productsQuery = useProducts();
  const grantsQuery = useGrants();
  const flagsQuery = useSecurityFlags();
  const clearancesQuery = useFlagClearances();
  const createGrant = useCreateGrant();
  const deleteGrant = useDeleteGrant();
  const createFlag = useCreateSecurityFlag();
  const createClearance = useCreateFlagClearance();
  const deleteClearance = useDeleteFlagClearance();

  const currentUser = useMemo(() => (usersQuery.data ?? []).find((user) => user.id === getStoredUserId()), [usersQuery.data]);
  const [grantForm, setGrantForm] = useState({ grantee_id: "", target_id: "", role: "VIEW" });
  const [flagForm, setFlagForm] = useState({ key: "", name: "", description: "" });
  const [clearanceForm, setClearanceForm] = useState({ grantee_id: "", flag_key: "" });

  if (usersQuery.isSuccess && !currentUser?.is_global_admin) {
    return <RestrictedAccess title="Admin only" description="Only global admins can access the administration workspace." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(usersQuery.data ?? []).map((user) => (
              <div key={user.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                {user.is_global_admin && <Badge className="mt-2">Global admin</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(userGroupsQuery.data ?? []).map((group) => (
              <div key={group.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium">{group.name}</p>
                <p className="text-slate-500">{group.key}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Grants management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={grantForm.grantee_id} onChange={(e) => setGrantForm((v) => ({ ...v, grantee_id: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Product ID</Label>
                <Input value={grantForm.target_id} onChange={(e) => setGrantForm((v) => ({ ...v, target_id: e.target.value }))} placeholder={productsQuery.data?.[0]?.id ?? "product id"} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={grantForm.role} onChange={(e) => setGrantForm((v) => ({ ...v, role: e.target.value }))}>
                  <option>VIEW</option><option>EDIT</option><option>RELEASE</option><option>ADMIN</option>
                </select>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => createGrant.mutate({ grantee_type: "USER", grantee_id: grantForm.grantee_id, target_type: "PRODUCT", target_id: grantForm.target_id, role: grantForm.role })}
            >
              Add grant
            </Button>
            <div className="space-y-2">
              {(grantsQuery.data ?? []).map((grant) => (
                <div key={grant.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                  <div>
                    <p className="font-medium">{grant.role} • {grant.grantee_type}:{grant.grantee_id}</p>
                    <p className="text-slate-500">{grant.target_type}:{grant.target_id}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => deleteGrant.mutate(grant.id)}>Delete</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security flags + clearances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Flag key</Label>
                <Input value={flagForm.key} onChange={(e) => setFlagForm((v) => ({ ...v, key: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Flag name</Label>
                <Input value={flagForm.name} onChange={(e) => setFlagForm((v) => ({ ...v, name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={flagForm.description} onChange={(e) => setFlagForm((v) => ({ ...v, description: e.target.value }))} />
            </div>
            <Button type="button" onClick={() => createFlag.mutate(flagForm)}>Create flag</Button>
            <div className="space-y-2">
              {(flagsQuery.data ?? []).map((flag) => (
                <div key={flag.key} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-medium">{flag.key}</p>
                  <p className="text-slate-500">{flag.description || flag.name}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Clearance user ID</Label>
                <Input value={clearanceForm.grantee_id} onChange={(e) => setClearanceForm((v) => ({ ...v, grantee_id: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Flag key</Label>
                <Input value={clearanceForm.flag_key} onChange={(e) => setClearanceForm((v) => ({ ...v, flag_key: e.target.value }))} />
              </div>
            </div>
            <Button type="button" onClick={() => createClearance.mutate({ grantee_type: "USER", grantee_id: clearanceForm.grantee_id, flag_key: clearanceForm.flag_key })}>Grant clearance</Button>
            <div className="space-y-2">
              {(clearancesQuery.data ?? []).map((clearance) => (
                <div key={clearance.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                  <div>
                    <p className="font-medium">{clearance.flag_key}</p>
                    <p className="text-slate-500">{clearance.grantee_type}:{clearance.grantee_id}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => deleteClearance.mutate(clearance.id)}>Delete</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
