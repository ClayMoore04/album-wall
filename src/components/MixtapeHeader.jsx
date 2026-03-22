import { useState } from "react";
import { Link } from "react-router-dom";
import { palette } from "../lib/palette";
import MixtapeCoverArt from "./MixtapeCoverArt";
import TapeTradeButton from "./TapeTradeButton";

function hexToRgb(hex = "#ec4899") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

let mixtapeHeaderCssInjected = false;
function injectMixtapeHeaderCss() {
  if (mixtapeHeaderCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-shimmer {
      0%   { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(tag);
  mixtapeHeaderCssInjected = true;
}

function ActionBtn({ label, onClick, active = false, danger = false, accent, accentRgb }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: danger && hov ? "rgba(220,38,38,0.1)"
          : active ? `rgba(${accentRgb},0.12)`
          : hov ? "rgba(255,255,255,0.05)"
          : "transparent",
        border: `1px solid ${
          danger && hov ? "rgba(220,38,38,0.4)"
          : active ? `rgba(${accentRgb},0.4)`
          : hov ? "#333"
          : "#222"
        }`,
        borderRadius: 6,
        color: danger && hov ? "#ef4444" : active ? accent : hov ? "#888" : "#333",
        fontFamily: "'Space Mono', monospace",
        fontSize: 8, letterSpacing: "0.06em",
        padding: "5px 10px",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >{label}</button>
  );
}

export default function MixtapeHeader({
  mixtapeId,
  user,
  mixtape,
  tracks,
  collaborators,
  editingTitle, setEditingTitle, titleValue, setTitleValue,
  editingTheme, setEditingTheme, themeValue, setThemeValue,
  copied, setCopied, collabCopied, setCollabCopied,
  showCoverPicker, setShowCoverPicker,
  isOwner, isCollaborator, canEdit, currentTurn,
  handleSaveTitle, handleSaveTheme, handleCoverChange, handleSaveCustomCover,
  handleToggleCollabMode, handleLeave, handleDelete,
  onOpenCoverDesigner,
  accent = palette.accent,
}) {
  injectMixtapeHeaderCss();

  const accentRgb = hexToRgb(accent);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  return (
    <div style={{
      position: "relative",
      background: "#111",
      borderRadius: 12,
      border: "1px solid #1e1e1e",
      overflow: "hidden",
      marginBottom: 20,
    }}>
      {/* Accent trim */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}, rgba(${accentRgb},0.1))`,
        zIndex: 1, pointerEvents: "none",
      }} />

      <div style={{ padding: "18px 18px 16px" }}>
        {/* Cover art + metadata row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>

          {/* Cover art */}
          <div style={{ flexShrink: 0, position: "relative" }}>
            <MixtapeCoverArt
              tracks={tracks}
              coverArtIndex={mixtape.cover_art_index}
              customCoverUrl={mixtape.custom_cover_url}
              size={120}
            />
            {canEdit && (
              <button
                onClick={() => setShowCoverPicker(!showCoverPicker)}
                style={{
                  position: "absolute",
                  bottom: 4, right: 4,
                  background: "rgba(0,0,0,0.7)",
                  border: `1px solid rgba(${accentRgb},0.3)`,
                  borderRadius: 5,
                  color: accent,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 7, letterSpacing: "0.06em",
                  padding: "3px 6px",
                  cursor: "pointer",
                }}
              >COVER</button>
            )}
          </div>

          {/* Title + metadata */}
          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Collab badge */}
            {mixtape.is_collab && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 7,
                background: `rgba(${accentRgb},0.08)`,
                border: `1px solid rgba(${accentRgb},0.25)`,
                borderRadius: 4,
                padding: "2px 7px",
              }}>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 7, letterSpacing: "0.1em",
                  color: accent,
                }}>
                  COLLAB / {mixtape.collab_mode === "turns" ? "TURNS" : "OPEN"}
                </span>
              </div>
            )}

            {/* Editable title */}
            {editingTitle && canEdit ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  autoFocus
                  style={{
                    background: "#1a1a1a",
                    border: `1px solid rgba(${accentRgb},0.3)`,
                    borderRadius: 6,
                    color: "#e8e6e3",
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 18, fontWeight: 800,
                    padding: "4px 8px",
                    flex: 1,
                    outline: "none",
                  }}
                />
                <button onClick={handleSaveTitle} style={{
                  background: accent, border: "none",
                  borderRadius: 5, color: "#000",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 8, fontWeight: 700,
                  padding: "5px 10px", cursor: "pointer",
                }}>SAVE</button>
              </div>
            ) : (
              <h1
                onClick={() => canEdit && setEditingTitle(true)}
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 20, fontWeight: 800,
                  color: "#e8e6e3",
                  letterSpacing: "-0.01em",
                  margin: "0 0 4px",
                  lineHeight: 1.15,
                  cursor: canEdit ? "pointer" : "default",
                }}
                title={canEdit ? "Click to edit title" : ""}
              >
                {mixtape.title}
              </h1>
            )}

            {/* Theme */}
            {editingTheme ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: accent, fontFamily: "'Space Mono', monospace" }}>for:</span>
                <input
                  value={themeValue}
                  onChange={(e) => setThemeValue(e.target.value.slice(0, 50))}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTheme()}
                  placeholder="long drives, sunday morning..."
                  autoFocus
                  maxLength={50}
                  style={{
                    background: "#1a1a1a",
                    border: `1px solid rgba(${accentRgb},0.25)`,
                    borderRadius: 6,
                    color: "#888",
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 12, fontStyle: "italic",
                    padding: "4px 8px",
                    flex: 1,
                    outline: "none",
                  }}
                />
                <button onClick={handleSaveTheme} style={{
                  background: accent, border: "none",
                  borderRadius: 5, color: "#000",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 8, fontWeight: 700,
                  padding: "5px 10px", cursor: "pointer",
                }}>SAVE</button>
              </div>
            ) : mixtape.theme ? (
              <div
                style={{
                  fontSize: 13, fontStyle: "italic",
                  color: "#444",
                  fontFamily: "'Space Mono', monospace",
                  marginBottom: 4,
                  cursor: canEdit ? "pointer" : "default",
                }}
                onClick={() => canEdit && setEditingTheme(true)}
                title={canEdit ? "Click to edit theme" : ""}
              >
                for: {mixtape.theme}
              </div>
            ) : canEdit ? (
              <button
                onClick={() => setEditingTheme(true)}
                style={{
                  background: "none", border: "none",
                  color: "#2a2a2a",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 8, letterSpacing: "0.06em",
                  padding: 0, cursor: "pointer", marginBottom: 4,
                }}
              >+ ADD THEME</button>
            ) : null}

            {/* Credits */}
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, color: "#2e2e2e",
              letterSpacing: "0.06em",
            }}>
              by{" "}
              <Link
                to={`/${mixtape.profiles?.slug}`}
                style={{ color: accent, textDecoration: "none" }}
              >
                {mixtape.profiles?.display_name || "Unknown"}
              </Link>
              {mixtape.is_collab && collaborators.length > 0 &&
                collaborators.map((c, i) => (
                  <span key={c.user_id}>
                    {i === collaborators.length - 1 ? " & " : ", "}
                    <Link
                      to={`/${c.profiles?.slug}`}
                      style={{ color: "#555", textDecoration: "none" }}
                    >
                      {c.profiles?.display_name}
                    </Link>
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* Collaborator turn badges */}
        {mixtape.is_collab && collaborators.length > 0 && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 5,
            marginBottom: 14, paddingBottom: 14,
            borderBottom: "1px solid #181818",
          }}>
            <span style={{
              padding: "3px 8px",
              borderRadius: 4,
              background: currentTurn?.userId === mixtape.user_id ? `rgba(${accentRgb},0.08)` : "transparent",
              border: `1px solid ${currentTurn?.userId === mixtape.user_id ? `rgba(${accentRgb},0.3)` : "#1e1e1e"}`,
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, letterSpacing: "0.06em",
              color: currentTurn?.userId === mixtape.user_id ? accent : "#333",
            }}>
              {currentTurn?.userId === mixtape.user_id && "→ "}
              {mixtape.profiles?.display_name}
            </span>
            {collaborators.map((c) => (
              <span
                key={c.user_id}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: currentTurn?.userId === c.user_id ? `rgba(${accentRgb},0.08)` : "transparent",
                  border: `1px solid ${currentTurn?.userId === c.user_id ? `rgba(${accentRgb},0.3)` : "#1e1e1e"}`,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 8, letterSpacing: "0.06em",
                  color: currentTurn?.userId === c.user_id ? accent : "#333",
                }}
              >
                {currentTurn?.userId === c.user_id && "→ "}
                {c.profiles?.display_name}
              </span>
            ))}
          </div>
        )}

        {/* Cover picker dropdown */}
        {showCoverPicker && canEdit && (
          <div style={{
            background: "#1a1a1a",
            border: `1px solid rgba(${accentRgb},0.2)`,
            borderRadius: 8,
            padding: 6,
            marginBottom: 14,
            maxHeight: 200,
            overflowY: "auto",
          }}>
            <button
              onClick={() => handleCoverChange(null)}
              style={{
                display: "block", width: "100%",
                padding: "6px 10px",
                border: "none",
                background: mixtape.cover_art_index === null ? `rgba(${accentRgb},0.15)` : "transparent",
                color: "#e8e6e3",
                fontSize: 11, fontFamily: "'Space Mono', monospace",
                cursor: "pointer", textAlign: "left", borderRadius: 4,
              }}
            >Auto collage</button>
            {tracks.map((t, i) => (
              <button
                key={t.id}
                onClick={() => handleCoverChange(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "5px 10px",
                  border: "none",
                  background: mixtape.cover_art_index === i ? `rgba(${accentRgb},0.15)` : "transparent",
                  color: "#e8e6e3",
                  fontSize: 11, fontFamily: "'Space Mono', monospace",
                  cursor: "pointer", textAlign: "left", borderRadius: 4,
                }}
              >
                {t.album_art_url && (
                  <img src={t.album_art_url} alt="" style={{ width: 20, height: 20, borderRadius: 3, objectFit: "cover" }} />
                )}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.track_name}
                </span>
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${"#1e1e1e"}`, margin: "6px 0" }} />
            <button
              onClick={() => {
                setShowCoverPicker(false);
                onOpenCoverDesigner();
              }}
              style={{
                display: "block", width: "100%",
                padding: "6px 10px", border: "none",
                background: "transparent",
                color: accent,
                fontSize: 11, fontFamily: "'Space Mono', monospace",
                cursor: "pointer", textAlign: "left", borderRadius: 4, fontWeight: 600,
              }}
            >
              {mixtape.custom_cover_url ? "Edit custom design" : "Design your own"}
            </button>
            {mixtape.custom_cover_url && (
              <button
                onClick={() => {
                  handleSaveCustomCover(mixtape.custom_cover_url, mixtape.custom_cover_data, mixtape.custom_cover_shape);
                  setShowCoverPicker(false);
                }}
                style={{
                  display: "block", width: "100%",
                  padding: "6px 10px", border: "none",
                  background: mixtape.custom_cover_url && !mixtape.cover_art_index ? `rgba(${accentRgb},0.15)` : "transparent",
                  color: "#e8e6e3",
                  fontSize: 11, fontFamily: "'Space Mono', monospace",
                  cursor: "pointer", textAlign: "left", borderRadius: 4,
                }}
              >Use custom design</button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {tracks.some((t) => t.liner_notes) && (
            <Link
              to={`/mixtape/${mixtapeId}/notes`}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 8, letterSpacing: "0.06em",
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid #222",
                color: "#333",
                textDecoration: "none",
              }}
            >
              LINER NOTES
            </Link>
          )}
          <ActionBtn
            label={copied ? "✓ COPIED" : "COPY LINK"}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            active={copied}
            accent={accent} accentRgb={accentRgb}
          />
          {isOwner && mixtape.is_collab && mixtape.invite_code && (
            <ActionBtn
              label={collabCopied ? "✓ INVITE COPIED" : "COPY INVITE"}
              onClick={() => {
                const url = `${window.location.origin}/mixtape/join/${mixtape.invite_code}`;
                navigator.clipboard.writeText(url);
                setCollabCopied(true);
                setTimeout(() => setCollabCopied(false), 2000);
              }}
              active={collabCopied}
              accent={accent} accentRgb={accentRgb}
            />
          )}
          {isOwner && mixtape.is_collab && (
            <ActionBtn
              label={`MODE: ${mixtape.collab_mode === "turns" ? "STRICT TURNS" : "OPEN"}`}
              onClick={handleToggleCollabMode}
              accent={accent} accentRgb={accentRgb}
            />
          )}
          {user && !isOwner && !isCollaborator && (
            <TapeTradeButton mixtape={mixtape} />
          )}
          {isCollaborator && !isOwner && !confirmLeave && (
            <ActionBtn label="LEAVE TAPE" onClick={() => setConfirmLeave(true)} accent={accent} accentRgb={accentRgb} />
          )}
          {confirmLeave && (
            <>
              <ActionBtn label="CONFIRM LEAVE" onClick={() => { handleLeave(); setConfirmLeave(false); }} danger accent={accent} accentRgb={accentRgb} />
              <ActionBtn label="CANCEL" onClick={() => setConfirmLeave(false)} accent={accent} accentRgb={accentRgb} />
            </>
          )}
          {isOwner && !confirmDelete && (
            <ActionBtn label="DELETE TAPE" onClick={() => setConfirmDelete(true)} danger accent={accent} accentRgb={accentRgb} />
          )}
          {confirmDelete && (
            <>
              <ActionBtn label="CONFIRM DELETE" onClick={() => { handleDelete(); setConfirmDelete(false); }} danger accent={accent} accentRgb={accentRgb} />
              <ActionBtn label="CANCEL" onClick={() => setConfirmDelete(false)} accent={accent} accentRgb={accentRgb} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
