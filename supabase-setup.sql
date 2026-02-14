-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

CREATE TABLE submissions (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  album_name       TEXT NOT NULL,
  artist_name      TEXT NOT NULL,
  album_art_url    TEXT,
  spotify_url      TEXT,
  spotify_id       TEXT,
  submitted_by     TEXT NOT NULL,
  email            TEXT DEFAULT '',
  note             TEXT DEFAULT '',
  daniel_feedback  TEXT DEFAULT '',
  feedback_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone to read, insert, and update (no auth needed)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read submissions"
  ON submissions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update submissions"
  ON submissions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete submissions"
  ON submissions FOR DELETE
  USING (true);

-- Enable realtime for live Wall updates
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;

-- ============================================================
-- IF YOU ALREADY HAVE THE TABLE, run these ALTER statements
-- instead of the CREATE TABLE above:
-- ============================================================
-- ALTER TABLE submissions ADD COLUMN email TEXT DEFAULT '';
-- ALTER TABLE submissions ADD COLUMN daniel_feedback TEXT DEFAULT '';
-- ALTER TABLE submissions ADD COLUMN feedback_at TIMESTAMPTZ;
-- CREATE POLICY "Anyone can update submissions" ON submissions FOR UPDATE USING (true) WITH CHECK (true);
-- CREATE POLICY "Anyone can delete submissions" ON submissions FOR DELETE USING (true);
