import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import { THEMES, BANNER_PRESETS, getBannerCss } from "../lib/themes";
import ActivityFeed from "./ActivityFeed";
import TapeTradeInbox from "./TapeTradeInbox";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, loadProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ total: 0, listened: 0 });
  const [following, setFollowing] = useState([]);
  const [discoverable, setDiscoverable] = useState(false);
  const [theme, setTheme] = useState("default");
  const [bannerStyle, setBannerStyle] = useState("none");
  const [bannerUrl, setBannerUrl] = useState("");
  const [statusText, setStatusText] = useState("");
  const [roomCount, setRoomCount] = useState(0);
  const [mixtapeCount, setMixtapeCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio || "");
      setDiscoverable(profile.discoverable || false);
      setTheme(profile.theme || "default");
      setBannerStyle(profile.banner_style || "none");
      setBannerUrl(profile.banner_url || "");
      setStatusText(profile.status_text || "");
      loadStats(profile.id);
      loadFollowing(user.id);
      loadRoomCount(user.id);
      loadMixtapeCount(user.id);
    }
  }, [profile]);

  const loadStats = async (wallId) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("submissions")
      .select("listened")
      .eq("wall_id", wallId);
    if (data) {
      setStats({
        total: data.length,
        listened: data.filter((s) => s.listened).length,
      });
    }
  };

  const loadFollowing = async (userId) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("follows")
      .select("following_id, profiles!following_id(id, slug, display_name)")
      .eq("follower_id", userId);
    setFollowing(data || []);
  };

  const loadRoomCount = async (userId) => {
    if (!supabase) return;
    const { count } = await supabase
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    setRoomCount(count || 0);
  };

  const loadMixtapeCount = async (userId) => {
    if (!supabase) return;
    const { count } = await supabase
      .from("mixtapes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    setMixtapeCount(count || 0);
  };

  const handleUnfollow = async (followingId) => {
    if (!supabase || !user) return;
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);
    setFollowing((prev) => prev.filter((f) => f.following_id !== followingId));
  };

  const handleDiscoverableToggle = async () => {
    if (!supabase || !user) return;
    const newVal = !discoverable;
    setDiscoverable(newVal);
    await supabase
      .from("profiles")
      .update({ discoverable: newVal })
      .eq("id", user.id);
  };

  const handleSave = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          theme,
          banner_style: bannerStyle === "none" ? null : bannerStyle,
          banner_url: bannerUrl.trim() || null,
          status_text: statusText.trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      await loadProfile(user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to update profile:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div
        style={{ textAlign: "center", padding: 80, color: palette.textMuted }}
      >
        Loading...
      </div>
    );
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    color: palette.text,
    fontSize: 14,
    fontFamily: "'Syne', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: palette.textMuted,
    fontFamily: "'Space Mono', monospace",
    marginBottom: 6,
    letterSpacing: "0.03em",
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <button
          onClick={signOut}
          style={{
            padding: "6px 14px",
            border: `1px solid ${palette.border}`,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            background: "transparent",
            color: palette.textMuted,
          }}
        >
          Log out
        </button>
      </div>

      {/* Wall link */}
      <div
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={labelStyle}>Your Booth</div>
        <Link
          to={`/${profile.slug}`}
          style={{
            color: palette.accent,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            textDecoration: "none",
          }}
        >
          thebooth.vercel.app/{profile.slug}
        </Link>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 12,
            fontSize: 13,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          <span style={{ color: palette.textMuted }}>
            {stats.total} album{stats.total !== 1 ? "s" : ""}
          </span>
          <span style={{ color: palette.accent }}>
            {stats.listened} listened
          </span>
        </div>
      </div>

      {/* Profile settings */}
      <div
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 20,
            marginTop: 0,
          }}
        >
          Profile Settings
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell visitors about your booth..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
          />
        </div>

        {/* Discoverable toggle */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              ...labelStyle,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              marginBottom: 0,
            }}
            onClick={handleDiscoverableToggle}
          >
            <div
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: discoverable ? palette.accent : palette.border,
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  background: "#fff",
                  position: "absolute",
                  top: 2,
                  left: discoverable ? 18 : 2,
                  transition: "left 0.2s",
                }}
              />
            </div>
            List on Discovery
          </label>
          <div
            style={{
              fontSize: 11,
              color: palette.textDim,
              fontFamily: "'Space Mono', monospace",
              marginTop: 4,
              marginLeft: 46,
            }}
          >
            Let others find your booth on the Discover page
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: saving ? "not-allowed" : "pointer",
            background: palette.accent,
            color: "#000",
            opacity: saving ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Customize Your Booth */}
      <div
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 20,
          marginTop: 24,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 20,
            marginTop: 0,
          }}
        >
          Customize Your Booth
        </h2>

        {/* Theme picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Theme</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                title={t.name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  border:
                    theme === key
                      ? `2px solid ${palette.text}`
                      : `2px solid ${palette.border}`,
                  background: t.accent,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  transform: theme === key ? "scale(1.15)" : "scale(1)",
                  boxShadow:
                    theme === key
                      ? `0 0 12px ${t.accent}66`
                      : "none",
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 11,
              color: palette.textDim,
              fontFamily: "'Space Mono', monospace",
              marginTop: 6,
            }}
          >
            {THEMES[theme]?.name || "Default"}
          </div>
        </div>

        {/* Status text */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Status</label>
          <input
            type="text"
            value={statusText}
            onChange={(e) =>
              e.target.value.length <= 100 && setStatusText(e.target.value)
            }
            placeholder='e.g. "currently spinning Blonde on repeat"'
            style={inputStyle}
          />
          <div
            style={{
              fontSize: 10,
              color: palette.textDim,
              fontFamily: "'Space Mono', monospace",
              marginTop: 4,
              textAlign: "right",
            }}
          >
            {statusText.length}/100
          </div>
        </div>

        {/* Banner picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Banner</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {BANNER_PRESETS.map((b) => (
              <button
                key={b.key}
                onClick={() => {
                  setBannerStyle(b.key);
                  if (b.key !== "none") setBannerUrl("");
                }}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border:
                    bannerStyle === b.key && !bannerUrl
                      ? `2px solid ${palette.text}`
                      : `2px solid ${palette.border}`,
                  background:
                    b.css === "none" ? palette.surface : b.css,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {b.key === "none" && (
                  <span
                    style={{
                      fontSize: 10,
                      color: palette.textDim,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    None
                  </span>
                )}
              </button>
            ))}
          </div>
          <div
            style={{
              fontSize: 11,
              color: palette.textDim,
              fontFamily: "'Space Mono', monospace",
              marginTop: 6,
            }}
          >
            {BANNER_PRESETS.find((b) => b.key === bannerStyle)?.label || "None"}
          </div>

          {/* Custom banner URL */}
          <div style={{ marginTop: 10 }}>
            <label
              style={{
                ...labelStyle,
                fontSize: 10,
                color: palette.textDim,
              }}
            >
              Or paste an image URL
            </label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => {
                setBannerUrl(e.target.value);
                if (e.target.value) setBannerStyle("none");
              }}
              placeholder="https://..."
              style={{ ...inputStyle, fontSize: 12 }}
            />
          </div>
        </div>

        {/* Banner preview */}
        {(bannerStyle !== "none" || bannerUrl) && (
          <div style={{ marginBottom: 10 }}>
            <label style={{ ...labelStyle, fontSize: 10 }}>Preview</label>
            <div
              style={{
                height: 60,
                borderRadius: 8,
                background: getBannerCss(bannerStyle, bannerUrl),
                border: `1px solid ${palette.border}`,
              }}
            />
          </div>
        )}
      </div>

      {/* Collaborative Rooms */}
      <div
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 20,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            Collaborative Rooms
          </h2>
          <Link
            to="/rooms"
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              color: palette.accent,
              textDecoration: "none",
            }}
          >
            {roomCount > 0
              ? `${roomCount} room${roomCount !== 1 ? "s" : ""}`
              : "Create one"}
            {" \u2192"}
          </Link>
        </div>
        <p
          style={{
            fontSize: 12,
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            margin: "8px 0 0",
          }}
        >
          Build collaborative playlists with friends in real time.
        </p>
      </div>

      {/* Mixtapes */}
      <div
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 20,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            Mixtapes
          </h2>
          <Link
            to="/mixtapes"
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              color: palette.coral,
              textDecoration: "none",
            }}
          >
            {mixtapeCount > 0
              ? `${mixtapeCount} tape${mixtapeCount !== 1 ? "s" : ""}`
              : "Make one"}
            {" \u2192"}
          </Link>
        </div>
        <p
          style={{
            fontSize: 12,
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            margin: "8px 0 0",
          }}
        >
          90 minutes. Liner notes. Export to Spotify.
        </p>
      </div>

      {/* Tape Trades */}
      <div
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 20,
          marginTop: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
          Tape Trades
        </h2>
        <TapeTradeInbox />
      </div>

      {/* Following */}
      <div
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 20,
          marginTop: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
          Following
        </h2>
        {following.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
              margin: 0,
            }}
          >
            You're not following any walls yet.{" "}
            <Link
              to="/discover"
              style={{ color: palette.accent, textDecoration: "none" }}
            >
              Discover booths
            </Link>
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {following.map((f) => (
              <div
                key={f.following_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: palette.surface,
                  borderRadius: 8,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <Link
                  to={`/${f.profiles.slug}`}
                  style={{
                    color: palette.text,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {f.profiles.display_name}
                </Link>
                <button
                  onClick={() => handleUnfollow(f.following_id)}
                  style={{
                    padding: "4px 10px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 6,
                    background: "transparent",
                    color: palette.textMuted,
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  Unfollow
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      {following.length > 0 && (
        <div
          style={{
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 20,
            marginTop: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
            Activity Feed
          </h2>
          <ActivityFeed
            followedWallIds={following.map((f) => f.following_id)}
          />
        </div>
      )}
    </div>
  );
}
