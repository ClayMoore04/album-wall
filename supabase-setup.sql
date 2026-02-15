-- Run this in Supabase SQL Editor (https://supabase.com/dashboard > SQL Editor)
-- This is the FULL schema for the multi-account Album Wall.

-- ============================================================
-- 1. PROFILES TABLE (new — for multi-account support)
-- ============================================================

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug         TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio          TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. SUBMISSIONS TABLE (updated for multi-account)
-- ============================================================

CREATE TABLE submissions (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wall_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  album_name       TEXT NOT NULL,
  artist_name      TEXT NOT NULL,
  album_art_url    TEXT,
  spotify_url      TEXT,
  spotify_id       TEXT,
  submitted_by     TEXT NOT NULL,
  email            TEXT DEFAULT '',
  note             TEXT DEFAULT '',
  owner_feedback   TEXT DEFAULT '',
  feedback_at      TIMESTAMPTZ,
  tags             TEXT[] DEFAULT '{}',
  listened         BOOLEAN DEFAULT false,
  rating           SMALLINT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_wall_id ON submissions(wall_id);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can read submissions (walls are public)
CREATE POLICY "Anyone can read submissions"
  ON submissions FOR SELECT
  USING (true);

-- Anyone can insert submissions (no account needed to submit)
CREATE POLICY "Anyone can insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

-- Only the wall owner can update submissions on their wall
CREATE POLICY "Wall owner can update"
  ON submissions FOR UPDATE
  USING (wall_id = auth.uid());

-- Only the wall owner can delete submissions from their wall
CREATE POLICY "Wall owner can delete"
  ON submissions FOR DELETE
  USING (wall_id = auth.uid());

-- Enable realtime for live Wall updates
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;

-- ============================================================
-- MIGRATION: If you already have the old single-user table,
-- run the migration endpoint (POST /api/migrate-daniel) first,
-- then run these SQL statements manually:
-- ============================================================
-- ALTER TABLE submissions ALTER COLUMN wall_id SET NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_submissions_wall_id ON submissions(wall_id);
-- ALTER TABLE submissions RENAME COLUMN daniel_feedback TO owner_feedback;
-- DROP POLICY IF EXISTS "Anyone can update submissions" ON submissions;
-- DROP POLICY IF EXISTS "Anyone can delete submissions" ON submissions;
-- CREATE POLICY "Wall owner can update" ON submissions FOR UPDATE USING (wall_id = auth.uid());
-- CREATE POLICY "Wall owner can delete" ON submissions FOR DELETE USING (wall_id = auth.uid());
