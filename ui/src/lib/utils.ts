import { useSyncExternalStore } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ResolveUsage } from "@/lib/api/schemas";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STORAGE_KEY = "plm_user_id";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function getStoredUserId() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEY);
}

function emitUserIdChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("plm-user-id-change"));
  }
}

export function setStoredUserId(userId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, userId);
    emitUserIdChange();
  }
}

export function clearStoredUserId() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    emitUserIdChange();
  }
}

function subscribeToUserId(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener("plm-user-id-change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("plm-user-id-change", handler);
  };
}

export function useStoredUserId() {
  return useSyncExternalStore(subscribeToUserId, getStoredUserId, () => null);
}

export function parseMatrixString(value: string) {
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));

  if (parts.length !== 16) {
    return null;
  }

  return parts;
}

export function formatMatrix(matrix: number[]) {
  return matrix.join(" ");
}

export function createIdentityMatrix() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

export function groupUsagesByOrg(usages: ResolveUsage[]) {
  return usages.reduce<Record<string, ResolveUsage[]>>((acc, usage) => {
    if (!acc[usage.orgNodeKey]) {
      acc[usage.orgNodeKey] = [];
    }
    acc[usage.orgNodeKey].push(usage);
    return acc;
  }, {});
}

export function getModeFromSearch(searchParams: URLSearchParams) {
  return searchParams.get("baseline") ? "baseline" : "branch";
}

export function upsertSearchParam(
  current: URLSearchParams,
  name: string,
  value: string | null,
) {
  const params = new URLSearchParams(current.toString());
  if (value && value.trim()) {
    params.set(name, value.trim());
  } else {
    params.delete(name);
  }
  return params;
}
