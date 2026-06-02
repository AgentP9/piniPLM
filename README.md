# piniPLM / nextPLM MVP backend

FastAPI + SQLAlchemy MVP backend implementing metadata-only PLM concepts:
- LOPS-ready masters (parts/composition schema-ready)
- UPPS usage resolution with condition expressions and PCSS transforms
- Git-like commit/branch heads + immutable baselines
- Product-scoped RBAC + flag-based ABAC

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open the structure UI at `http://127.0.0.1:8000/` to load products/codes and resolve structure across multiple selected products.

## Authentication

Use header:

- `X-User-Id: <uuid>`

Seeded users:
- admin: `11111111-1111-1111-1111-111111111111` (global admin)
- user1: `22222222-2222-2222-2222-222222222222` (VIEW on prodA/prodB, no CONFIDENTIAL clearance)
- user2: `33333333-3333-3333-3333-333333333333` (no product access)

HTTP behavior:
- 401 unauthenticated/unknown user
- 403 when resource exists but RBAC/ABAC blocks visibility
- 404 when truly not found

## Branches vs baselines

- `POST /commits` writes immutable commits and moves `object_branch_head` for a branch.
- `POST /baselines` snapshots selected branch heads into immutable `baseline_item`s.
- `POST /products/{productKey}/resolve?baseline=...` resolves from frozen baseline.
- `POST /products/{productKey}/resolve?branch=...` resolves branch preview.

Baseline immutability is validated in tests.

## Flags and authorization

- Commit payloads can include `flags` (e.g. `CONFIDENTIAL`).
- User must clear **all** flags to see that revision.
- Non-global-admin cannot introduce/change flags vs parent commit.

## Resolve algorithm (summary)

`POST /products/{productKey}/resolve`

1. Authn/authz on product VIEW.
2. Select commits by baseline or branch.
3. Validate product revision visibility.
4. Load visible rules, resolve codes (PACKAGE/DERIVE/PROHIBIT/ALLOWLIST).
5. Evaluate usages by condition expression.
6. Filter out invisible part revisions.
7. Resolve PCSS chain (`LA+right+...`) and multiply row-major 4x4 matrices with usage local position matrix.
8. Return usages + validation messages.

## OpenAPI

- Runtime schema: `/openapi.json`
- Committed schema snapshot: `openapi.json`

## Tests

```bash
pytest -q
```

Includes required coverage:
- RBAC 403
- Product flag 403
- Confidential part usage filtering
- condition parser precedence
- baseline immutability

## Migrations

A starter migration SQL is included at `migrations/001_init.sql`.
