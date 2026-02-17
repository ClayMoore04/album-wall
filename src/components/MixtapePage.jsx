import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import {
  startSpotifyAuth,
  getValidAccessToken,
  isSpotifyConnected,
  clearTokens,
} from "../lib/spotifyAuth";
import NavBar from "./NavBar";
import SpotifySearch from "./SpotifySearch";
import MixtapeTrackCard from "./MixtapeTrackCard";
import MixtapeCoverArt from "./MixtapeCoverArt";
import MixtapeComments from "./MixtapeComments";
import TapeTradeButton from "./TapeTradeButton";

const MAX_DURATION_MS = 90 * 60 * 1000; // 90 minutes

function formatMs(ms) {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MixtapePage() {
  const { id: mixtapeId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [mixtape, setMixtape] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loadingMixtape, setLoadingMixtape] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingTheme, setEditingTheme] = useState(false);
  const [themeValue, setThemeValue] = useState("");
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesValue, setNotesValue] = useState("");
  const [tapeWarning, setTapeWarning] = useState(null);
  const [contributorName, setContributorName] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [topPlayerIndex, setTopPlayerIndex] = useState(null);
  const [copiedTracks, setCopiedTracks] = useState(false);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState(null);

  // Load mixtape data
  useEffect(() => {
    if (!supabase || !mixtapeId) return;
    let cancelled = false;

    (async () => {
      const { data: mixtapeData, error: mixtapeError } = await supabase
        .from("mixtapes")
        .select("*, profiles!user_id(display_name, slug)")
        .eq("id", mixtapeId)
        .single();

      if (mixtapeError || !mixtapeData) {
        if (!cancelled) setNotFound(true);
        setLoadingMixtape(false);
        return;
      }
      if (!cancelled) {
        setMixtape(mixtapeData);
        setTitleValue(mixtapeData.title);
        setThemeValue(mixtapeData.theme || "");
        setPlaylistName(mixtapeData.title);
      }

      const { data: trackData } = await supabase
        .from("mixtape_tracks")
        .select("*")
        .eq("mixtape_id", mixtapeId)
        .order("position", { ascending: true });

      if (!cancelled) {
        setTracks(trackData || []);
        setLoadingMixtape(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mixtapeId]);

  const totalMs = tracks.reduce((sum, t) => sum + t.duration_ms, 0);
  const remainingMs = MAX_DURATION_MS - totalMs;
  const isOwner = user && mixtape && user.id === mixtape.user_id;
  const connected = isSpotifyConnected();

  // Side A / Side B split at 45 minutes
  const SIDE_DURATION_MS = 45 * 60 * 1000;
  let sideBStartIndex = tracks.length;
  {
    let cumMs = 0;
    for (let i = 0; i < tracks.length; i++) {
      if (cumMs >= SIDE_DURATION_MS) {
        sideBStartIndex = i;
        break;
      }
      cumMs += tracks[i].duration_ms;
    }
  }
  const sideATracks = tracks.slice(0, sideBStartIndex);
  const sideBTracks = tracks.slice(sideBStartIndex);
  const sideAMs = sideATracks.reduce((s, t) => s + t.duration_ms, 0);
  const sideBMs = sideBTracks.reduce((s, t) => s + t.duration_ms, 0);

  // Add track
  const handleAddTrack = useCallback(
    async (item) => {
      if (!supabase || !mixtapeId) return;

      const newTotalMs = totalMs + (item.durationMs || 0);
      if (newTotalMs > MAX_DURATION_MS) {
        setTapeWarning(
          `Tape is full! Adding this puts you at ${formatMs(newTotalMs)}`
        );
        setTimeout(() => setTapeWarning(null), 3000);
      }

      const nextPosition = tracks.length;

      const { data, error } = await supabase
        .from("mixtape_tracks")
        .insert({
          mixtape_id: mixtapeId,
          position: nextPosition,
          track_name: item.name,
          artist_name: item.artist,
          album_name: item.albumName || "",
          album_art_url: item.imageUrl || "",
          spotify_url: item.spotifyUrl || "",
          spotify_id: item.id,
          duration_ms: item.durationMs || 0,
          added_by_name: isOwner ? "" : contributorName.trim(),
        })
        .select()
        .single();

      if (!error && data) {
        setTracks((prev) => [...prev, data]);
      }
    },
    [mixtapeId, tracks.length, totalMs, isOwner, contributorName]
  );

  // Remove track
  const handleRemove = async (trackId) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("mixtape_tracks")
      .delete()
      .eq("id", trackId);
    if (!error) {
      setTracks((prev) => {
        const updated = prev.filter((t) => t.id !== trackId);
        // Reassign positions
        return updated.map((t, i) => ({ ...t, position: i }));
      });
      // Update positions in DB
      const remaining = tracks.filter((t) => t.id !== trackId);
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from("mixtape_tracks")
          .update({ position: i })
          .eq("id", remaining[i].id);
      }
    }
  };

  // Reorder
  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= tracks.length) return;

    const newTracks = [...tracks];
    [newTracks[index], newTracks[targetIndex]] = [
      newTracks[targetIndex],
      newTracks[index],
    ];
    const updated = newTracks.map((t, i) => ({ ...t, position: i }));
    setTracks(updated);

    // Update both swapped tracks in DB
    await Promise.all([
      supabase
        .from("mixtape_tracks")
        .update({ position: updated[index].position })
        .eq("id", updated[index].id),
      supabase
        .from("mixtape_tracks")
        .update({ position: updated[targetIndex].position })
        .eq("id", updated[targetIndex].id),
    ]);
  };

  // Save liner notes
  const handleSaveNotes = async () => {
    if (!supabase || !editingNotesId) return;
    await supabase
      .from("mixtape_tracks")
      .update({ liner_notes: notesValue })
      .eq("id", editingNotesId);
    setTracks((prev) =>
      prev.map((t) =>
        t.id === editingNotesId ? { ...t, liner_notes: notesValue } : t
      )
    );
    setEditingNotesId(null);
  };

  // Save title
  const handleSaveTitle = async () => {
    if (!supabase || !mixtape || !titleValue.trim()) return;
    await supabase
      .from("mixtapes")
      .update({ title: titleValue.trim(), updated_at: new Date().toISOString() })
      .eq("id", mixtape.id);
    setMixtape((prev) => ({ ...prev, title: titleValue.trim() }));
    setEditingTitle(false);
  };

  // Save theme
  const handleSaveTheme = async () => {
    if (!supabase || !mixtape) return;
    await supabase
      .from("mixtapes")
      .update({ theme: themeValue.trim(), updated_at: new Date().toISOString() })
      .eq("id", mixtape.id);
    setMixtape((prev) => ({ ...prev, theme: themeValue.trim() }));
    setEditingTheme(false);
  };

  // Change cover art
  const handleCoverChange = async (index) => {
    if (!supabase || !mixtape) return;
    await supabase
      .from("mixtapes")
      .update({ cover_art_index: index, updated_at: new Date().toISOString() })
      .eq("id", mixtape.id);
    setMixtape((prev) => ({ ...prev, cover_art_index: index }));
    setShowCoverPicker(false);
  };

  // Delete mixtape
  const handleDelete = async () => {
    if (!supabase || !mixtape) return;
    if (!window.confirm("Delete this mixtape? This cannot be undone.")) return;
    await supabase.from("mixtapes").delete().eq("id", mixtape.id);
    navigate("/mixtapes");
  };

  // Export to Spotify
  const handleExport = async () => {
    setExporting(true);
    setExportError(null);

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        setExportError("Spotify session expired. Please reconnect.");
        setExporting(false);
        return;
      }

      const res = await fetch("/api/spotify-create-mixtape-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          playlist_name: playlistName,
          description: `Mixtape: ${mixtape.title} — Created on The Booth`,
          is_public: isPublic,
          track_ids: tracks.map((t) => t.spotify_id),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create playlist");
      }

      const data = await res.json();
      setExportResult(data);
    } catch (e) {
      console.error("Export error:", e);
      setExportError(e.message || "Failed to create playlist");
    } finally {
      setExporting(false);
    }
  };

  if (loading || loadingMixtape) {
    return (
      <div
        style={{ textAlign: "center", padding: 80, color: palette.textMuted }}
      >
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Mixtape Not Found
        </h2>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          This mixtape doesn't exist or is private.
        </p>
        <button
          onClick={() => navigate("/mixtapes")}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            background: palette.accent,
            color: "#000",
          }}
        >
          Go to Mixtapes
        </button>
      </div>
    );
  }

  const progressPercent = Math.min(100, (totalMs / MAX_DURATION_MS) * 100);
  const isOverTime = totalMs > MAX_DURATION_MS;
  const isNearFull = totalMs / MAX_DURATION_MS > 0.8;

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 0" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          {/* Cover Art */}
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "center", position: "relative" }}>
            <MixtapeCoverArt
              tracks={tracks}
              coverArtIndex={mixtape.cover_art_index}
              size={120}
            />
            {isOwner && (
              <div style={{ position: "absolute", bottom: -8 }}>
                <button
                  onClick={() => setShowCoverPicker(!showCoverPicker)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    border: `1px solid ${palette.border}`,
                    background: palette.surface,
                    color: palette.textMuted,
                    fontSize: 9,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  Change cover
                </button>
                {showCoverPicker && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      marginTop: 4,
                      background: palette.surface,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 8,
                      padding: 6,
                      zIndex: 10,
                      minWidth: 180,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    <button
                      onClick={() => handleCoverChange(null)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "6px 10px",
                        border: "none",
                        background:
                          mixtape.cover_art_index === null
                            ? "rgba(29,185,84,0.15)"
                            : "transparent",
                        color: palette.text,
                        fontSize: 11,
                        fontFamily: "'Space Mono', monospace",
                        cursor: "pointer",
                        textAlign: "left",
                        borderRadius: 4,
                      }}
                    >
                      Auto collage
                    </button>
                    {tracks.map((t, i) => (
                      <button
                        key={t.id}
                        onClick={() => handleCoverChange(i)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "5px 10px",
                          border: "none",
                          background:
                            mixtape.cover_art_index === i
                              ? "rgba(29,185,84,0.15)"
                              : "transparent",
                          color: palette.text,
                          fontSize: 11,
                          fontFamily: "'Space Mono', monospace",
                          cursor: "pointer",
                          textAlign: "left",
                          borderRadius: 4,
                        }}
                      >
                        {t.album_art_url && (
                          <img
                            src={t.album_art_url}
                            alt=""
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 3,
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.track_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {editingTitle && isOwner ? (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }}>
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                autoFocus
                style={{
                  padding: "8px 14px",
                  background: palette.surface,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 10,
                  color: palette.text,
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: "'Syne', sans-serif",
                  outline: "none",
                  textAlign: "center",
                  width: "100%",
                  maxWidth: 360,
                }}
              />
              <button
                onClick={handleSaveTitle}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                  background: palette.accent,
                  color: "#000",
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: "0 0 8px",
                cursor: isOwner ? "pointer" : "default",
              }}
              onClick={() => isOwner && setEditingTitle(true)}
              title={isOwner ? "Click to edit title" : ""}
            >
              {mixtape.title}
            </h1>
          )}

          {/* Theme */}
          {editingTheme ? (
            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
                marginBottom: 6,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: palette.coral,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                for:
              </span>
              <input
                type="text"
                value={themeValue}
                onChange={(e) => setThemeValue(e.target.value.slice(0, 50))}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTheme()}
                placeholder="long drives, sunday morning..."
                autoFocus
                maxLength={50}
                style={{
                  padding: "6px 12px",
                  background: palette.surface,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 8,
                  color: palette.text,
                  fontSize: 13,
                  fontFamily: "'Space Mono', monospace",
                  outline: "none",
                  width: 200,
                }}
              />
              <button
                onClick={handleSaveTheme}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                  background: palette.accent,
                  color: "#000",
                }}
              >
                Save
              </button>
            </div>
          ) : mixtape.theme ? (
            <div
              style={{
                fontSize: 13,
                fontStyle: "italic",
                color: palette.coral,
                fontFamily: "'Space Mono', monospace",
                marginBottom: 4,
                cursor: isOwner ? "pointer" : "default",
              }}
              onClick={() => isOwner && setEditingTheme(true)}
              title={isOwner ? "Click to edit theme" : ""}
            >
              for: {mixtape.theme}
            </div>
          ) : isOwner ? (
            <button
              onClick={() => setEditingTheme(true)}
              style={{
                background: "none",
                border: "none",
                color: palette.textDim,
                fontSize: 11,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                marginBottom: 4,
                padding: 0,
              }}
            >
              + add theme
            </button>
          ) : null}

          <div
            style={{
              fontSize: 12,
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            by{" "}
            <Link
              to={`/${mixtape.profiles?.slug}`}
              style={{ color: palette.accent, textDecoration: "none" }}
            >
              {mixtape.profiles?.display_name || "Unknown"}
            </Link>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {tracks.some((t) => t.liner_notes) && (
              <Link
                to={`/mixtape/${mixtapeId}/notes`}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  border: `1px solid ${palette.border}`,
                  background: "transparent",
                  color: palette.textMuted,
                  fontSize: 10,
                  fontFamily: "'Space Mono', monospace",
                  textDecoration: "none",
                }}
              >
                Liner notes
              </Link>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: `1px solid ${palette.border}`,
                background: "transparent",
                color: copied ? palette.accent : palette.textMuted,
                fontSize: 10,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            {user && !isOwner && (
              <TapeTradeButton mixtape={mixtape} />
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  border: `1px solid ${palette.border}`,
                  background: "transparent",
                  color: palette.textDim,
                  fontSize: 10,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                }}
              >
                Delete mixtape
              </button>
            )}
          </div>
        </div>

        {/* Time Bar */}
        <div
          style={{
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
              marginBottom: 8,
            }}
          >
            <span style={{ color: palette.text, fontWeight: 700 }}>
              {formatMs(totalMs)} / 90:00
            </span>
            <span
              style={{
                color: isOverTime ? palette.coral : palette.textMuted,
              }}
            >
              {isOverTime
                ? `${formatMs(totalMs - MAX_DURATION_MS)} over!`
                : `${formatMs(remainingMs)} remaining`}
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: palette.border,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                borderRadius: 3,
                background: isNearFull ? palette.coral : palette.accent,
                transition: "width 0.3s, background 0.3s",
              }}
            />
            {/* 45-min midpoint marker */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -1,
                bottom: -1,
                width: 2,
                background: palette.textDim,
                borderRadius: 1,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              marginTop: 6,
            }}
          >
            <span style={{ color: palette.accent }}>
              SIDE A ({formatMs(sideAMs)})
            </span>
            <span style={{ color: palette.coral }}>
              SIDE B ({formatMs(sideBMs)})
            </span>
          </div>
        </div>

        {/* Top player */}
        {topPlayerIndex !== null && tracks[topPlayerIndex] && (
          <div
            style={{
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "'Space Mono', monospace",
                  color: palette.textMuted,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Now playing ({topPlayerIndex + 1}/{tracks.length})
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setTopPlayerIndex((i) => Math.max(0, i - 1))}
                  disabled={topPlayerIndex === 0}
                  style={{
                    padding: "4px 10px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 6,
                    background: "transparent",
                    color: topPlayerIndex === 0 ? palette.textDim : palette.textMuted,
                    fontSize: 11,
                    fontFamily: "'Space Mono', monospace",
                    cursor: topPlayerIndex === 0 ? "default" : "pointer",
                  }}
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setTopPlayerIndex((i) => Math.min(tracks.length - 1, i + 1))
                  }
                  disabled={topPlayerIndex === tracks.length - 1}
                  style={{
                    padding: "4px 10px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 6,
                    background: "transparent",
                    color:
                      topPlayerIndex === tracks.length - 1
                        ? palette.textDim
                        : palette.textMuted,
                    fontSize: 11,
                    fontFamily: "'Space Mono', monospace",
                    cursor:
                      topPlayerIndex === tracks.length - 1 ? "default" : "pointer",
                  }}
                >
                  Next
                </button>
                <button
                  onClick={() => setTopPlayerIndex(null)}
                  style={{
                    padding: "4px 10px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 6,
                    background: "transparent",
                    color: palette.coral,
                    fontSize: 11,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {tracks[topPlayerIndex].track_name}
              <span style={{ color: palette.textMuted, fontWeight: 400 }}>
                {" "}
                — {tracks[topPlayerIndex].artist_name}
              </span>
            </div>
            <iframe
              key={tracks[topPlayerIndex].spotify_id}
              src={`https://open.spotify.com/embed/track/${tracks[topPlayerIndex].spotify_id}?utm_source=generator&theme=0`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: 8 }}
            />
          </div>
        )}

        {/* Play all button */}
        {tracks.length > 0 && topPlayerIndex === null && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <button
              onClick={() => setTopPlayerIndex(0)}
              style={{
                padding: "8px 20px",
                border: `1px solid ${palette.border}`,
                borderRadius: 8,
                background: "transparent",
                color: palette.accent,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              ▶ Preview mixtape
            </button>
          </div>
        )}

        {/* Tape warning */}
        {tapeWarning && (
          <div
            style={{
              textAlign: "center",
              padding: "8px 14px",
              marginBottom: 12,
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
              color: palette.coral,
              background: "rgba(255,107,107,0.08)",
              border: `1px solid rgba(255,107,107,0.2)`,
              borderRadius: 8,
            }}
          >
            {tapeWarning}
          </div>
        )}

        {/* Search — open to everyone */}
        <div
          style={{
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              color: palette.textMuted,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Add a track
          </div>
          {!isOwner && (
            <input
              type="text"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              placeholder="Your name..."
              style={{
                width: "100%",
                padding: "10px 14px",
                background: palette.surface,
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                color: palette.text,
                fontSize: 14,
                fontFamily: "'Syne', sans-serif",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />
          )}
          <SpotifySearch onSelect={handleAddTrack} forceType="track" />
        </div>

        {/* Track list header */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            color: palette.textMuted,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Tracklist ({tracks.length} track{tracks.length !== 1 ? "s" : ""})
        </div>

        {/* Track list */}
        {tracks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: palette.textMuted,
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {isOwner
              ? "No tracks yet. Search and add some!"
              : "This mixtape is empty."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sideATracks.map((track, i) => {
              const index = i;
              return (
                <MixtapeTrackCard
                  key={track.id}
                  track={track}
                  index={index}
                  isOwner={isOwner}
                  isFirst={index === 0}
                  isLast={index === tracks.length - 1}
                  addedByName={track.added_by_name}
                  isPlaying={playingTrackId === track.id}
                  onPlay={() =>
                    setPlayingTrackId(
                      playingTrackId === track.id ? null : track.id
                    )
                  }
                  onMoveUp={() => handleMove(index, -1)}
                  onMoveDown={() => handleMove(index, 1)}
                  onRemove={() => handleRemove(track.id)}
                  onEditNotes={() => {
                    if (editingNotesId === track.id) {
                      handleSaveNotes();
                    } else {
                      setEditingNotesId(track.id);
                      setNotesValue(track.liner_notes || "");
                    }
                  }}
                  editingNotes={editingNotesId === track.id}
                  notesValue={notesValue}
                  onNotesChange={setNotesValue}
                  onNotesSave={handleSaveNotes}
                />
              );
            })}

            {/* Side B divider */}
            {sideBTracks.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 0",
                  margin: "8px 0",
                }}
              >
                <div
                  style={{ flex: 1, height: 1, background: palette.border }}
                />
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'Space Mono', monospace",
                    color: palette.coral,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  FLIP — SIDE B
                </div>
                <div
                  style={{ flex: 1, height: 1, background: palette.border }}
                />
              </div>
            )}

            {sideBTracks.map((track, i) => {
              const index = sideBStartIndex + i;
              return (
                <MixtapeTrackCard
                  key={track.id}
                  track={track}
                  index={index}
                  isOwner={isOwner}
                  isFirst={index === 0}
                  isLast={index === tracks.length - 1}
                  addedByName={track.added_by_name}
                  isPlaying={playingTrackId === track.id}
                  onPlay={() =>
                    setPlayingTrackId(
                      playingTrackId === track.id ? null : track.id
                    )
                  }
                  onMoveUp={() => handleMove(index, -1)}
                  onMoveDown={() => handleMove(index, 1)}
                  onRemove={() => handleRemove(track.id)}
                  onEditNotes={() => {
                    if (editingNotesId === track.id) {
                      handleSaveNotes();
                    } else {
                      setEditingNotesId(track.id);
                      setNotesValue(track.liner_notes || "");
                    }
                  }}
                  editingNotes={editingNotesId === track.id}
                  notesValue={notesValue}
                  onNotesChange={setNotesValue}
                  onNotesSave={handleSaveNotes}
                />
              );
            })}
          </div>
        )}

        {/* Comments / Reactions */}
        <MixtapeComments mixtapeId={mixtapeId} isOwner={isOwner} />

        {/* Export bottom bar */}
        {tracks.length > 0 && (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: palette.surface,
              borderTop: `1px solid ${palette.border}`,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              zIndex: 150,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontFamily: "'Space Mono', monospace",
                color: palette.textMuted,
              }}
            >
              {tracks.length} track{tracks.length !== 1 ? "s" : ""} &middot;{" "}
              {formatMs(totalMs)}
            </span>
            <button
              onClick={() => {
                const text = `${mixtape.title}\n\n${tracks
                  .map(
                    (t, i) =>
                      `${i + 1}. ${t.track_name} — ${t.artist_name}${
                        t.liner_notes ? `\n   "${t.liner_notes}"` : ""
                      }`
                  )
                  .join("\n")}\n\n${tracks
                  .map((t) => t.spotify_url)
                  .filter(Boolean)
                  .join("\n")}`;
                navigator.clipboard.writeText(text);
                setCopiedTracks(true);
                setTimeout(() => setCopiedTracks(false), 2000);
              }}
              style={{
                padding: "10px 16px",
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                background: "transparent",
                color: copiedTracks ? palette.accent : palette.textMuted,
                transition: "all 0.2s",
              }}
            >
              {copiedTracks ? "Copied!" : "Copy tracklist"}
            </button>
            {isOwner && (
              <button
                onClick={() => {
                  setShowExportModal(true);
                  setExportResult(null);
                  setExportError(null);
                  setPlaylistName(mixtape.title);
                }}
                style={{
                  padding: "10px 24px",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                  background: palette.accent,
                  color: "#000",
                  transition: "all 0.2s",
                }}
              >
                Export to Spotify
              </button>
            )}
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !exporting) {
                setShowExportModal(false);
              }
            }}
          >
            <div
              style={{
                background: palette.surface,
                border: `1px solid ${palette.border}`,
                borderRadius: 16,
                padding: 28,
                width: "100%",
                maxWidth: 400,
                margin: "0 20px",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              {exportResult ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                    Playlist Created!
                  </div>
                  <p
                    style={{
                      color: palette.textMuted,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    {exportResult.track_count} tracks
                  </p>
                  <a
                    href={exportResult.playlist_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 24px",
                      background: palette.accent,
                      color: "#000",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: "none",
                      fontFamily: "'Space Mono', monospace",
                      marginTop: 16,
                    }}
                  >
                    Open in Spotify
                  </a>
                  <div style={{ marginTop: 16 }}>
                    <button
                      onClick={() => {
                        setShowExportModal(false);
                        setExportResult(null);
                      }}
                      style={{
                        padding: "8px 16px",
                        border: `1px solid ${palette.border}`,
                        borderRadius: 8,
                        fontSize: 12,
                        fontFamily: "'Space Mono', monospace",
                        color: palette.textMuted,
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}
                  >
                    Export Mixtape
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: palette.textMuted,
                      fontFamily: "'Space Mono', monospace",
                      marginBottom: 20,
                    }}
                  >
                    {tracks.length} track{tracks.length !== 1 ? "s" : ""}{" "}
                    &middot; {formatMs(totalMs)}
                  </div>

                  {/* Playlist name */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'Space Mono', monospace",
                        color: palette.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 6,
                      }}
                    >
                      Playlist Name
                    </label>
                    <input
                      type="text"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      style={{
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
                      }}
                    />
                  </div>

                  {/* Public toggle */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 20,
                    }}
                  >
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 11,
                        border: "none",
                        background: isPublic ? palette.accent : palette.border,
                        cursor: "pointer",
                        position: "relative",
                        transition: "background 0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          background: "#fff",
                          position: "absolute",
                          top: 3,
                          left: isPublic ? 21 : 3,
                          transition: "left 0.2s",
                        }}
                      />
                    </button>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "'Space Mono', monospace",
                        color: palette.textMuted,
                      }}
                    >
                      {isPublic ? "Public playlist" : "Private playlist"}
                    </span>
                  </div>

                  {/* Track preview */}
                  <div
                    style={{
                      maxHeight: 160,
                      overflowY: "auto",
                      marginBottom: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {tracks.map((track, i) => (
                      <div
                        key={track.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          padding: "4px 0",
                        }}
                      >
                        <span
                          style={{
                            color: palette.textDim,
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 10,
                            width: 18,
                          }}
                        >
                          {i + 1}
                        </span>
                        {track.album_art_url && (
                          <img
                            src={track.album_art_url}
                            alt=""
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 4,
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600 }}>
                            {track.track_name}
                          </span>
                          <span style={{ color: palette.textDim }}>
                            {" — "}
                            {track.artist_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Error */}
                  {exportError && (
                    <div
                      style={{
                        fontSize: 12,
                        color: palette.coral,
                        fontFamily: "'Space Mono', monospace",
                        marginBottom: 12,
                      }}
                    >
                      {exportError}
                    </div>
                  )}

                  {/* Action buttons */}
                  {connected ? (
                    <button
                      onClick={handleExport}
                      disabled={exporting || !playlistName.trim()}
                      style={{
                        width: "100%",
                        padding: "14px",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'Space Mono', monospace",
                        cursor:
                          exporting || !playlistName.trim()
                            ? "not-allowed"
                            : "pointer",
                        background:
                          exporting || !playlistName.trim()
                            ? palette.border
                            : palette.accent,
                        color:
                          exporting || !playlistName.trim()
                            ? palette.textDim
                            : "#000",
                        transition: "all 0.2s",
                        marginBottom: 8,
                      }}
                    >
                      {exporting ? "Creating Playlist..." : "Export to Spotify"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sessionStorage.setItem("spotify_return_path", `/mixtape/${mixtapeId}`);
                        startSpotifyAuth();
                      }}
                      style={{
                        width: "100%",
                        padding: "14px",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'Space Mono', monospace",
                        cursor: "pointer",
                        background: palette.accent,
                        color: "#000",
                        transition: "all 0.2s",
                        marginBottom: 8,
                      }}
                    >
                      Connect Spotify to Export
                    </button>
                  )}
                  <button
                    onClick={() => setShowExportModal(false)}
                    disabled={exporting}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: `1px solid ${palette.border}`,
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'Space Mono', monospace",
                      cursor: "pointer",
                      background: "transparent",
                      color: palette.textMuted,
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
