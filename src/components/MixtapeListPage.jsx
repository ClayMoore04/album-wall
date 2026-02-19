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

function generateInviteCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function MixtapeListPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mixtapes, setMixtapes] = useState([]);
  const [loadingMixtapes, setLoadingMixtapes] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState(null);

  // Collab creation options
  const [isCollab, setIsCollab] = useState(false);
  const [collabMode, setCollabMode] = useState("open");
  const [maxCollaborators, setMaxCollaborators] = useState(4);

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

    // Load owned mixtapes
    const { data } = await supabase
      .from("mixtapes")
      .select("*, profiles!user_id(display_name, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const ownedWithStats = await Promise.all(
      (data || []).map(async (m) => {
        const { data: tracks } = await supabase
          .from("mixtape_tracks")
          .select("duration_ms, album_art_url")
          .eq("mixtape_id", m.id)
          .order("position", { ascending: true });
        const totalMs = (tracks || []).reduce(
          (sum, t) => sum + t.duration_ms,
          0
        );
        return {
          ...m,
          trackCount: tracks?.length || 0,
          totalMs,
          tracks: tracks || [],
          isJoined: false,
        };
      })
    );

    // Load collab mixtapes user has joined
    const { data: collabMemberships } = await supabase
      .from("mixtape_collaborators")
      .select("mixtape_id")
      .eq("user_id", user.id);

    let collabMixtapes = [];
    if (collabMemberships?.length) {
      const collabIds = collabMemberships.map((m) => m.mixtape_id);
      // Filter out any the user also owns
      const ownedIds = new Set((data || []).map((m) => m.id));
      const joinedIds = collabIds.filter((id) => !ownedIds.has(id));

      if (joinedIds.length) {
        const { data: collabData } = await supabase
          .from("mixtapes")
          .select("*, profiles!user_id(display_name, slug)")
          .in("id", joinedIds)
          .order("created_at", { ascending: false });

        collabMixtapes = await Promise.all(
          (collabData || []).map(async (m) => {
            const { data: tracks } = await supabase
              .from("mixtape_tracks")
              .select("duration_ms, album_art_url")
              .eq("mixtape_id", m.id)
              .order("position", { ascending: true });
            const totalMs = (tracks || []).reduce(
              (sum, t) => sum + t.duration_ms,
              0
            );
            return {
              ...m,
              trackCount: tracks?.length || 0,
              totalMs,
              tracks: tracks || [],
              isJoined: true,
            };
          })
        );
      }
    }

    const allMixtapes = [...ownedWithStats, ...collabMixtapes].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    setMixtapes(allMixtapes);
    setLoadingMixtapes(false);
  };

  const handleCreate = async () => {
    if (!supabase || !user || !newTitle.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const insertData = {
        title: newTitle.trim(),
        user_id: user.id,
        is_collab: isCollab,
      };
      if (isCollab) {
        insertData.collab_mode = collabMode;
        insertData.max_collaborators = maxCollaborators;
        insertData.invite_code = generateInviteCode();
      }
      const { data, error: insertError } = await supabase
        .from("mixtapes")
        .insert(insertData)
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

  const smallLabelStyle = {
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Space Mono', monospace",
    color: palette.textMuted,
    letterSpacing: 0.5,
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

          {/* Collab toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 12,
            }}
          >
            <button
              onClick={() => setIsCollab(!isCollab)}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                border: "none",
                background: isCollab ? palette.accent : palette.border,
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: isCollab ? 19 : 3,
                  transition: "left 0.2s",
                }}
              />
            </button>
            <span style={smallLabelStyle}>Collab tape</span>
          </div>

          {/* Collab options */}
          {isCollab && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                background: palette.surface,
                borderRadius: 8,
                border: `1px solid ${palette.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Mode selector */}
              <div>
                <div style={{ ...smallLabelStyle, marginBottom: 6 }}>Mode</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["open", "turns"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setCollabMode(mode)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1px solid ${collabMode === mode ? palette.accent : palette.border}`,
                        background:
                          collabMode === mode
                            ? "rgba(29,185,84,0.1)"
                            : "transparent",
                        color:
                          collabMode === mode ? palette.accent : palette.text,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "'Space Mono', monospace",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {mode === "open" ? "Open" : "Strict turns"}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: palette.textDim,
                    fontFamily: "'Space Mono', monospace",
                    marginTop: 4,
                  }}
                >
                  {collabMode === "open"
                    ? "Anyone can add tracks anytime"
                    : "Alternate picks, one at a time"}
                </div>
              </div>

              {/* Max collaborators */}
              <div>
                <div style={{ ...smallLabelStyle, marginBottom: 6 }}>
                  Max people
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxCollaborators(n)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: `1px solid ${maxCollaborators === n ? palette.accent : palette.border}`,
                        background:
                          maxCollaborators === n
                            ? "rgba(29,185,84,0.1)"
                            : "transparent",
                        color:
                          maxCollaborators === n
                            ? palette.accent
                            : palette.text,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "'Space Mono', monospace",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {mixtape.title}
                    {mixtape.is_collab && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "'Space Mono', monospace",
                          color: palette.coral,
                          background: "rgba(255,107,107,0.1)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                          flexShrink: 0,
                        }}
                      >
                        COLLAB
                      </span>
                    )}
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
                  {mixtape.isJoined && mixtape.profiles && (
                    <div
                      style={{
                        fontSize: 10,
                        color: palette.textDim,
                        fontFamily: "'Space Mono', monospace",
                        marginTop: 2,
                      }}
                    >
                      by {mixtape.profiles.display_name}
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
