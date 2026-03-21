import { useState } from "react";
import { palette } from "../lib/palette";
import { inputStyle } from "../lib/styles";
import { formatMs } from "../hooks/useMixtapeData";

function hexToRgb(hex = "#ec4899") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

let trackCssInjected = false;
function injectTrackCss() {
  if (trackCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-fadeInUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(tag);
  trackCssInjected = true;
}

export default function MixtapeTrackCard({
  track,
  index,
  isOwner,
  isCollaborator,
  isTrackAuthor,
  isFirst,
  isLast,
  addedByName,
  isPlaying,
  onPlay,
  onMoveUp,
  onMoveDown,
  onRemove,
  onEditNotes,
  editingNotes,
  notesValue,
  onNotesChange,
  onNotesSave,
  accent = palette.accent,
}) {
  injectTrackCss();

  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const accentRgb = hexToRgb(accent);
  const canEditNotes = isOwner || isTrackAuthor;
  const canRemove = isOwner || isTrackAuthor;
  const canReorder = isOwner;
  const hasArt = track.album_art_url && !imgError;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmRemove(false); }}
      style={{
        position: "relative",
        background: isPlaying ? `rgba(${accentRgb},0.06)` : "#111",
        borderRadius: 10,
        border: `1px solid ${isPlaying ? `rgba(${accentRgb},0.3)` : hovered ? "#2a2a2a" : "#1a1a1a"}`,
        overflow: "hidden",
        transition: "border-color 0.15s, background 0.15s",
        animation: "itb-fadeInUp 0.25s ease both",
        animationDelay: `${index * 0.04}s`,
      }}
    >
      {/* Playing indicator */}
      {isPlaying && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, bottom: 0,
          width: 3,
          background: accent,
          borderRadius: "10px 0 0 10px",
        }} />
      )}

      <div style={{ padding: "10px 12px 10px 15px" }}>
        {/* Main row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Track number */}
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            color: isPlaying ? accent : "#2a2a2a",
            width: 18,
            textAlign: "right",
            flexShrink: 0,
            fontWeight: isPlaying ? 700 : 400,
          }}>
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Album art */}
          <div style={{
            width: 42, height: 42,
            borderRadius: 5,
            overflow: "hidden",
            flexShrink: 0,
            background: "#1a1a1a",
            position: "relative",
          }}>
            {hasArt ? (
              <img
                src={track.album_art_url}
                alt=""
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: "#2a2a2a",
              }}>♪</div>
            )}
          </div>

          {/* Track info */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 13, fontWeight: 600,
              color: "#e8e6e3",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              lineHeight: 1.2, marginBottom: 2,
            }}>
              {track.track_name}
            </div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, color: "#3a3a3a",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {track.artist_name}
              {track.album_name && (
                <span style={{ color: "#252525" }}> · {track.album_name}</span>
              )}
              {addedByName && (
                <span style={{ color: "#252525" }}> · added by {addedByName}</span>
              )}
            </div>
          </div>

          {/* Right: duration + play + reorder */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, color: "#2e2e2e",
              letterSpacing: "0.04em",
            }}>
              {formatMs(track.duration_ms)}
            </span>

            {track.spotify_id && (
              <button
                onClick={onPlay}
                style={{
                  width: 28, height: 28,
                  borderRadius: 6,
                  background: isPlaying ? `rgba(${accentRgb},0.15)` : "rgba(29,185,84,0.08)",
                  border: `1px solid ${isPlaying ? `rgba(${accentRgb},0.4)` : "rgba(29,185,84,0.2)"}`,
                  color: isPlaying ? accent : "#1DB954",
                  fontSize: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                title={isPlaying ? "Hide player" : "Preview"}
              >
                {isPlaying ? "■" : "▶"}
              </button>
            )}

            {canReorder && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {!isFirst && (
                  <button onClick={onMoveUp} style={{
                    width: 20, height: 16,
                    background: "transparent",
                    border: "1px solid #1e1e1e",
                    borderRadius: 3,
                    color: "#333",
                    fontSize: 8,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1, padding: 0,
                  }} title="Move up">↑</button>
                )}
                {!isLast && (
                  <button onClick={onMoveDown} style={{
                    width: 20, height: 16,
                    background: "transparent",
                    border: "1px solid #1e1e1e",
                    borderRadius: 3,
                    color: "#333",
                    fontSize: 8,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1, padding: 0,
                  }} title="Move down">↓</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Spotify embed */}
        {isPlaying && track.spotify_id && (
          <div style={{ marginTop: 10 }}>
            <iframe
              src={`https://open.spotify.com/embed/track/${track.spotify_id}?utm_source=generator&theme=0`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: 8, display: "block" }}
            />
          </div>
        )}

        {/* Liner notes display */}
        {track.liner_notes && !editingNotes && (
          <div style={{
            marginTop: 8,
            padding: "7px 10px",
            background: `rgba(${accentRgb},0.04)`,
            border: `1px solid rgba(${accentRgb},0.12)`,
            borderRadius: 7,
          }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 7, color: accent,
              letterSpacing: "0.1em", marginBottom: 4,
            }}>LINER NOTES</div>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11, color: "#666",
              lineHeight: 1.55, margin: 0,
              fontStyle: "italic",
            }}>{track.liner_notes}</p>
          </div>
        )}

        {/* Notes editing */}
        {editingNotes && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={notesValue}
              onChange={(e) => onNotesChange(e.target.value.slice(0, 250))}
              maxLength={250}
              placeholder="Add liner notes..."
              rows={2}
              style={{
                ...inputStyle,
                background: "#1a1a1a",
                border: `1px solid rgba(${accentRgb},0.25)`,
                borderRadius: 7,
                fontSize: 11,
                padding: "8px 10px",
                resize: "none",
              }}
              autoFocus
              onBlur={onNotesSave}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onNotesSave();
                }
              }}
            />
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 7, color: "#2a2a2a",
              textAlign: "right", marginTop: 4,
            }}>
              {notesValue.length}/250
            </div>
          </div>
        )}

        {/* Track controls */}
        {(canEditNotes || canRemove) && !editingNotes && (
          <div style={{
            display: "flex", gap: 5, flexWrap: "wrap",
            marginTop: 8, paddingTop: 8,
            borderTop: "1px solid #161616",
          }}>
            {canEditNotes && (
              <button
                onClick={onEditNotes}
                style={{
                  background: "transparent",
                  border: "1px solid #1e1e1e",
                  borderRadius: 5,
                  color: "#333",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 7, letterSpacing: "0.06em",
                  padding: "3px 8px", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                title="Liner notes"
              >
                {track.liner_notes ? "EDIT NOTES" : "+ LINER NOTES"}
              </button>
            )}

            {canRemove && !confirmRemove && (
              <button
                onClick={() => setConfirmRemove(true)}
                style={{
                  background: "transparent",
                  border: "1px solid #1e1e1e",
                  borderRadius: 5,
                  color: "#2a2a2a",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 7, letterSpacing: "0.06em",
                  padding: "3px 8px", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >REMOVE</button>
            )}

            {confirmRemove && (
              <>
                <button
                  onClick={() => { onRemove(); setConfirmRemove(false); }}
                  style={{
                    background: "rgba(220,38,38,0.12)",
                    border: "1px solid rgba(220,38,38,0.4)",
                    borderRadius: 5, color: "#ef4444",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 7, letterSpacing: "0.06em",
                    padding: "3px 8px", cursor: "pointer",
                  }}
                >CONFIRM</button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid #222",
                    borderRadius: 5, color: "#444",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 7, letterSpacing: "0.06em",
                    padding: "3px 8px", cursor: "pointer",
                  }}
                >CANCEL</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
