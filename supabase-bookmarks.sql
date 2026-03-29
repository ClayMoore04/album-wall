-- Bookmarks / Saved Mixtapes table
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS bookmarks (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mixtape_id  UUID NOT NULL REFERENCES mixtapes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, mixtape_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_mixtape ON bookmarks (mixtape_id);

-- RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can read their own bookmarks
CREATE POLICY "bookmarks_select_own" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read bookmark counts on public mixtapes
CREATE POLICY "bookmarks_select_count" ON bookmarks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM mixtapes WHERE id = mixtape_id AND is_public = true)
  );

-- Users can insert their own bookmarks
CREATE POLICY "bookmarks_insert_own" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "bookmarks_delete_own" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);
