import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  is_global_admin: z.boolean(),
});
export const UsersSchema = z.array(UserSchema);
export type User = z.infer<typeof UserSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
});
export const ProductsSchema = z.array(ProductSchema);
export type Product = z.infer<typeof ProductSchema>;

export const PartSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
});
export const PartsSchema = z.array(PartSchema);
export type Part = z.infer<typeof PartSchema>;

export const CodeSchema = z.object({ key: z.string() });
export const CodesSchema = z.array(CodeSchema);
export type Code = z.infer<typeof CodeSchema>;

export const PcssSymbolSchema = z.object({
  key: z.string(),
  description: z.string().nullable().optional().transform((value) => value ?? ""),
});
export const PcssSymbolsSchema = z.array(PcssSymbolSchema);
export type PcssSymbol = z.infer<typeof PcssSymbolSchema>;

export const OrgNodeSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  parent_id: z.string().nullable(),
});
export const OrgNodesSchema = z.array(OrgNodeSchema);
export type OrgNode = z.infer<typeof OrgNodeSchema>;

export const UsageMasterSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  org_node_id: z.string(),
  part_master_id: z.string(),
  pcss_expr: z.string(),
  variant_key: z.string(),
});
export const UsageMastersSchema = z.array(UsageMasterSchema);
export type UsageMaster = z.infer<typeof UsageMasterSchema>;

export const RuleMasterSchema = z.object({
  id: z.string(),
  scope_type: z.enum(["GLOBAL", "PRODUCT"]),
  product_id: z.string().nullable(),
  rule_type: z.enum(["PROHIBIT", "DERIVE", "PACKAGE", "ALLOWLIST"]),
});
export const RuleMastersSchema = z.array(RuleMasterSchema);
export type RuleMaster = z.infer<typeof RuleMasterSchema>;

export const ProductPcssMasterSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  pcss_key: z.string(),
});
export const ProductPcssMastersSchema = z.array(ProductPcssMasterSchema);
export type ProductPcssMaster = z.infer<typeof ProductPcssMasterSchema>;

export const UserGroupSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
});
export const UserGroupsSchema = z.array(UserGroupSchema);
export type UserGroup = z.infer<typeof UserGroupSchema>;

export const GrantSchema = z.object({
  id: z.string(),
  grantee_type: z.enum(["USER", "USER_GROUP"]),
  grantee_id: z.string(),
  target_type: z.enum(["PRODUCT", "PRODUCT_GROUP"]),
  target_id: z.string(),
  role: z.enum(["VIEW", "EDIT", "RELEASE", "ADMIN"]),
  created_by: z.string(),
  created_at: z.string().optional(),
});
export const GrantsSchema = z.array(GrantSchema);
export type Grant = z.infer<typeof GrantSchema>;

export const SecurityFlagSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().nullable().optional().transform((value) => value ?? ""),
});
export const SecurityFlagsSchema = z.array(SecurityFlagSchema);
export type SecurityFlag = z.infer<typeof SecurityFlagSchema>;

export const FlagClearanceSchema = z.object({
  id: z.string(),
  grantee_type: z.enum(["USER", "USER_GROUP"]),
  grantee_id: z.string(),
  flag_key: z.string(),
  created_by: z.string(),
  created_at: z.string().optional(),
});
export const FlagClearancesSchema = z.array(FlagClearanceSchema);
export type FlagClearance = z.infer<typeof FlagClearanceSchema>;

export const ValidationMessageSchema = z.object({
  severity: z.enum(["ERROR", "WARN"]),
  message: z.string(),
});
export const ResolveUsageSchema = z.object({
  usageMasterId: z.string(),
  partKey: z.string(),
  orgNodeKey: z.string(),
  conditionExpr: z.string().nullable(),
  pcssExpr: z.string(),
  finalTransform4x4: z.array(z.number()).length(16),
});
export const ResolveResponseSchema = z.object({
  productKey: z.string(),
  baseline: z.string().nullable(),
  branch: z.string().nullable(),
  resolvedCodes: z.array(z.string()),
  validationMessages: z.array(ValidationMessageSchema),
  usages: z.array(ResolveUsageSchema),
});
export type ResolveUsage = z.infer<typeof ResolveUsageSchema>;
export type ResolveResponse = z.infer<typeof ResolveResponseSchema>;

export const CommitResponseSchema = z.object({ id: z.string() });
export const BaselineResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  immutable: z.boolean(),
});
