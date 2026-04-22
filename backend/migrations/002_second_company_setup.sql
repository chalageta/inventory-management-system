-- =============================================================
-- SQL Migration 002: Baroyi Company Setup
-- Gilando = company_id 1  |  Baroyi = company_id 2
-- Run this AFTER 001_multi_tenancy.sql has been applied.
-- =============================================================

-- -------------------------------------------------------
-- 1. Insert Baroyi with explicit ID = 2
-- -------------------------------------------------------
INSERT INTO companies (id, name, slug, is_active)
VALUES (2, 'Baroyi', 'baroyi', 1);

-- -------------------------------------------------------
-- 2. Create Roles scoped to Baroyi (company_id = 2)
-- -------------------------------------------------------
INSERT INTO roles (name, company_id) VALUES
  ('Admin',     2),
  ('Purchaser', 2),
  ('Storeman',  2),
  ('Sales',     2);

-- -------------------------------------------------------
-- 3. Capture Baroyi Admin role ID
-- -------------------------------------------------------
SET @baroyi_admin_role = (
  SELECT id FROM roles
  WHERE name = 'Admin' AND company_id = 2
  LIMIT 1
);

-- -------------------------------------------------------
-- 4. Assign ALL existing permissions to Baroyi Admin role
-- -------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id)
SELECT @baroyi_admin_role, id
FROM permissions;

-- -------------------------------------------------------
-- 5. Generate a bcrypt hash FIRST, then paste it below.
--    Run in your terminal (from the backend folder):
--
--    node -e "require('bcrypt').hash('Admin@1234', 12).then(h => console.log(h))"
--
--    Then replace REPLACE_HASH_HERE with the output.
-- -------------------------------------------------------
INSERT INTO users (name, email, password, is_active, company_id)
VALUES (
  'Baroyi Admin',
  'admin@baroyi.com',
  '$2b$12$MgAhuWNXLwU0lRzB2J.Jy.a82.O85PgBbZ7kHxE/NZCL/ZH.GhRym',
  1,
  2
);

SET @baroyi_admin_user = LAST_INSERT_ID();

-- -------------------------------------------------------
-- 6. Assign Admin role to Baroyi Admin user
-- -------------------------------------------------------
INSERT INTO user_roles (user_id, role_id)
VALUES (@baroyi_admin_user, @baroyi_admin_role);

-- -------------------------------------------------------
-- 7. Verification queries — run these to confirm isolation
-- -------------------------------------------------------
SELECT id, name, slug FROM companies ORDER BY id;
SELECT id, name, company_id FROM roles ORDER BY company_id, name;
SELECT id, name, email, company_id FROM users WHERE deleted_at IS NULL ORDER BY company_id;
