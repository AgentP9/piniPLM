import uuid
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy import and_, delete, or_, select
from sqlalchemy.orm import Session

from app.condition import eval_expr, parse_expr, variant_key
from app.database import Base, SessionLocal, engine, get_db
from app.models import (
    AppUser,
    Baseline,
    BaselineItem,
    CodeMaster,
    Commit,
    FlagClearance,
    Grant,
    ObjectBranchHead,
    OrgNode,
    PartMaster,
    PcssSymbol,
    ProductGroup,
    ProductGroupItem,
    ProductMaster,
    ProductPcssMaster,
    RuleMaster,
    SecurityFlag,
    UsageMaster,
    UserGroup,
    UserGroupMember,
)

ROLE_LEVEL = {"VIEW": 1, "EDIT": 2, "RELEASE": 3, "ADMIN": 4}


class UserCreate(BaseModel):
    name: str
    email: str
    is_global_admin: bool = False


class GroupCreate(BaseModel):
    key: str
    name: str


class GroupMemberCreate(BaseModel):
    user_id: str


class ProductCreate(BaseModel):
    key: str
    name: str


class PartCreate(BaseModel):
    key: str
    name: str


class OrgNodeCreate(BaseModel):
    key: str
    name: str
    parent_id: str | None = None


class CodeCreate(BaseModel):
    key: str


class PcssCreate(BaseModel):
    key: str
    description: str | None = None


class RuleMasterCreate(BaseModel):
    scope_type: Literal["GLOBAL", "PRODUCT"]
    product_id: str | None = None
    rule_type: Literal["PROHIBIT", "DERIVE", "PACKAGE", "ALLOWLIST"]


class UsageMasterCreate(BaseModel):
    product_id: str
    org_node_id: str
    part_master_id: str
    pcss_expr: str
    condition_expr: str | None = None


class ProductPcssMasterCreate(BaseModel):
    product_id: str
    pcss_key: str


class GrantCreate(BaseModel):
    grantee_type: Literal["USER", "USER_GROUP"]
    grantee_id: str
    target_type: Literal["PRODUCT", "PRODUCT_GROUP"]
    target_id: str
    role: Literal["VIEW", "EDIT", "RELEASE", "ADMIN"]


class SecurityFlagCreate(BaseModel):
    key: str
    name: str
    description: str | None = None


class FlagClearanceCreate(BaseModel):
    grantee_type: Literal["USER", "USER_GROUP"]
    grantee_id: str
    flag_key: str


class CommitCreate(BaseModel):
    objectType: Literal["PRODUCT", "PART", "USAGE", "CODE", "RULE", "PRODUCT_PCSS"]
    objectMasterId: str
    branch: str
    message: str
    parentCommitId: str | None = None
    mergeParentId: str | None = None
    payload: dict[str, Any]


class BaselineCreate(BaseModel):
    name: str
    fromBranch: str
    productKeys: list[str]
    description: str | None = None


class ResolveRequest(BaseModel):
    selectedCodes: list[str] = Field(default_factory=list)


class Msg(BaseModel):
    severity: Literal["ERROR", "WARN"]
    message: str


app = FastAPI(title="nextPLM MVP", version="0.1.0")


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def structure_ui():
    return """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>nextPLM Structure Explorer</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: Inter, system-ui, -apple-system, sans-serif; margin: 0; background: #0b1020; color: #e7ecff; }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 24px; }
    h1 { margin: 0 0 16px; font-size: 1.6rem; }
    .panel { background: #111a33; border: 1px solid #2a3a66; border-radius: 14px; padding: 16px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    label { font-size: 0.88rem; color: #a6b3d9; display: block; margin-bottom: 6px; }
    input, select, button { width: 100%; box-sizing: border-box; border-radius: 10px; border: 1px solid #2f4278; background: #0d1630; color: #f3f6ff; padding: 10px; }
    select[multiple] { min-height: 140px; }
    button { cursor: pointer; background: linear-gradient(90deg, #3965ff, #5f85ff); border: 0; font-weight: 600; }
    button:hover { filter: brightness(1.08); }
    .actions { display: flex; gap: 12px; margin-top: 12px; }
    .actions button { width: auto; padding: 10px 16px; }
    .muted { color: #9ba8d1; font-size: 0.9rem; margin-top: 8px; }
    .result-card { border: 1px solid #2a3a66; border-radius: 12px; padding: 12px; margin-bottom: 12px; background: #0e1730; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; border-bottom: 1px solid #2a3a66; padding: 8px; font-size: 0.9rem; vertical-align: top; }
    .error { color: #ff9aa7; }
    code { background: #131f3e; border-radius: 6px; padding: 2px 6px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>nextPLM Structure Explorer</h1>
    <div class="panel">
      <div class="grid">
        <div>
          <label for="userId">X-User-Id</label>
          <input id="userId" value="22222222-2222-2222-2222-222222222222" />
        </div>
        <div>
          <label for="branch">Branch</label>
          <input id="branch" value="main" />
        </div>
        <div>
          <label for="baseline">Baseline (optional)</label>
          <input id="baseline" placeholder="R2026.01" />
        </div>
      </div>
      <div class="grid" style="margin-top:12px;">
        <div>
          <label for="productSelect">Products (multi-select)</label>
          <select id="productSelect" multiple></select>
        </div>
        <div>
          <label for="codeSelect">Codes (multi-select)</label>
          <select id="codeSelect" multiple></select>
        </div>
      </div>
      <div class="actions">
        <button id="loadBtn" type="button">Load products &amp; codes</button>
        <button id="resolveBtn" type="button">Resolve structure</button>
      </div>
      <div class="muted">Select one or more products and codes to configure and compare structure results across products.</div>
    </div>
    <div id="status" class="muted"></div>
    <div id="results"></div>
  </div>
<script>
const byId = (id) => document.getElementById(id);
const selectedValues = (id) => Array.from(byId(id).selectedOptions).map(o => o.value);
const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

function authHeaders() {
  return {"X-User-Id": byId("userId").value.trim()};
}

async function loadSelectors() {
  const status = byId("status");
  status.textContent = "Loading products and codes...";
  const [productsRes, codesRes] = await Promise.all([
    fetch("/products", {headers: authHeaders()}),
    fetch("/codes", {headers: authHeaders()})
  ]);
  if (!productsRes.ok || !codesRes.ok) {
    status.innerHTML = `<span class="error">Failed to load selectors (${productsRes.status}/${codesRes.status}). Check X-User-Id.</span>`;
    return;
  }
  const products = await productsRes.json();
  const codes = await codesRes.json();
  byId("productSelect").innerHTML = products.map(p => `<option value="${esc(p.key)}">${esc(p.key)} — ${esc(p.name)}</option>`).join("");
  byId("codeSelect").innerHTML = codes.map(c => `<option value="${esc(c.key)}">${esc(c.key)}</option>`).join("");
  status.textContent = `Loaded ${products.length} products and ${codes.length} codes.`;
}

async function resolveAll() {
  const productKeys = selectedValues("productSelect");
  const selectedCodes = selectedValues("codeSelect");
  const branch = byId("branch").value.trim();
  const baseline = byId("baseline").value.trim();
  const status = byId("status");
  const results = byId("results");

  if (!productKeys.length) {
    status.innerHTML = '<span class="error">Select at least one product.</span>';
    return;
  }
  if (!baseline && !branch) {
    status.innerHTML = '<span class="error">Provide branch or baseline.</span>';
    return;
  }

  status.textContent = "Resolving...";
  results.innerHTML = "";

  const responses = await Promise.all(productKeys.map(async (productKey) => {
    const query = baseline ? `baseline=${encodeURIComponent(baseline)}` : `branch=${encodeURIComponent(branch)}`;
    const r = await fetch(`/products/${encodeURIComponent(productKey)}/resolve?${query}`, {
      method: "POST",
      headers: {...authHeaders(), "Content-Type": "application/json"},
      body: JSON.stringify({selectedCodes})
    });
    const body = await r.json().catch(() => ({}));
    return {productKey, ok: r.ok, status: r.status, body};
  }));

  for (const item of responses) {
    const card = document.createElement("div");
    card.className = "result-card";
    if (!item.ok) {
      card.innerHTML = `<h3>${esc(item.productKey)}</h3><div class="error">HTTP ${item.status}: ${esc(item.body.detail || "Request failed")}</div>`;
      results.appendChild(card);
      continue;
    }
    const usages = item.body.usages || [];
    const rows = usages.map(u => `<tr><td>${esc(u.orgNodeKey)}</td><td>${esc(u.partKey)}</td><td><code>${esc(u.conditionExpr || "")}</code></td><td><code>${esc(u.pcssExpr)}</code></td></tr>`).join("");
    card.innerHTML = `
      <h3>${esc(item.body.productKey)}</h3>
      <div>Resolved codes: <code>${esc((item.body.resolvedCodes || []).join(", "))}</code></div>
      <div>Usages: ${usages.length}</div>
      <table>
        <thead><tr><th>Org node</th><th>Part</th><th>Condition</th><th>PCSS</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">No visible usages</td></tr>'}</tbody>
      </table>
    `;
    results.appendChild(card);
  }
  status.textContent = `Resolved ${responses.length} product(s).`;
}

byId("loadBtn").addEventListener("click", loadSelectors);
byId("resolveBtn").addEventListener("click", resolveAll);
loadSelectors();
</script>
</body>
</html>
"""


def now():
    return datetime.now(timezone.utc)


def get_current_user(x_user_id: str | None = Header(None), db: Session = Depends(get_db)) -> AppUser:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    user = db.get(AppUser, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Unknown user")
    return user


def user_group_ids(db: Session, user_id: str) -> set[str]:
    rows = db.execute(select(UserGroupMember.group_id).where(UserGroupMember.user_id == user_id)).all()
    return {r[0] for r in rows}


def get_effective_product_role(db: Session, user_id: str, product_id: str) -> str | None:
    gids = user_group_ids(db, user_id)
    group_product_ids = db.execute(
        select(ProductGroupItem.product_group_id).where(ProductGroupItem.product_id == product_id)
    ).all()
    pgids = {r[0] for r in group_product_ids}

    grants = db.execute(
        select(Grant).where(
            or_(
                and_(Grant.grantee_type == "USER", Grant.grantee_id == user_id),
                and_(Grant.grantee_type == "USER_GROUP", Grant.grantee_id.in_(gids if gids else ["___none___"])),
            )
        )
    ).scalars().all()

    best = 0
    best_role = None
    for g in grants:
        match = False
        if g.target_type == "PRODUCT" and g.target_id == product_id:
            match = True
        if g.target_type == "PRODUCT_GROUP" and g.target_id in pgids:
            match = True
        if match and ROLE_LEVEL[g.role] > best:
            best = ROLE_LEVEL[g.role]
            best_role = g.role
    return best_role


def require_product_role(db: Session, user: AppUser, product_id: str, min_role: str):
    if user.is_global_admin:
        return
    role = get_effective_product_role(db, user.id, product_id)
    if role is None or ROLE_LEVEL[role] < ROLE_LEVEL[min_role]:
        raise HTTPException(status_code=403, detail="Forbidden")


def get_effective_flag_clearance(db: Session, user_id: str) -> set[str]:
    gids = user_group_ids(db, user_id)
    rows = db.execute(
        select(FlagClearance.flag_key).where(
            or_(
                and_(FlagClearance.grantee_type == "USER", FlagClearance.grantee_id == user_id),
                and_(
                    FlagClearance.grantee_type == "USER_GROUP",
                    FlagClearance.grantee_id.in_(gids if gids else ["___none___"]),
                ),
            )
        )
    ).all()
    return {r[0] for r in rows}


def is_commit_visible_to_user(flags: list[str] | None, clearance: set[str]) -> bool:
    return set(flags or []).issubset(clearance)


def get_selected_commit(db: Session, object_type: str, object_master_id: str, baseline: str | None, branch: str | None):
    if baseline:
        b = db.execute(select(Baseline).where(Baseline.name == baseline)).scalar_one_or_none()
        if not b:
            return None
        bi = db.execute(
            select(BaselineItem).where(
                BaselineItem.baseline_id == b.id,
                BaselineItem.object_type == object_type,
                BaselineItem.object_master_id == str(object_master_id),
            )
        ).scalar_one_or_none()
        if not bi:
            return None
        return db.get(Commit, bi.commit_id)
    if branch:
        h = db.execute(
            select(ObjectBranchHead).where(
                ObjectBranchHead.object_type == object_type,
                ObjectBranchHead.object_master_id == str(object_master_id),
                ObjectBranchHead.branch_name == branch,
            )
        ).scalar_one_or_none()
        if not h:
            return None
        return db.get(Commit, h.commit_id)
    return None


def mat_mul(a: list[float], b: list[float]) -> list[float]:
    out = [0.0] * 16
    for i in range(4):
        for j in range(4):
            out[i * 4 + j] = sum(a[i * 4 + k] * b[k * 4 + j] for k in range(4))
    return out


def require_global_admin(user: AppUser):
    if not user.is_global_admin:
        raise HTTPException(status_code=403, detail="Global admin required")


def product_for_object(db: Session, object_type: str, object_master_id: str) -> str | None:
    if object_type == "PRODUCT":
        p = db.get(ProductMaster, object_master_id)
        return p.id if p else None
    if object_type == "USAGE":
        u = db.get(UsageMaster, object_master_id)
        return u.product_id if u else None
    if object_type == "PRODUCT_PCSS":
        m = db.get(ProductPcssMaster, object_master_id)
        return m.product_id if m else None
    if object_type == "RULE":
        r = db.get(RuleMaster, object_master_id)
        return r.product_id if (r and r.scope_type == "PRODUCT") else None
    return None


def enforce_flag_mutation_rule(db: Session, user: AppUser, req: CommitCreate):
    payload_flags = req.payload.get("flags")
    parent_flags = None
    if req.parentCommitId:
        p = db.get(Commit, req.parentCommitId)
        parent_flags = (p.payload or {}).get("flags", []) if p else []

    if payload_flags is None:
        if parent_flags is not None:
            req.payload["flags"] = parent_flags
        else:
            req.payload["flags"] = []
        return

    if user.is_global_admin:
        return

    if parent_flags is None:
        if payload_flags:
            raise HTTPException(status_code=403, detail="Only global admin may set flags")
        return

    if payload_flags != parent_flags:
        raise HTTPException(status_code=403, detail="Only global admin may change flags")


def apply_rules(rules: list[dict[str, Any]], selected_codes: set[str]) -> tuple[set[str], list[dict[str, str]]]:
    msgs: list[dict[str, str]] = []
    resolved = set(selected_codes)

    for r in [x for x in rules if x.get("rule_type") == "PACKAGE"]:
        p = x = r["payload"]
        package_code = p.get("package_code")
        if package_code in resolved:
            resolved.update(p.get("expand_to_codes", []))

    for _ in range(20):
        before = set(resolved)
        for r in [x for x in rules if x.get("rule_type") == "DERIVE"]:
            p = r["payload"]
            if eval_expr(parse_expr(p.get("when_expr")), resolved):
                resolved.update(p.get("add_codes", []))
        if before == resolved:
            break

    for r in [x for x in rules if x.get("rule_type") == "PROHIBIT"]:
        p = r["payload"]
        if eval_expr(parse_expr(p.get("when_expr")), resolved):
            bad = set(p.get("forbid_codes", [])).intersection(resolved)
            if bad:
                msgs.append({"severity": p.get("severity", "ERROR"), "message": p.get("message", f"Forbidden codes: {sorted(bad)}")})

    allowlists = [x for x in rules if x.get("rule_type") == "ALLOWLIST"]
    if allowlists:
        allowed = set()
        for r in allowlists:
            allowed.update(r["payload"].get("allowed_codes", []))
        disallowed = sorted(c for c in resolved if c not in allowed and not c.startswith("P"))
        if disallowed:
            msgs.append({"severity": "ERROR", "message": f"Codes not allowlisted: {', '.join(disallowed)}"})

    return resolved, msgs


@app.post("/users")
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    u = AppUser(name=body.name, email=body.email, is_global_admin=body.is_global_admin)
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "name": u.name, "email": u.email, "is_global_admin": u.is_global_admin}


@app.get("/users")
def list_users(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [{"id": u.id, "name": u.name, "email": u.email, "is_global_admin": u.is_global_admin} for u in db.execute(select(AppUser)).scalars().all()]


@app.post("/user-groups")
def create_user_group(body: GroupCreate, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    g = UserGroup(key=body.key, name=body.name)
    db.add(g)
    db.commit()
    db.refresh(g)
    return {"id": g.id, "key": g.key, "name": g.name}


@app.get("/user-groups")
def list_user_groups(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [{"id": g.id, "key": g.key, "name": g.name} for g in db.execute(select(UserGroup)).scalars().all()]


@app.post("/user-groups/{group_id}/members")
def add_user_group_member(group_id: str, body: GroupMemberCreate, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    db.add(UserGroupMember(user_id=body.user_id, group_id=group_id))
    db.commit()
    return {"ok": True}


@app.delete("/user-groups/{group_id}/members/{user_id}")
def remove_user_group_member(group_id: str, user_id: str, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    db.execute(delete(UserGroupMember).where(UserGroupMember.group_id == group_id, UserGroupMember.user_id == user_id))
    db.commit()
    return {"ok": True}


@app.post("/product-groups")
def create_product_group(body: GroupCreate, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    g = ProductGroup(key=body.key, name=body.name)
    db.add(g)
    db.commit()
    db.refresh(g)
    return {"id": g.id, "key": g.key, "name": g.name}


@app.get("/product-groups")
def list_product_groups(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [{"id": g.id, "key": g.key, "name": g.name} for g in db.execute(select(ProductGroup)).scalars().all()]


@app.post("/product-groups/{group_id}/members/{product_id}")
def add_product_group_member(group_id: str, product_id: str, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    db.add(ProductGroupItem(product_group_id=group_id, product_id=product_id))
    db.commit()
    return {"ok": True}


@app.delete("/product-groups/{group_id}/members/{product_id}")
def remove_product_group_member(group_id: str, product_id: str, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    db.execute(delete(ProductGroupItem).where(ProductGroupItem.product_group_id == group_id, ProductGroupItem.product_id == product_id))
    db.commit()
    return {"ok": True}


@app.post("/grants")
def create_grant(body: GrantCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    g = Grant(
        grantee_type=body.grantee_type,
        grantee_id=body.grantee_id,
        target_type=body.target_type,
        target_id=body.target_id,
        role=body.role,
        created_by=user.id,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return {"id": g.id}


@app.get("/grants")
def list_grants(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [g.__dict__ | {} for g in db.execute(select(Grant)).scalars().all()]


@app.delete("/grants/{grant_id}")
def delete_grant(grant_id: str, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    db.execute(delete(Grant).where(Grant.id == grant_id))
    db.commit()
    return {"ok": True}


@app.post("/security-flags")
def create_security_flag(body: SecurityFlagCreate, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    f = SecurityFlag(key=body.key, name=body.name, description=body.description)
    db.add(f)
    db.commit()
    return {"key": f.key}


@app.get("/security-flags")
def list_security_flags(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [{"key": f.key, "name": f.name, "description": f.description} for f in db.execute(select(SecurityFlag)).scalars().all()]


@app.post("/flag-clearances")
def create_flag_clearance(body: FlagClearanceCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    fc = FlagClearance(
        grantee_type=body.grantee_type,
        grantee_id=body.grantee_id,
        flag_key=body.flag_key,
        created_by=user.id,
    )
    db.add(fc)
    db.commit()
    db.refresh(fc)
    return {"id": fc.id}


@app.get("/flag-clearances")
def list_flag_clearances(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [fc.__dict__ | {} for fc in db.execute(select(FlagClearance)).scalars().all()]


@app.delete("/flag-clearances/{fc_id}")
def delete_flag_clearance(fc_id: str, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    db.execute(delete(FlagClearance).where(FlagClearance.id == fc_id))
    db.commit()
    return {"ok": True}


@app.post("/products")
def create_product(body: ProductCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    require_global_admin(user)
    p = ProductMaster(key=body.key, name=body.name)
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "key": p.key, "name": p.name}


@app.get("/products")
def list_products(db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    products = db.execute(select(ProductMaster)).scalars().all()
    visible = []
    for p in products:
        if user.is_global_admin or get_effective_product_role(db, user.id, p.id):
            visible.append({"id": p.id, "key": p.key, "name": p.name})
    return visible


@app.post("/parts")
def create_part(body: PartCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    require_global_admin(user)
    p = PartMaster(key=body.key, name=body.name)
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "key": p.key, "name": p.name}


@app.get("/parts")
def list_parts(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [{"id": p.id, "key": p.key, "name": p.name} for p in db.execute(select(PartMaster)).scalars().all()]


@app.post("/org-nodes")
def create_org_node(body: OrgNodeCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    require_global_admin(user)
    n = OrgNode(key=body.key, name=body.name, parent_id=body.parent_id)
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"id": n.id, "key": n.key, "name": n.name, "parent_id": n.parent_id}


@app.get("/org-nodes")
def list_org_nodes(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [{"id": n.id, "key": n.key, "name": n.name, "parent_id": n.parent_id} for n in db.execute(select(OrgNode)).scalars().all()]


@app.post("/codes")
def create_code(body: CodeCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    require_global_admin(user)
    c = CodeMaster(key=body.key)
    db.add(c)
    db.commit()
    return {"key": c.key}


@app.get("/codes")
def list_codes(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [{"key": c.key} for c in db.execute(select(CodeMaster)).scalars().all()]


@app.post("/pcss-symbols")
def create_pcss_symbol(body: PcssCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    require_global_admin(user)
    s = PcssSymbol(key=body.key, description=body.description)
    db.add(s)
    db.commit()
    return {"key": s.key, "description": s.description}


@app.get("/pcss-symbols")
def list_pcss_symbols(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [{"key": s.key, "description": s.description} for s in db.execute(select(PcssSymbol)).scalars().all()]


@app.post("/usage-masters")
def create_usage_master(body: UsageMasterCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    require_product_role(db, user, body.product_id, "EDIT")
    um = UsageMaster(
        product_id=body.product_id,
        org_node_id=body.org_node_id,
        part_master_id=body.part_master_id,
        pcss_expr=body.pcss_expr,
        variant_key=variant_key(body.condition_expr),
    )
    db.add(um)
    db.commit()
    db.refresh(um)
    return {"id": um.id, "variant_key": um.variant_key}


@app.get("/usage-masters")
def list_usage_masters(product_id: str | None = None, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    q = select(UsageMaster)
    if product_id:
        q = q.where(UsageMaster.product_id == product_id)
    rows = db.execute(q).scalars().all()
    out = []
    for u in rows:
        if user.is_global_admin or get_effective_product_role(db, user.id, u.product_id):
            out.append({"id": u.id, "product_id": u.product_id, "org_node_id": u.org_node_id, "part_master_id": u.part_master_id, "pcss_expr": u.pcss_expr, "variant_key": u.variant_key})
    return out


@app.post("/rule-masters")
def create_rule_master(body: RuleMasterCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    if body.scope_type == "PRODUCT":
        if not body.product_id:
            raise HTTPException(status_code=400, detail="product_id required for product-scoped rule")
        require_product_role(db, user, body.product_id, "EDIT")
    else:
        require_global_admin(user)
    rm = RuleMaster(scope_type=body.scope_type, product_id=body.product_id, rule_type=body.rule_type)
    db.add(rm)
    db.commit()
    db.refresh(rm)
    return {"id": rm.id, "scope_type": rm.scope_type, "rule_type": rm.rule_type, "product_id": rm.product_id}


@app.get("/rule-masters")
def list_rule_masters(db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    return [{"id": r.id, "scope_type": r.scope_type, "product_id": r.product_id, "rule_type": r.rule_type} for r in db.execute(select(RuleMaster)).scalars().all()]


@app.post("/product-pcss-masters")
def create_product_pcss_master(body: ProductPcssMasterCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    require_product_role(db, user, body.product_id, "EDIT")
    m = ProductPcssMaster(product_id=body.product_id, pcss_key=body.pcss_key)
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"id": m.id, "product_id": m.product_id, "pcss_key": m.pcss_key}


@app.get("/product-pcss-masters")
def list_product_pcss_masters(product_id: str | None = None, db: Session = Depends(get_db), _: AppUser = Depends(get_current_user)):
    q = select(ProductPcssMaster)
    if product_id:
        q = q.where(ProductPcssMaster.product_id == product_id)
    return [{"id": r.id, "product_id": r.product_id, "pcss_key": r.pcss_key} for r in db.execute(q).scalars().all()]


@app.post("/commits")
def create_commit(req: CommitCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    if req.objectType in {"PART", "CODE"}:
        require_global_admin(user)
    elif req.objectType == "RULE":
        rm = db.get(RuleMaster, req.objectMasterId)
        if not rm:
            raise HTTPException(status_code=404, detail="Rule master not found")
        if rm.scope_type == "GLOBAL":
            require_global_admin(user)
        else:
            require_product_role(db, user, rm.product_id, "EDIT")
    else:
        pid = product_for_object(db, req.objectType, req.objectMasterId)
        if not pid:
            raise HTTPException(status_code=404, detail="Object master not found")
        require_product_role(db, user, pid, "EDIT")

    enforce_flag_mutation_rule(db, user, req)

    c = Commit(
        created_by=user.id,
        message=req.message,
        parent_id=req.parentCommitId,
        merge_parent_id=req.mergeParentId,
        object_type=req.objectType,
        object_master_id=req.objectMasterId,
        payload=req.payload,
    )
    db.add(c)
    db.flush()

    h = db.execute(
        select(ObjectBranchHead).where(
            ObjectBranchHead.object_type == req.objectType,
            ObjectBranchHead.object_master_id == req.objectMasterId,
            ObjectBranchHead.branch_name == req.branch,
        )
    ).scalar_one_or_none()
    if h:
        h.commit_id = c.id
    else:
        db.add(ObjectBranchHead(object_type=req.objectType, object_master_id=req.objectMasterId, branch_name=req.branch, commit_id=c.id))

    db.commit()
    return {"id": c.id}


@app.post("/baselines")
def create_baseline(req: BaselineCreate, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    products = db.execute(select(ProductMaster).where(ProductMaster.key.in_(req.productKeys))).scalars().all()
    if len(products) != len(req.productKeys):
        raise HTTPException(status_code=404, detail="Product not found")
    for p in products:
        require_product_role(db, user, p.id, "RELEASE")

    b = Baseline(name=req.name, created_by=user.id, description=req.description, immutable=True)
    db.add(b)
    db.flush()

    branch_heads = db.execute(select(ObjectBranchHead).where(ObjectBranchHead.branch_name == req.fromBranch)).scalars().all()

    product_ids = {p.id for p in products}
    allowed_object_master_ids = set(product_ids)
    usage_ids = {u.id for u in db.execute(select(UsageMaster).where(UsageMaster.product_id.in_(product_ids))).scalars().all()}
    pcss_ids = {m.id for m in db.execute(select(ProductPcssMaster).where(ProductPcssMaster.product_id.in_(product_ids))).scalars().all()}
    rule_ids = {r.id for r in db.execute(select(RuleMaster).where(or_(RuleMaster.scope_type == "GLOBAL", RuleMaster.product_id.in_(product_ids)))).scalars().all()}
    allowed_object_master_ids |= usage_ids | pcss_ids | rule_ids

    if user.is_global_admin:
        picked = branch_heads
    else:
        picked = [h for h in branch_heads if h.object_master_id in allowed_object_master_ids]

    for h in picked:
        db.add(BaselineItem(baseline_id=b.id, object_type=h.object_type, object_master_id=h.object_master_id, commit_id=h.commit_id))

    db.commit()
    return {"id": b.id, "name": b.name, "immutable": b.immutable}


@app.post("/products/{product_key}/resolve")
def resolve_product(product_key: str, body: ResolveRequest, baseline: str | None = None, branch: str | None = None, db: Session = Depends(get_db), user: AppUser = Depends(get_current_user)):
    if not baseline and not branch:
        raise HTTPException(status_code=400, detail="Provide baseline or branch")

    product = db.execute(select(ProductMaster).where(ProductMaster.key == product_key)).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Not found")

    require_product_role(db, user, product.id, "VIEW")
    clearance = get_effective_flag_clearance(db, user.id)

    product_commit = get_selected_commit(db, "PRODUCT", product.id, baseline, branch)
    if not product_commit:
        raise HTTPException(status_code=500, detail="Missing product commit")
    if not is_commit_visible_to_user((product_commit.payload or {}).get("flags", []), clearance):
        raise HTTPException(status_code=403, detail="Forbidden")

    validation_messages: list[dict[str, str]] = []

    rule_masters = db.execute(
        select(RuleMaster).where(or_(RuleMaster.scope_type == "GLOBAL", and_(RuleMaster.scope_type == "PRODUCT", RuleMaster.product_id == product.id)))
    ).scalars().all()

    rule_payloads = []
    for rm in rule_masters:
        c = get_selected_commit(db, "RULE", rm.id, baseline, branch)
        if not c:
            continue
        if not is_commit_visible_to_user((c.payload or {}).get("flags", []), clearance):
            continue
        rule_payloads.append({"rule_type": rm.rule_type, "payload": c.payload})

    resolved_codes, rule_msgs = apply_rules(rule_payloads, set(body.selectedCodes))
    validation_messages.extend(rule_msgs)

    usage_rows = db.execute(select(UsageMaster).where(UsageMaster.product_id == product.id)).scalars().all()
    usages = []

    for um in usage_rows:
        uc = get_selected_commit(db, "USAGE", um.id, baseline, branch)
        if not uc:
            validation_messages.append({"severity": "ERROR", "message": f"Missing usage commit for {um.id}"})
            continue
        if not is_commit_visible_to_user((uc.payload or {}).get("flags", []), clearance):
            continue

        condition_expr = (uc.payload or {}).get("condition_expr")
        if condition_expr and not eval_expr(parse_expr(condition_expr), resolved_codes):
            continue

        part = db.get(PartMaster, um.part_master_id)
        if not part:
            validation_messages.append({"severity": "ERROR", "message": f"Missing part master {um.part_master_id}"})
            continue

        pc = get_selected_commit(db, "PART", part.id, baseline, branch)
        if not pc:
            validation_messages.append({"severity": "ERROR", "message": f"Missing part commit for {part.key}"})
            continue
        if not is_commit_visible_to_user((pc.payload or {}).get("flags", []), clearance):
            continue

        org = db.get(OrgNode, um.org_node_id)
        if not org:
            validation_messages.append({"severity": "ERROR", "message": f"Missing org node {um.org_node_id}"})
            continue

        final_t = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]
        bad = False
        symbols = [s.strip() for s in um.pcss_expr.split("+") if s.strip()]
        for symbol in symbols:
            pm = db.execute(
                select(ProductPcssMaster).where(ProductPcssMaster.product_id == product.id, ProductPcssMaster.pcss_key == symbol)
            ).scalar_one_or_none()
            if not pm:
                validation_messages.append({"severity": "ERROR", "message": f"Missing product PCSS mapping for {symbol}"})
                bad = True
                break
            tc = get_selected_commit(db, "PRODUCT_PCSS", pm.id, baseline, branch)
            if not tc:
                validation_messages.append({"severity": "ERROR", "message": f"Missing PRODUCT_PCSS commit for {symbol}"})
                bad = True
                break
            if not is_commit_visible_to_user((tc.payload or {}).get("flags", []), clearance):
                validation_messages.append({"severity": "ERROR", "message": f"Inaccessible PRODUCT_PCSS commit for {symbol}"})
                bad = True
                break
            tf = tc.payload.get("transform_4x4")
            if not isinstance(tf, list) or len(tf) != 16:
                validation_messages.append({"severity": "ERROR", "message": f"Invalid transform for {symbol}"})
                bad = True
                break
            final_t = mat_mul(final_t, [float(x) for x in tf])

        if bad:
            continue

        local = (uc.payload or {}).get("position_4x4")
        if not isinstance(local, list) or len(local) != 16:
            validation_messages.append({"severity": "ERROR", "message": f"Invalid usage local transform for {um.id}"})
            continue
        final_t = mat_mul(final_t, [float(x) for x in local])

        usages.append(
            {
                "usageMasterId": um.id,
                "partKey": part.key,
                "orgNodeKey": org.key,
                "conditionExpr": condition_expr,
                "pcssExpr": um.pcss_expr,
                "finalTransform4x4": final_t,
            }
        )

    return {
        "productKey": product.key,
        "baseline": baseline,
        "branch": branch,
        "resolvedCodes": sorted(resolved_codes),
        "validationMessages": validation_messages,
        "usages": usages,
    }


def seed_initial_data(db: Session):
    if db.execute(select(AppUser)).first():
        return

    admin = AppUser(id="11111111-1111-1111-1111-111111111111", name="admin", email="admin@example.com", is_global_admin=True)
    user1 = AppUser(id="22222222-2222-2222-2222-222222222222", name="user1", email="user1@example.com", is_global_admin=False)
    user2 = AppUser(id="33333333-3333-3333-3333-333333333333", name="user2", email="user2@example.com", is_global_admin=False)
    db.add_all([admin, user1, user2])

    prodA = ProductMaster(key="prodA", name="Product A")
    prodB = ProductMaster(key="prodB", name="Product B")
    partA = PartMaster(key="partA", name="Part A")
    partB = PartMaster(key="partB", name="Part B")
    org = OrgNode(key="rearaxle", name="Rear Axle")
    db.add_all([prodA, prodB, partA, partB, org])

    codes = [CodeMaster(key=k) for k in ["C001", "C002", "C003", "C004"]]
    pcss = [PcssSymbol(key="LA", description="Left axis"), PcssSymbol(key="right", description="right side")]
    db.add_all(codes + pcss)

    sec = SecurityFlag(key="CONFIDENTIAL", name="Confidential", description="restricted")
    db.add(sec)
    db.flush()

    db.add_all(
        [
            Grant(grantee_type="USER", grantee_id=user1.id, target_type="PRODUCT", target_id=prodA.id, role="VIEW", created_by=admin.id),
            Grant(grantee_type="USER", grantee_id=user1.id, target_type="PRODUCT", target_id=prodB.id, role="VIEW", created_by=admin.id),
            Grant(grantee_type="USER", grantee_id=admin.id, target_type="PRODUCT", target_id=prodA.id, role="ADMIN", created_by=admin.id),
            Grant(grantee_type="USER", grantee_id=admin.id, target_type="PRODUCT", target_id=prodB.id, role="ADMIN", created_by=admin.id),
        ]
    )

    um_a1 = UsageMaster(product_id=prodA.id, org_node_id=org.id, part_master_id=partA.id, pcss_expr="LA+right", variant_key=variant_key("C004-C001"))
    um_b1 = UsageMaster(product_id=prodA.id, org_node_id=org.id, part_master_id=partB.id, pcss_expr="LA+right", variant_key=variant_key("C004-C001"))
    um_a2 = UsageMaster(product_id=prodB.id, org_node_id=org.id, part_master_id=partA.id, pcss_expr="LA+right", variant_key=variant_key("C004"))
    um_b2 = UsageMaster(product_id=prodB.id, org_node_id=org.id, part_master_id=partB.id, pcss_expr="LA+right", variant_key=variant_key("C004"))
    db.add_all([um_a1, um_b1, um_a2, um_b2])

    pA_LA = ProductPcssMaster(product_id=prodA.id, pcss_key="LA")
    pA_R = ProductPcssMaster(product_id=prodA.id, pcss_key="right")
    pB_LA = ProductPcssMaster(product_id=prodB.id, pcss_key="LA")
    pB_R = ProductPcssMaster(product_id=prodB.id, pcss_key="right")
    db.add_all([pA_LA, pA_R, pB_LA, pB_R])
    db.flush()

    identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    trans = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1]

    def add_commit(object_type: str, object_master_id: str, payload: dict, msg: str):
        c = Commit(
            id=str(uuid.uuid4()),
            created_at=now(),
            created_by=admin.id,
            message=msg,
            object_type=object_type,
            object_master_id=str(object_master_id),
            payload=payload,
        )
        db.add(c)
        db.flush()
        db.add(ObjectBranchHead(object_type=object_type, object_master_id=str(object_master_id), branch_name="main", commit_id=c.id))

    add_commit("PRODUCT", prodA.id, {"state": "RELEASED", "name": "prodA", "flags": []}, "init prodA")
    add_commit("PRODUCT", prodB.id, {"state": "RELEASED", "name": "prodB", "flags": ["CONFIDENTIAL"]}, "init prodB confidential")
    add_commit("PART", partA.id, {"state": "RELEASED", "revision": "A", "name": "Part A", "flags": []}, "init partA")
    add_commit("PART", partB.id, {"state": "RELEASED", "revision": "A", "name": "Part B", "flags": ["CONFIDENTIAL"]}, "init partB confidential")

    usage_payload_a = {
        "state": "RELEASED",
        "condition_expr": "C004-C001",
        "position_4x4": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.25, 0, 0, 1],
        "flags": [],
    }
    usage_payload_b = {
        "state": "RELEASED",
        "condition_expr": "C004",
        "position_4x4": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.1, 0, 0, 1],
        "flags": [],
    }
    add_commit("USAGE", um_a1.id, usage_payload_a, "init usage A1")
    add_commit("USAGE", um_b1.id, usage_payload_a, "init usage B1")
    add_commit("USAGE", um_a2.id, usage_payload_b, "init usage A2")
    add_commit("USAGE", um_b2.id, usage_payload_b, "init usage B2")

    add_commit("PRODUCT_PCSS", pA_LA.id, {"state": "RELEASED", "transform_4x4": trans, "flags": []}, "pcss LA A")
    add_commit("PRODUCT_PCSS", pA_R.id, {"state": "RELEASED", "transform_4x4": identity, "flags": []}, "pcss right A")
    add_commit("PRODUCT_PCSS", pB_LA.id, {"state": "RELEASED", "transform_4x4": trans, "flags": []}, "pcss LA B")
    add_commit("PRODUCT_PCSS", pB_R.id, {"state": "RELEASED", "transform_4x4": identity, "flags": []}, "pcss right B")

    db.commit()


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_initial_data(db)
