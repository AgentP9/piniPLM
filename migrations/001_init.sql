-- Initial MVP schema for nextPLM backend
CREATE TABLE IF NOT EXISTS app_user (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL,
  is_global_admin boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS product_master (
  id uuid PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS part_master (
  id uuid PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS org_node (
  id uuid PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  parent_id uuid NULL REFERENCES org_node(id)
);

CREATE TABLE IF NOT EXISTS usage_master (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES product_master(id),
  org_node_id uuid NOT NULL REFERENCES org_node(id),
  part_master_id uuid NOT NULL REFERENCES part_master(id),
  pcss_expr text NOT NULL,
  variant_key text NOT NULL,
  UNIQUE(product_id, org_node_id, part_master_id, pcss_expr, variant_key)
);

CREATE TABLE IF NOT EXISTS commit (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL,
  created_by text NOT NULL,
  message text NOT NULL,
  parent_id uuid NULL REFERENCES commit(id),
  merge_parent_id uuid NULL REFERENCES commit(id),
  object_type text NOT NULL,
  object_master_id text NOT NULL,
  payload jsonb NOT NULL,
  checksum text NULL
);
