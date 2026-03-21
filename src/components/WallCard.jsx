import { useState, useEffect, useCallback } from "react";
import { palette } from "../lib/palette";
import { inputStyle } from "../lib/styles";
import { injectAnimations } from "../lib/animations";
import { timeAgo } from "../lib/timeAgo";
import ReactionBar from "./ReactionBar";

// ─── Global CSS (injected once) ───────────────────────────────────────────────
const WALLCARD_CSS = `
  @keyframes itb-shimmer {
    0%   { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }
`;
let wallcardCssInjected = false;
function injectWallCardCss() {
  if (wallcardCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = WALLCARD_CSS;
  document.head.appendChild(tag);
  wallcardCssInjected = true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex = "#ec4899") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function generateArtGradient(artistName = "", albumName = "") {
  const GRADIENTS = [
    "linear-gradient(135deg,#f97316,#ec4899)",
    "linear-gradient(135deg,#f5d547,#f97316)",
    "linear-gradient(135deg,#1e3a5f,#4c1d95)",
    "linear-gradient(135deg,#059669,#1DB954)",
    "linear-gradient(135deg,#a855f7,#ec4899)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
    "linear-gradient(135deg,#dc2626,#f97316)",
    "linear-gradient(135deg,#1e1b4b,#7c3aed)",
  ];
  const str = `${artistName}${albumName}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function getInitials(title = "") {
  return title.split(" ").map((w) => w[0] ?? "").join("").slice(0, 3).toUpperCase();
}

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ rating, interactive, onRate, accent }) {
  const [hover, setHover] = useState(0);
  const display = hover || rating || 0;

  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={interactive ? (e) => { e.stopPropagation(); onRate(star); } : undefined}
          onMouseEnter={interactive ? () => setHover(star) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          style={{
            fontSize: 12,
            cursor: interactive ? "pointer" : "default",
            color: star <= display ? (accent || "#f5c518") : "#2e2e2e",
            transition: "color 0.1s",
            userSelect: "none",
            lineHeight: 1,
          }}
        >★</span>
      ))}
    </div>
  );
}

// ─── Tag pill ─────────────────────────────────────────────────────────────────
function Tag({ label, accent, accentRgb }) {
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: 8,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: accent,
      border: `1px solid rgba(${accentRgb},0.3)`,
      borderRadius: 3,
      padding: "2px 6px",
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

// ─── Owner control button ─────────────────────────────────────────────────────
function CtrlBtn({ label, onClick, danger = false, active = false, accent, accentRgb }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
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
          : "#252525"
        }`,
        borderRadius: 6,
        color: danger && hov ? "#ef4444" : active ? accent : hov ? "#aaa" : "#3a3a3a",
        fontFamily: "'Space Mono', monospace",
        fontSize: 8,
        letterSpacing: "0.06em",
        padding: "4px 8px",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >{label}</button>
  );
}

// ─── WallCard ─────────────────────────────────────────────────────────────────
export default function WallCard({
  submission,
  isOwner,
  ownerName = "Owner",
  onFeedback,
  onDelete,
  onListened,
  onRate,
  isPinned,
  canPin,
  onPin,
  onUnpin,
  entranceIndex,
  accent = palette.accent,
}) {
  const sub = submission;
  const accentRgb = hexToRgb(accent);
  const artFallback = generateArtGradient(sub.artist_name, sub.album_name);

  const [hovered, setHovered] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [sending, setSending] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => { injectAnimations(); injectWallCardCss(); }, []);

  const hasArt = sub.album_art_url && !imgError;

  const handleSendFeedback = useCallback(async () => {
    if (!feedbackText.trim()) return;
    setSending(true);
    await onFeedback(sub.id, feedbackText.trim(), sub.email, sub.album_name, sub.artist_name);
    setSending(false);
    setShowReply(false);
    setFeedbackText("");
  }, [feedbackText, onFeedback, sub]);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(sub.id);
    setShowDelete(false);
  }, [onDelete, sub.id]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      style={{
        position: "relative",
        background: "#111",
        borderRadius: 12,
        border: `1px solid ${hovered ? `rgba(${accentRgb},0.35)` : "#1e1e1e"}`,
        overflow: "hidden",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 24px rgba(${accentRgb},0.07)` : "none",
        animation: "booth-fadeInUp 0.3s ease both",
        animationDelay: entranceIndex != null ? `${Math.min(entranceIndex, 8) * 0.05}s` : undefined,
      }}
    >
      {/* Listened: left border indicator */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, bottom: 0,
        width: 3,
        borderRadius: "12px 0 0 12px",
        background: sub.listened ? accent : "transparent",
        transition: "background 0.25s ease",
        zIndex: 3,
        pointerEvents: "none",
      }} />

      {/* Pinned badge */}
      {isPinned && (
        <div style={{
          position: "absolute",
          top: 8, right: 8,
          fontFamily: "'Space Mono', monospace",
          fontSize: 8,
          letterSpacing: "0.08em",
          color: accent,
          background: `rgba(${accentRgb},0.1)`,
          border: `1px solid rgba(${accentRgb},0.3)`,
          borderRadius: 4,
          padding: "2px 6px",
          zIndex: 4,
          pointerEvents: "none",
        }}>PIN</div>
      )}

      {/* Static trim (resting) */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `rgba(${accentRgb},0.35)`,
        opacity: hovered ? 0 : 1,
        transition: "opacity 0.2s ease",
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* Shimmer trim (hover) */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,
          transparent 0%,
          rgba(${accentRgb},0.3) 20%,
          rgba(${accentRgb},1) 50%,
          rgba(${accentRgb},0.3) 80%,
          transparent 100%)`,
        backgroundSize: "200% 100%",
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.2s ease",
        animation: hovered ? "itb-shimmer 1.2s ease infinite" : "none",
        zIndex: 2,
        pointerEvents: "none",
      }} />

      {/* Body */}
      <div style={{ padding: "14px 14px 12px 17px" }}>

        {/* Art + title row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>

          {/* Album art */}
          <div style={{
            width: 64, height: 64,
            borderRadius: 7,
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
            background: artFallback,
          }}>
            {hasArt ? (
              <img
                src={sub.album_art_url}
                alt={`${sub.album_name} art`}
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif",
                fontSize: 18, fontWeight: 800,
                color: "rgba(255,255,255,0.2)",
                letterSpacing: -1,
                userSelect: "none",
              }}>{getInitials(sub.album_name)}</div>
            )}
          </div>

          {/* Title / artist / stars */}
          <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 13, fontWeight: 700,
              color: "#e8e6e3", lineHeight: 1.2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{sub.album_name}</div>

            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9, color: "#4a4a4a",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{sub.artist_name}</div>

            {/* Star rating — always show for owner (interactive), show for visitors only if rated */}
            {(isOwner || sub.rating) && (
              <StarRating
                rating={sub.rating || 0}
                interactive={isOwner}
                onRate={(r) => onRate(sub.id, r)}
                accent={accent}
              />
            )}
          </div>

          {/* Spotify button */}
          {sub.spotify_url && (
            <a
              href={sub.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open in Spotify"
              style={{
                flexShrink: 0, alignSelf: "flex-start", marginTop: 2,
                width: 26, height: 26,
                borderRadius: 6,
                background: "rgba(29,185,84,0.08)",
                border: "1px solid rgba(29,185,84,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#1DB954", fontSize: 11,
                textDecoration: "none",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >▶</a>
          )}
        </div>

        {/* Tags */}
        {sub.tags && sub.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {sub.tags.map((tag) => <Tag key={tag} label={tag} accent={accent} accentRgb={accentRgb} />)}
          </div>
        )}

        {/* Submitter note */}
        {sub.note && (
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11, color: "#555",
            lineHeight: 1.55, marginBottom: 8,
            fontStyle: "italic",
            margin: 0, marginBottom: 8,
          }}>"{sub.note}"</p>
        )}

        {/* Owner's take */}
        {sub.owner_feedback && (
          <div style={{
            background: `rgba(${accentRgb},0.04)`,
            border: `1px solid rgba(${accentRgb},0.14)`,
            borderRadius: 7,
            padding: "7px 10px",
            marginBottom: 8,
          }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, color: accent,
              letterSpacing: "0.08em", marginBottom: 4,
            }}>
              {ownerName ? `${ownerName.toUpperCase()}'S TAKE` : "OWNER'S TAKE"}
            </div>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11, color: "#777",
              lineHeight: 1.5, margin: 0,
            }}>{sub.owner_feedback}</p>
          </div>
        )}

        {/* Reaction bar — uses real Supabase RPC + localStorage tracking */}
        <ReactionBar submissionId={sub.id} reactions={sub.reactions || {}} />

        {/* Footer: submitter + time */}
        <div style={{
          display: "flex", alignItems: "center",
          gap: 5, marginTop: 8,
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, rgba(${accentRgb},0.7), #3b82f6)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Space Mono', monospace",
            fontSize: 6, fontWeight: 700, color: "#fff",
          }}>
            {(sub.submitted_by ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9, color: "#3a3a3a",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{sub.submitted_by}</span>
          {sub.created_at && (
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, color: "#2e2e2e", flexShrink: 0,
            }}>· {timeAgo(sub.created_at)}</span>
          )}
        </div>

        {/* Owner controls */}
        {isOwner && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 5,
            marginTop: 10, paddingTop: 10,
            borderTop: "1px solid #181818",
          }}>
            <CtrlBtn
              label={sub.listened ? "✓ LISTENED" : "MARK LISTENED"}
              onClick={() => onListened(sub.id, !sub.listened)}
              active={sub.listened}
              accent={accent}
              accentRgb={accentRgb}
            />
            {!sub.owner_feedback && (
              <CtrlBtn
                label="REPLY"
                onClick={() => { setShowReply((v) => !v); setShowDelete(false); }}
                active={showReply}
                accent={accent}
                accentRgb={accentRgb}
              />
            )}
            {canPin && (
              <CtrlBtn
                label={isPinned ? "UNPIN" : "PIN"}
                onClick={() => isPinned ? onUnpin(sub.id) : onPin(sub.id)}
                active={isPinned}
                accent={accent}
                accentRgb={accentRgb}
              />
            )}
            <CtrlBtn
              label="DELETE"
              onClick={() => { setShowDelete((v) => !v); setShowReply(false); }}
              danger
              accent={accent}
              accentRgb={accentRgb}
            />
          </div>
        )}

        {/* Reply box */}
        {showReply && (
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 8 }}>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Your take on this one…"
              rows={3}
              style={{
                ...inputStyle,
                background: "#1a1a1a",
                border: `1px solid rgba(${accentRgb},0.25)`,
                borderRadius: 7,
                fontSize: 12,
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button
                onClick={handleSendFeedback}
                disabled={!feedbackText.trim() || sending}
                style={{
                  background: accent,
                  border: "none",
                  borderRadius: 6,
                  color: "#000",
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                  fontSize: 9,
                  padding: "5px 12px",
                  cursor: !feedbackText.trim() ? "not-allowed" : "pointer",
                  letterSpacing: "0.05em",
                  opacity: feedbackText.trim() ? 1 : 0.45,
                  transition: "opacity 0.15s",
                }}
              >{sending ? "SENDING..." : "POST"}</button>
              <button
                onClick={() => { setShowReply(false); setFeedbackText(""); }}
                style={{
                  background: "transparent",
                  border: "1px solid #2a2a2a",
                  borderRadius: 6,
                  color: "#555",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  padding: "5px 10px",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >CANCEL</button>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {showDelete && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1a1a1a",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 8,
              padding: "10px 12px",
              marginTop: 8,
            }}
          >
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "#666",
              marginBottom: 8,
              letterSpacing: "0.03em",
              margin: 0, marginBottom: 8,
            }}>Remove this submission?</p>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  background: "rgba(220,38,38,0.15)",
                  border: "1px solid rgba(220,38,38,0.4)",
                  borderRadius: 6,
                  color: "#ef4444",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  padding: "4px 10px",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >DELETE</button>
              <button
                onClick={() => setShowDelete(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #2a2a2a",
                  borderRadius: 6,
                  color: "#555",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  padding: "4px 10px",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >CANCEL</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
