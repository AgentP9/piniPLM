"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { apiFetch } from "@/lib/api/client";
import {
  BaselineResponseSchema,
  CodesSchema,
  CommitResponseSchema,
  FlagClearancesSchema,
  GrantsSchema,
  OrgNodesSchema,
  PartsSchema,
  PcssSymbolsSchema,
  ProductPcssMastersSchema,
  ProductsSchema,
  ResolveResponseSchema,
  RuleMastersSchema,
  SecurityFlagsSchema,
  UsageMastersSchema,
  UserGroupsSchema,
  UsersSchema,
} from "@/lib/api/schemas";
import { getStoredUserId } from "@/lib/utils";

const okSchema = z.object({ ok: z.boolean() });

function userScopedKey(key: string, ...extra: Array<string | undefined | null>) {
  return [key, getStoredUserId(), ...extra];
}

export function useUsers(enabled = true, userId?: string | null) {
  return useQuery({
    queryKey: ["users", userId ?? getStoredUserId()],
    queryFn: () => apiFetch("/users", UsersSchema, { userId }),
    enabled,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: userScopedKey("products"),
    queryFn: () => apiFetch("/products", ProductsSchema),
  });
}

export function useParts() {
  return useQuery({
    queryKey: userScopedKey("parts"),
    queryFn: () => apiFetch("/parts", PartsSchema),
  });
}

export function useCodes() {
  return useQuery({
    queryKey: userScopedKey("codes"),
    queryFn: () => apiFetch("/codes", CodesSchema),
  });
}

export function usePcssSymbols() {
  return useQuery({
    queryKey: userScopedKey("pcss-symbols"),
    queryFn: () => apiFetch("/pcss-symbols", PcssSymbolsSchema),
  });
}

export function useOrgNodes() {
  return useQuery({
    queryKey: userScopedKey("org-nodes"),
    queryFn: () => apiFetch("/org-nodes", OrgNodesSchema),
  });
}

export function useUsageMasters(productId?: string) {
  return useQuery({
    queryKey: userScopedKey("usage-masters", productId),
    queryFn: () => apiFetch(`/usage-masters?product_id=${productId}`, UsageMastersSchema),
    enabled: Boolean(productId),
  });
}

export function useRuleMasters() {
  return useQuery({
    queryKey: userScopedKey("rule-masters"),
    queryFn: () => apiFetch("/rule-masters", RuleMastersSchema),
  });
}

export function useProductPcssMasters(productId?: string) {
  return useQuery({
    queryKey: userScopedKey("product-pcss-masters", productId),
    queryFn: () => apiFetch(`/product-pcss-masters?product_id=${productId}`, ProductPcssMastersSchema),
    enabled: Boolean(productId),
  });
}

export function useUserGroups() {
  return useQuery({
    queryKey: userScopedKey("user-groups"),
    queryFn: () => apiFetch("/user-groups", UserGroupsSchema),
  });
}

export function useGrants() {
  return useQuery({
    queryKey: userScopedKey("grants"),
    queryFn: () => apiFetch("/grants", GrantsSchema),
  });
}

export function useSecurityFlags() {
  return useQuery({
    queryKey: userScopedKey("security-flags"),
    queryFn: () => apiFetch("/security-flags", SecurityFlagsSchema),
  });
}

export function useFlagClearances() {
  return useQuery({
    queryKey: userScopedKey("flag-clearances"),
    queryFn: () => apiFetch("/flag-clearances", FlagClearancesSchema),
  });
}

export function useResolve(productKey: string) {
  return useMutation({
    mutationFn: (input: { baseline?: string | null; branch?: string | null; selectedCodes: string[] }) => {
      const params = new URLSearchParams();
      if (input.baseline) {
        params.set("baseline", input.baseline);
      }
      if (input.branch) {
        params.set("branch", input.branch);
      }
      const query = params.toString();
      return apiFetch(
        `/products/${productKey}/resolve${query ? `?${query}` : ""}`,
        ResolveResponseSchema,
        {
          method: "POST",
          body: { selectedCodes: input.selectedCodes },
        },
      );
    },
  });
}

export function useCreateCommit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/commits", CommitResponseSchema, { method: "POST", body }),
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}

export function useCreateBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/baselines", BaselineResponseSchema, { method: "POST", body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userScopedKey("products") });
    },
  });
}

export function useCreateGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/grants", CommitResponseSchema, { method: "POST", body }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userScopedKey("grants") }),
  });
}

export function useDeleteGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grantId: string) => apiFetch(`/grants/${grantId}`, okSchema, { method: "DELETE" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userScopedKey("grants") }),
  });
}

export function useCreateSecurityFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/security-flags", z.object({ key: z.string() }), { method: "POST", body }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userScopedKey("security-flags") }),
  });
}

export function useCreateFlagClearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/flag-clearances", CommitResponseSchema, { method: "POST", body }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userScopedKey("flag-clearances") }),
  });
}

export function useDeleteFlagClearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clearanceId: string) => apiFetch(`/flag-clearances/${clearanceId}`, okSchema, { method: "DELETE" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userScopedKey("flag-clearances") }),
  });
}
