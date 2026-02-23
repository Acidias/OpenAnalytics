-- 004_ai_usage.sql — Track per-user AI query usage for rate limiting

ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_queries_used INT DEFAULT 0;
