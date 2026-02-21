-- Safe migration: run this in Supabase SQL Editor
-- Creates all missing tables, columns, policies, and functions.
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS where needed).

-- ============================================================
-- 3. FOLLOWS
-- ============================================================

CREATE TABLE IF NOT EXISTS follows (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read follows" ON follows;
CREATE POLICY "Public read follows" ON follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can follow" ON follows;
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================
-- 4. WALL DISCOVERY
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discoverable BOOLEAN DEFAULT false;

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
-- 5. COLLABORATIVE ROOMS
-- ============================================================

CREATE TABLE IF NOT EXISTS rooms (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_members (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_tracks (
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

CREATE INDEX IF NOT EXISTS idx_room_tracks_room ON room_tracks(room_id);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read room" ON rooms;
CREATE POLICY "Members can read room" ON rooms FOR SELECT
  USING (auth.uid() = created_by OR id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Auth users can create rooms" ON rooms;
CREATE POLICY "Auth users can create rooms" ON rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creator can update room" ON rooms;
CREATE POLICY "Creator can update room" ON rooms FOR UPDATE
  USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creator can delete room" ON rooms;
CREATE POLICY "Creator can delete room" ON rooms FOR DELETE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Members can read members" ON room_members;
CREATE POLICY "Members can read members" ON room_members FOR SELECT
  USING (room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can join room" ON room_members;
CREATE POLICY "Users can join room" ON room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave room" ON room_members;
CREATE POLICY "Users can leave room" ON room_members FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can read tracks" ON room_tracks;
CREATE POLICY "Members can read tracks" ON room_tracks FOR SELECT
  USING (room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Members can add tracks" ON room_tracks;
CREATE POLICY "Members can add tracks" ON room_tracks FOR INSERT
  WITH CHECK (auth.uid() = added_by AND room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Members can remove tracks" ON room_tracks;
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
-- 6. MIXTAPES
-- ============================================================

CREATE TABLE IF NOT EXISTS mixtapes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  is_public       BOOLEAN DEFAULT true,
  theme           TEXT DEFAULT '',
  cover_art_index SMALLINT DEFAULT NULL,
  featured_at     TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mixtapes_user ON mixtapes(user_id);

CREATE TABLE IF NOT EXISTS mixtape_tracks (
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
  added_by_name TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mixtape_tracks_mixtape ON mixtape_tracks(mixtape_id);

ALTER TABLE mixtapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mixtape_tracks ENABLE ROW LEVEL SECURITY;

-- Mixtape policies (base versions — section 11 will replace these)
DROP POLICY IF EXISTS "Public mixtapes are viewable" ON mixtapes;
CREATE POLICY "Public mixtapes are viewable" ON mixtapes
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own mixtapes" ON mixtapes;
CREATE POLICY "Users can create own mixtapes" ON mixtapes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own mixtapes" ON mixtapes;
CREATE POLICY "Users can update own mixtapes" ON mixtapes
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own mixtapes" ON mixtapes;
CREATE POLICY "Users can delete own mixtapes" ON mixtapes
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tracks viewable if mixtape is viewable" ON mixtape_tracks;
CREATE POLICY "Tracks viewable if mixtape is viewable" ON mixtape_tracks
  FOR SELECT USING (
    mixtape_id IN (SELECT id FROM mixtapes WHERE is_public = true OR user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Owner can add tracks" ON mixtape_tracks;
CREATE POLICY "Owner can add tracks" ON mixtape_tracks
  FOR INSERT WITH CHECK (
    mixtape_id IN (SELECT id FROM mixtapes WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Anyone can add tracks to public mixtapes" ON mixtape_tracks;
CREATE POLICY "Anyone can add tracks to public mixtapes" ON mixtape_tracks
  FOR INSERT WITH CHECK (
    mixtape_id IN (SELECT id FROM mixtapes WHERE is_public = true)
  );
DROP POLICY IF EXISTS "Owner can update tracks" ON mixtape_tracks;
CREATE POLICY "Owner can update tracks" ON mixtape_tracks
  FOR UPDATE USING (
    mixtape_id IN (SELECT id FROM mixtapes WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Owner can delete tracks" ON mixtape_tracks;
CREATE POLICY "Owner can delete tracks" ON mixtape_tracks
  FOR DELETE USING (
    mixtape_id IN (SELECT id FROM mixtapes WHERE user_id = auth.uid())
  );

-- ============================================================
-- 7. MIXTAPE COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS mixtape_comments (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mixtape_id UUID NOT NULL REFERENCES mixtapes(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  body       VARCHAR(140) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mixtape_comments_mixtape ON mixtape_comments(mixtape_id);

ALTER TABLE mixtape_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments readable on public mixtapes" ON mixtape_comments;
CREATE POLICY "Comments readable on public mixtapes" ON mixtape_comments
  FOR SELECT USING (
    mixtape_id IN (SELECT id FROM mixtapes WHERE is_public = true)
    OR mixtape_id IN (SELECT id FROM mixtapes WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Anyone can comment on public mixtapes" ON mixtape_comments;
CREATE POLICY "Anyone can comment on public mixtapes" ON mixtape_comments
  FOR INSERT WITH CHECK (
    mixtape_id IN (SELECT id FROM mixtapes WHERE is_public = true)
  );
DROP POLICY IF EXISTS "Owner or author can delete comments" ON mixtape_comments;
CREATE POLICY "Owner or author can delete comments" ON mixtape_comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR mixtape_id IN (SELECT id FROM mixtapes WHERE user_id = auth.uid())
  );

-- ============================================================
-- 8. MIXTAPE TRADES
-- ============================================================

CREATE TABLE IF NOT EXISTS mixtape_trades (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_mixtape_id   UUID NOT NULL REFERENCES mixtapes(id) ON DELETE CASCADE,
  receiver_mixtape_id UUID REFERENCES mixtapes(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'completed', 'declined')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_trades_sender ON mixtape_trades(sender_id);
CREATE INDEX IF NOT EXISTS idx_trades_receiver ON mixtape_trades(receiver_id);

ALTER TABLE mixtape_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own trades" ON mixtape_trades;
CREATE POLICY "Users can read own trades" ON mixtape_trades
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users can send trades" ON mixtape_trades;
CREATE POLICY "Users can send trades" ON mixtape_trades
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND status = 'pending');
DROP POLICY IF EXISTS "Receiver can respond to trade" ON mixtape_trades;
CREATE POLICY "Receiver can respond to trade" ON mixtape_trades
  FOR UPDATE USING (auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Sender can cancel pending trade" ON mixtape_trades;
CREATE POLICY "Sender can cancel pending trade" ON mixtape_trades
  FOR DELETE USING (auth.uid() = sender_id AND status = 'pending');

-- ============================================================
-- 9. MIXTAPE OF THE WEEK
-- ============================================================

CREATE OR REPLACE FUNCTION get_mixtape_of_the_week()
RETURNS TABLE (
  id UUID, title TEXT, theme TEXT, cover_art_index SMALLINT,
  user_id UUID, display_name TEXT, slug TEXT,
  track_count BIGINT, comment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.title, m.theme, m.cover_art_index,
    m.user_id, p.display_name, p.slug,
    (SELECT COUNT(*) FROM mixtape_tracks mt WHERE mt.mixtape_id = m.id),
    (SELECT COUNT(*) FROM mixtape_comments mc WHERE mc.mixtape_id = m.id)
  FROM mixtapes m JOIN profiles p ON p.id = m.user_id
  WHERE m.is_public = true AND m.featured_at IS NOT NULL
    AND m.featured_at > NOW() - INTERVAL '7 days'
  ORDER BY m.featured_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT m.id, m.title, m.theme, m.cover_art_index,
      m.user_id, p.display_name, p.slug,
      (SELECT COUNT(*) FROM mixtape_tracks mt WHERE mt.mixtape_id = m.id),
      COALESCE(cc.cnt, 0)
    FROM mixtapes m JOIN profiles p ON p.id = m.user_id
    LEFT JOIN (
      SELECT mc.mixtape_id, COUNT(*) AS cnt FROM mixtape_comments mc
      WHERE mc.created_at > NOW() - INTERVAL '7 days' GROUP BY mc.mixtape_id
    ) cc ON cc.mixtape_id = m.id
    WHERE m.is_public = true
      AND (SELECT COUNT(*) FROM mixtape_tracks mt WHERE mt.mixtape_id = m.id) >= 3
    ORDER BY cc.cnt DESC NULLS LAST, m.created_at DESC LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. BOOTH CUSTOMIZATION
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_style TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_text TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_submission_ids BIGINT[] DEFAULT '{}';

-- ============================================================
-- 11. COLLABORATIVE MIXTAPES
-- ============================================================

ALTER TABLE mixtapes ADD COLUMN IF NOT EXISTS is_collab BOOLEAN DEFAULT false;
ALTER TABLE mixtapes ADD COLUMN IF NOT EXISTS collab_mode TEXT DEFAULT 'open';
ALTER TABLE mixtapes ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE DEFAULT NULL;
ALTER TABLE mixtapes ADD COLUMN IF NOT EXISTS max_collaborators SMALLINT DEFAULT 4;

ALTER TABLE mixtape_tracks ADD COLUMN IF NOT EXISTS added_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Helper functions (SECURITY DEFINER) to break circular RLS references
-- between mixtapes and mixtape_collaborators.
CREATE OR REPLACE FUNCTION is_mixtape_owner(mid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM mixtapes WHERE id = mid AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_mixtape_collaborator(mid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM mixtape_collaborators WHERE mixtape_id = mid AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS mixtape_collaborators (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mixtape_id UUID NOT NULL REFERENCES mixtapes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  turn_order SMALLINT NOT NULL DEFAULT 0,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mixtape_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mixtape_collabs_mixtape ON mixtape_collaborators(mixtape_id);

ALTER TABLE mixtape_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Collaborators can read collaborators" ON mixtape_collaborators;
CREATE POLICY "Collaborators can read collaborators" ON mixtape_collaborators
  FOR SELECT USING (
    mixtape_id IN (SELECT mixtape_id FROM mixtape_collaborators WHERE user_id = auth.uid())
    OR is_mixtape_owner(mixtape_id)
  );

DROP POLICY IF EXISTS "Users can join mixtape" ON mixtape_collaborators;
CREATE POLICY "Users can join mixtape" ON mixtape_collaborators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave or owner can remove" ON mixtape_collaborators;
CREATE POLICY "Users can leave or owner can remove" ON mixtape_collaborators
  FOR DELETE USING (
    auth.uid() = user_id
    OR is_mixtape_owner(mixtape_id)
  );

-- Update mixtape policies to include collaborators
DROP POLICY IF EXISTS "Public mixtapes are viewable" ON mixtapes;
DROP POLICY IF EXISTS "Public or collab mixtapes are viewable" ON mixtapes;
CREATE POLICY "Public or collab mixtapes are viewable" ON mixtapes
  FOR SELECT USING (
    is_public = true
    OR auth.uid() = user_id
    OR is_mixtape_collaborator(id)
  );

DROP POLICY IF EXISTS "Owner can add tracks" ON mixtape_tracks;
DROP POLICY IF EXISTS "Anyone can add tracks to public mixtapes" ON mixtape_tracks;
DROP POLICY IF EXISTS "Owner or collaborator can add tracks" ON mixtape_tracks;
CREATE POLICY "Owner or collaborator can add tracks" ON mixtape_tracks
  FOR INSERT WITH CHECK (
    is_mixtape_owner(mixtape_id)
    OR is_mixtape_collaborator(mixtape_id)
    OR mixtape_id IN (SELECT id FROM mixtapes WHERE is_public = true)
  );

DROP POLICY IF EXISTS "Tracks viewable if mixtape is viewable" ON mixtape_tracks;
CREATE POLICY "Tracks viewable if mixtape is viewable" ON mixtape_tracks
  FOR SELECT USING (
    mixtape_id IN (SELECT id FROM mixtapes WHERE is_public = true OR user_id = auth.uid())
    OR is_mixtape_collaborator(mixtape_id)
  );

DROP POLICY IF EXISTS "Owner can update tracks" ON mixtape_tracks;
DROP POLICY IF EXISTS "Owner or track author can update tracks" ON mixtape_tracks;
CREATE POLICY "Owner or track author can update tracks" ON mixtape_tracks
  FOR UPDATE USING (
    is_mixtape_owner(mixtape_id)
    OR (added_by_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owner can delete tracks" ON mixtape_tracks;
DROP POLICY IF EXISTS "Owner or track author can delete tracks" ON mixtape_tracks;
CREATE POLICY "Owner or track author can delete tracks" ON mixtape_tracks
  FOR DELETE USING (
    is_mixtape_owner(mixtape_id)
    OR (added_by_user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION join_mixtape_by_invite(code TEXT)
RETURNS UUID AS $$
DECLARE
  target_mixtape_id UUID;
  current_count INT;
  max_collabs INT;
BEGIN
  SELECT id, max_collaborators INTO target_mixtape_id, max_collabs
    FROM mixtapes WHERE invite_code = code AND is_collab = true;
  IF target_mixtape_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT COUNT(*) INTO current_count
    FROM mixtape_collaborators WHERE mixtape_id = target_mixtape_id;

  IF current_count >= (max_collabs - 1) THEN
    RAISE EXCEPTION 'Mixtape is full';
  END IF;

  IF auth.uid() = (SELECT user_id FROM mixtapes WHERE id = target_mixtape_id) THEN
    RETURN target_mixtape_id;
  END IF;

  INSERT INTO mixtape_collaborators (mixtape_id, user_id, turn_order)
    VALUES (target_mixtape_id, auth.uid(), current_count + 1)
    ON CONFLICT (mixtape_id, user_id) DO NOTHING;

  RETURN target_mixtape_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
