import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import os
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.main import app, seed_initial_data
from app.condition import canonical_expr, eval_expr, parse_expr
from app.database import Base, engine
from app.models import AppUser, ProductMaster, UsageMaster
from sqlalchemy import select
from app.database import SessionLocal


ADMIN = "11111111-1111-1111-1111-111111111111"
USER1 = "22222222-2222-2222-2222-222222222222"
USER2 = "33333333-3333-3333-3333-333333333333"


def setup_module():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_initial_data(db)


def client():
    return TestClient(app)


def test_rbac_403_on_resolve():
    c = client()
    r = c.post("/products/prodA/resolve?branch=main", json={"selectedCodes": ["C004"]}, headers={"X-User-Id": USER2})
    assert r.status_code == 403


def test_flag_403_on_product():
    c = client()
    r = c.post("/products/prodB/resolve?branch=main", json={"selectedCodes": ["C004"]}, headers={"X-User-Id": USER1})
    assert r.status_code == 403


def test_flag_filtering_on_part():
    c = client()
    r = c.post("/products/prodA/resolve?branch=main", json={"selectedCodes": ["C004"]}, headers={"X-User-Id": USER1})
    assert r.status_code == 200
    part_keys = {u["partKey"] for u in r.json()["usages"]}
    assert "partA" in part_keys
    assert "partB" not in part_keys


def test_condition_parser_precedence():
    ast = parse_expr("C004-C001/C002")
    assert canonical_expr(ast).startswith("OR(")
    assert eval_expr(parse_expr("C004-C001"), {"C004"}) is True
    assert eval_expr(parse_expr("C004-C001"), {"C004", "C001"}) is False
    assert eval_expr(parse_expr("-C004"), {"C004"}) is False


def test_baseline_immutability():
    c = client()

    # Create immutable baseline from current main
    b = c.post(
        "/baselines",
        json={"name": "R2026.01", "fromBranch": "main", "productKeys": ["prodA"], "description": "Release"},
        headers={"X-User-Id": ADMIN},
    )
    assert b.status_code == 200

    before = c.post("/products/prodA/resolve?baseline=R2026.01", json={"selectedCodes": ["C004"]}, headers={"X-User-Id": USER1})
    assert before.status_code == 200
    before_count = len(before.json()["usages"])

    # Move branch head for one usage to condition false for C004-only selection
    with SessionLocal() as db:
        usage = db.execute(
            select(UsageMaster).join(ProductMaster, UsageMaster.product_id == ProductMaster.id).where(ProductMaster.key == "prodA")
        ).scalars().first()

    commit_resp = c.post(
        "/commits",
        json={
            "objectType": "USAGE",
            "objectMasterId": usage.id,
            "branch": "main",
            "message": "change condition",
            "parentCommitId": None,
            "mergeParentId": None,
            "payload": {
                "state": "RELEASED",
                "condition_expr": "C001",
                "position_4x4": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.25, 0, 0, 1],
                "flags": [],
            },
        },
        headers={"X-User-Id": ADMIN},
    )
    assert commit_resp.status_code == 200

    after_baseline = c.post("/products/prodA/resolve?baseline=R2026.01", json={"selectedCodes": ["C004"]}, headers={"X-User-Id": USER1})
    assert after_baseline.status_code == 200
    assert len(after_baseline.json()["usages"]) == before_count


def test_structure_ui_available_with_multiselect_controls():
    c = client()
    r = c.get("/")
    assert r.status_code == 200
    assert "nextPLM Structure Explorer" in r.text
    assert 'id="productSelect" multiple' in r.text
    assert 'id="codeSelect" multiple' in r.text


def test_seed_initial_data_when_users_exist_but_products_missing():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        db.add(
            AppUser(
                id=ADMIN,
                name="admin",
                email="admin@example.com",
                is_global_admin=True,
            )
        )
        db.commit()
        seed_initial_data(db)

        products = db.execute(select(ProductMaster)).scalars().all()
        by_key = {p.key: p.name for p in products}

        assert by_key["prodA"] == "Sedan"
        assert by_key["prodB"] == "Convertible"
