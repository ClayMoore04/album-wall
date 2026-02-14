-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

CREATE TABLE submissions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  album_name    TEXT NOT NULL,
  artist_name   TEXT NOT NULL,
  album_art_url TEXT,
  spotify_url   TEXT,
  spotify_id    TEXT,
  submitted_by  TEXT NOT NULL,
  note          TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone to read and insert (no auth needed)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read submissions"
  ON submissions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

-- Enable realtime for live Wall updates
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
