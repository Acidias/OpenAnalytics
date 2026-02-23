-- 003_user_password.sql - Add password hash for credential-based auth

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
