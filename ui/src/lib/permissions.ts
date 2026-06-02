import type { Grant, User } from "@/lib/api/schemas";

const ROLE_LEVEL: Record<Grant["role"], number> = {
  VIEW: 1,
  EDIT: 2,
  RELEASE: 3,
  ADMIN: 4,
};

export function deriveProductRole({
  currentUser,
  grants,
  productId,
}: {
  currentUser?: User;
  grants?: Grant[];
  productId?: string;
}) {
  if (!currentUser || !productId) {
    return null;
  }
  if (currentUser.is_global_admin) {
    return "ADMIN" as const;
  }
  let best: Grant["role"] | null = null;
  for (const grant of grants ?? []) {
    if (grant.grantee_type !== "USER" || grant.grantee_id !== currentUser.id) continue;
    if (grant.target_type !== "PRODUCT" || grant.target_id !== productId) continue;
    if (!best || ROLE_LEVEL[grant.role] > ROLE_LEVEL[best]) {
      best = grant.role;
    }
  }
  return best;
}

export function canEditRole(role: Grant["role"] | null) {
  return role ? ROLE_LEVEL[role] >= ROLE_LEVEL.EDIT : false;
}

export function canReleaseRole(role: Grant["role"] | null) {
  return role ? ROLE_LEVEL[role] >= ROLE_LEVEL.RELEASE : false;
}
