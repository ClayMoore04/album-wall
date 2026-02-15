import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, loadProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ total: 0, listened: 0 });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio || "");
      loadStats(profile.id);
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

  const handleSave = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), bio: bio.trim() })
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
        <div style={labelStyle}>Your Wall</div>
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
          albumwall.vercel.app/{profile.slug}
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
            placeholder="Tell visitors about your wall..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
          />
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
    </div>
  );
}
