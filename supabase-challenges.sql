-- Weekly Challenges table
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS challenges (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  prompt      TEXT NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding current challenge
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges (is_active, starts_at, ends_at);

-- RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Everyone can read challenges
CREATE POLICY "challenges_select" ON challenges FOR SELECT USING (true);

-- Only service role can insert/update (admin managed)
CREATE POLICY "challenges_insert" ON challenges FOR INSERT WITH CHECK (false);
CREATE POLICY "challenges_update" ON challenges FOR UPDATE USING (false);

-- Link mixtapes to challenges (optional, uses existing theme field as tag)
-- Convention: mixtapes with theme matching "#challenge-{id}" are challenge entries
-- No schema change needed — we filter by theme pattern

-- RPC to get current active challenge
CREATE OR REPLACE FUNCTION get_current_challenge()
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  prompt TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  entry_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.title,
    c.description,
    c.prompt,
    c.starts_at,
    c.ends_at,
    (SELECT COUNT(*) FROM mixtapes m
     WHERE m.theme LIKE '#challenge-' || c.id || '%'
     AND m.is_public = true) AS entry_count
  FROM challenges c
  WHERE c.is_active = true
    AND c.starts_at <= NOW()
    AND c.ends_at > NOW()
  ORDER BY c.starts_at DESC
  LIMIT 1;
$$;
