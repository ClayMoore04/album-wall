import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import NavBar from "./NavBar";
import MixtapeCoverArt from "./MixtapeCoverArt";

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MixtapeListPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mixtapes, setMixtapes] = useState([]);
  const [loadingMixtapes, setLoadingMixtapes] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!supabase || !user) return;
    loadMixtapes();
  }, [user]);

  const loadMixtapes = async () => {
    if (!supabase || !user) return;
    setLoadingMixtapes(true);

    const { data } = await supabase
      .from("mixtapes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const mixtapesWithStats = await Promise.all(
      (data || []).map(async (m) => {
        const { data: tracks } = await supabase
          .from("mixtape_tracks")
          .select("duration_ms, album_art_url")
          .eq("mixtape_id", m.id)
          .order("position", { ascending: true });
        const totalMs = (tracks || []).reduce((sum, t) => sum + t.duration_ms, 0);
        return {
          ...m,
          trackCount: tracks?.length || 0,
          totalMs,
          tracks: tracks || [],
        };
      })
    );

    setMixtapes(mixtapesWithStats);
    setLoadingMixtapes(false);
  };

  const handleCreate = async () => {
    if (!supabase || !user || !newTitle.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("mixtapes")
        .insert({ title: newTitle.trim(), user_id: user.id })
        .select()
        .single();
      if (insertError) throw insertError;
      navigate(`/mixtape/${data.id}`);
    } catch (e) {
      console.error("Create mixtape failed:", e);
      setError("Failed to create mixtape");
      setCreating(false);
    }
  };

  if (loading || !user) {
    return (
      <div
        style={{ textAlign: "center", padding: 80, color: palette.textMuted }}
      >
        Loading...
      </div>
    );
  }

  const inputStyle = {
    flex: 1,
    padding: "10px 14px",
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    color: palette.text,
    fontSize: 14,
    fontFamily: "'Syne', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const btnStyle = {
    padding: "10px 18px",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
    cursor: "pointer",
    background: palette.accent,
    color: "#000",
    flexShrink: 0,
  };

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 0" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Mixtapes<span style={{ color: palette.coral }}>.</span>
        </h1>
        <p
          style={{
            textAlign: "center",
            color: palette.textMuted,
            fontSize: 14,
            fontFamily: "'Space Mono', monospace",
            marginBottom: 28,
          }}
        >
          90 minutes. Liner notes. Your tape.
        </p>

        {/* Create mixtape */}
        <div
          style={{
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Name your mixtape..."
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              style={inputStyle}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
              style={{
                ...btnStyle,
                opacity: creating || !newTitle.trim() ? 0.5 : 1,
              }}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: palette.coral,
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Mixtape list */}
        {loadingMixtapes ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: palette.textMuted,
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            Loading mixtapes...
          </div>
        ) : mixtapes.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: palette.textMuted,
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            No mixtapes yet. Create your first one.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mixtapes.map((mixtape) => (
              <Link
                key={mixtape.id}
                to={`/mixtape/${mixtape.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  background: palette.cardBg,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 12,
                  textDecoration: "none",
                  color: palette.text,
                  transition: "border-color 0.2s",
                }}
              >
                <MixtapeCoverArt
                  tracks={mixtape.tracks}
                  coverArtIndex={mixtape.cover_art_index}
                  size={56}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {mixtape.title}
                  </div>
                  {mixtape.theme && (
                    <div
                      style={{
                        fontSize: 11,
                        color: palette.coral,
                        fontFamily: "'Space Mono', monospace",
                        fontStyle: "italic",
                        marginTop: 2,
                      }}
                    >
                      for: {mixtape.theme}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: palette.textMuted,
                      fontFamily: "'Space Mono', monospace",
                      marginTop: 4,
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    <span>
                      {mixtape.trackCount} track
                      {mixtape.trackCount !== 1 ? "s" : ""}
                    </span>
                    <span>{formatMs(mixtape.totalMs)}</span>
                  </div>
                </div>
                <span
                  style={{
                    color: palette.coral,
                    fontSize: 18,
                    fontWeight: 300,
                  }}
                >
                  {"\u2192"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
