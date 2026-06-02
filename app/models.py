import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint
from app.database import Base


def u4() -> str:
    return str(uuid.uuid4())


def now_utc():
    return datetime.now(timezone.utc)


class AppUser(Base):
    __tablename__ = "app_user"
    id = Column(String, primary_key=True, default=u4)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)
    is_global_admin = Column(Boolean, nullable=False, default=False)


class UserGroup(Base):
    __tablename__ = "user_group"
    id = Column(String, primary_key=True, default=u4)
    key = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)


class UserGroupMember(Base):
    __tablename__ = "user_group_member"
    user_id = Column(String, ForeignKey("app_user.id"), primary_key=True)
    group_id = Column(String, ForeignKey("user_group.id"), primary_key=True)


class ProductGroup(Base):
    __tablename__ = "product_group"
    id = Column(String, primary_key=True, default=u4)
    key = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)


class ProductMaster(Base):
    __tablename__ = "product_master"
    id = Column(String, primary_key=True, default=u4)
    key = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)


class ProductGroupItem(Base):
    __tablename__ = "product_group_item"
    product_group_id = Column(String, ForeignKey("product_group.id"), primary_key=True)
    product_id = Column(String, ForeignKey("product_master.id"), primary_key=True)


class Grant(Base):
    __tablename__ = "grant"
    id = Column(String, primary_key=True, default=u4)
    grantee_type = Column(Text, nullable=False)
    grantee_id = Column(String, nullable=False)
    target_type = Column(Text, nullable=False)
    target_id = Column(String, nullable=False)
    role = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)
    created_by = Column(Text, nullable=False)


class SecurityFlag(Base):
    __tablename__ = "security_flag"
    key = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)


class FlagClearance(Base):
    __tablename__ = "flag_clearance"
    id = Column(String, primary_key=True, default=u4)
    grantee_type = Column(Text, nullable=False)
    grantee_id = Column(String, nullable=False)
    flag_key = Column(Text, ForeignKey("security_flag.key"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)
    created_by = Column(Text, nullable=False)
    __table_args__ = (UniqueConstraint("grantee_type", "grantee_id", "flag_key", name="uq_flag_clearance"),)


class OrgNode(Base):
    __tablename__ = "org_node"
    id = Column(String, primary_key=True, default=u4)
    key = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)
    parent_id = Column(String, ForeignKey("org_node.id"), nullable=True)


class PartMaster(Base):
    __tablename__ = "part_master"
    id = Column(String, primary_key=True, default=u4)
    key = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)


class CodeMaster(Base):
    __tablename__ = "code_master"
    key = Column(Text, primary_key=True)


class PcssSymbol(Base):
    __tablename__ = "pcss_symbol"
    key = Column(Text, primary_key=True)
    description = Column(Text, nullable=True)


class UsageMaster(Base):
    __tablename__ = "usage_master"
    id = Column(String, primary_key=True, default=u4)
    product_id = Column(String, ForeignKey("product_master.id"), nullable=False)
    org_node_id = Column(String, ForeignKey("org_node.id"), nullable=False)
    part_master_id = Column(String, ForeignKey("part_master.id"), nullable=False)
    pcss_expr = Column(Text, nullable=False)
    variant_key = Column(Text, nullable=False)
    __table_args__ = (UniqueConstraint("product_id", "org_node_id", "part_master_id", "pcss_expr", "variant_key", name="uq_usage_variant"),)


class ProductPcssMaster(Base):
    __tablename__ = "product_pcss_master"
    id = Column(String, primary_key=True, default=u4)
    product_id = Column(String, ForeignKey("product_master.id"), nullable=False)
    pcss_key = Column(Text, ForeignKey("pcss_symbol.key"), nullable=False)
    __table_args__ = (UniqueConstraint("product_id", "pcss_key", name="uq_product_pcss"),)


class RuleMaster(Base):
    __tablename__ = "rule_master"
    id = Column(String, primary_key=True, default=u4)
    scope_type = Column(Text, nullable=False)
    product_id = Column(String, ForeignKey("product_master.id"), nullable=True)
    rule_type = Column(Text, nullable=False)


class Commit(Base):
    __tablename__ = "commit"
    id = Column(String, primary_key=True, default=u4)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)
    created_by = Column(Text, nullable=False)
    message = Column(Text, nullable=False)
    parent_id = Column(String, ForeignKey("commit.id"), nullable=True)
    merge_parent_id = Column(String, ForeignKey("commit.id"), nullable=True)
    object_type = Column(Text, nullable=False)
    object_master_id = Column(Text, nullable=False)
    payload = Column(JSON, nullable=False)
    checksum = Column(Text, nullable=True)


class ObjectBranchHead(Base):
    __tablename__ = "object_branch_head"
    object_type = Column(Text, primary_key=True)
    object_master_id = Column(Text, primary_key=True)
    branch_name = Column(Text, primary_key=True)
    commit_id = Column(String, ForeignKey("commit.id"), nullable=False)


class Baseline(Base):
    __tablename__ = "baseline"
    id = Column(String, primary_key=True, default=u4)
    name = Column(Text, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)
    created_by = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    immutable = Column(Boolean, nullable=False, default=True)


class BaselineItem(Base):
    __tablename__ = "baseline_item"
    baseline_id = Column(String, ForeignKey("baseline.id"), primary_key=True)
    object_type = Column(Text, primary_key=True)
    object_master_id = Column(Text, primary_key=True)
    commit_id = Column(String, ForeignKey("commit.id"), nullable=False)
