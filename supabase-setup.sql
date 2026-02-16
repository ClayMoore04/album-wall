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

-- Function to create a profile during signup (bypasses RLS since
-- the auth session may not be fully established yet after signUp)
CREATE OR REPLACE FUNCTION create_profile(
  user_id UUID,
  user_slug TEXT,
  user_display_name TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO profiles (id, slug, display_name)
  VALUES (user_id, user_slug, user_display_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- 3. FOLLOWS TABLE (social — follow other walls)
-- ============================================================

CREATE TABLE follows (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================
-- 4. WALL DISCOVERY (opt-in listing)
-- ============================================================

ALTER TABLE profiles ADD COLUMN discoverable BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION get_discoverable_walls()
RETURNS TABLE (
  id UUID, slug TEXT, display_name TEXT, bio TEXT,
  follower_count BIGINT, submission_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.slug, p.display_name, p.bio,
    COALESCE((SELECT COUNT(*) FROM follows f WHERE f.following_id = p.id), 0) AS follower_count,
    COALESCE((SELECT COUNT(*) FROM submissions s WHERE s.wall_id = p.id), 0) AS submission_count
  FROM profiles p WHERE p.discoverable = true
  ORDER BY follower_count DESC, submission_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. COLLABORATIVE ROOMS (shared playlists)
-- Tables must be created before policies since rooms policies
-- reference room_members via subqueries.
-- ============================================================

-- 5a. Create all tables first
CREATE TABLE rooms (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_members (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE room_tracks (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id       UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  album_name    TEXT NOT NULL,
  artist_name   TEXT NOT NULL,
  album_art_url TEXT,
  spotify_url   TEXT,
  spotify_id    TEXT,
  type          TEXT DEFAULT 'album',
  added_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_room_tracks_room ON room_tracks(room_id);

-- 5b. Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_tracks ENABLE ROW LEVEL SECURITY;

-- 5c. Add policies (now that all tables exist)
CREATE POLICY "Members can read room" ON rooms FOR SELECT
  USING (id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid()));
CREATE POLICY "Auth users can create rooms" ON rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update room" ON rooms FOR UPDATE
  USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete room" ON rooms FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Members can read members" ON room_members FOR SELECT
  USING (room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can join room" ON room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave room" ON room_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Members can read tracks" ON room_tracks FOR SELECT
  USING (room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can add tracks" ON room_tracks FOR INSERT
  WITH CHECK (auth.uid() = added_by AND room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can remove tracks" ON room_tracks FOR DELETE
  USING (room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE room_tracks;
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;

CREATE OR REPLACE FUNCTION join_room_by_invite(code TEXT)
RETURNS UUID AS $$
DECLARE target_room_id UUID;
BEGIN
  SELECT id INTO target_room_id FROM rooms WHERE invite_code = code;
  IF target_room_id IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
  INSERT INTO room_members (room_id, user_id) VALUES (target_room_id, auth.uid())
    ON CONFLICT (room_id, user_id) DO NOTHING;
  RETURN target_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. MIXTAPES (personal time-constrained playlists)
-- ============================================================

-- 6a. Create tables
CREATE TABLE mixtapes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  is_public   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mixtapes_user ON mixtapes(user_id);

CREATE TABLE mixtape_tracks (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mixtape_id    UUID NOT NULL REFERENCES mixtapes(id) ON DELETE CASCADE,
  position      SMALLINT NOT NULL,
  track_name    TEXT NOT NULL,
  artist_name   TEXT NOT NULL,
  album_name    TEXT DEFAULT '',
  album_art_url TEXT DEFAULT '',
  spotify_url   TEXT DEFAULT '',
  spotify_id    TEXT NOT NULL,
  duration_ms   INTEGER NOT NULL,
  liner_notes   VARCHAR(250) DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mixtape_tracks_mixtape ON mixtape_tracks(mixtape_id);

-- 6b. Enable RLS
ALTER TABLE mixtapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mixtape_tracks ENABLE ROW LEVEL SECURITY;

-- 6c. Mixtape policies
CREATE POLICY "Public mixtapes are viewable" ON mixtapes
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own mixtapes" ON mixtapes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mixtapes" ON mixtapes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mixtapes" ON mixtapes
  FOR DELETE USING (auth.uid() = user_id);

-- 6d. Mixtape track policies
CREATE POLICY "Tracks viewable if mixtape is viewable" ON mixtape_tracks
  FOR SELECT USING (
    mixtape_id IN (
      SELECT id FROM mixtapes WHERE is_public = true OR user_id = auth.uid()
    )
  );
CREATE POLICY "Owner can add tracks" ON mixtape_tracks
  FOR INSERT WITH CHECK (
    mixtape_id IN (SELECT id FROM mixtapes WHERE user_id = auth.uid())
  );
CREATE POLICY "Owner can update tracks" ON mixtape_tracks
  FOR UPDATE USING (
    mixtape_id IN (SELECT id FROM mixtapes WHERE user_id = auth.uid())
  );
CREATE POLICY "Owner can delete tracks" ON mixtape_tracks
  FOR DELETE USING (
    mixtape_id IN (SELECT id FROM mixtapes WHERE user_id = auth.uid())
  );

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
