import { useState } from "react";
import { palette, getColor } from "../lib/palette";
import { inputStyle } from "../lib/styles";

function StarRating({ rating, interactive, onRate }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => interactive && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            cursor: interactive ? "pointer" : "default",
            fontSize: 16,
            color:
              star <= (hover || rating)
                ? "#f5c518"
                : palette.textDim,
            transition: "color 0.1s",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function WallCard({ submission, isOwner, ownerName = "Owner", onFeedback, onDelete, onListened, onRate }) {
  const sub = submission;
  const [replying, setReplying] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSending(true);
    await onFeedback(sub.id, feedbackText.trim(), sub.email, sub.album_name, sub.artist_name);
    setSending(false);
    setReplying(false);
    setFeedbackText("");
  };

  return (
    <div
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderLeft: sub.listened
          ? `3px solid ${palette.accent}`
          : `1px solid ${palette.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Main card content */}
      <div style={{ display: "flex", gap: 14, padding: 16 }}>
        {/* Album art or gradient fallback */}
        {sub.album_art_url ? (
          <img
            src={sub.album_art_url}
            alt={sub.album_name}
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${getColor(sub.artist_name)}, ${getColor(sub.album_name)})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: "rgba(255,255,255,0.9)",
              fontFamily: "'Syne', sans-serif",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
          >
            {(sub.album_name || "?")[0]?.toUpperCase()}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sub.album_name}
                </div>
                {/* Listened badge */}
                {sub.listened && (
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(29,185,84,0.15)",
                      color: palette.accent,
                    }}
                  >
                    Listened
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: palette.textMuted,
                  fontFamily: "'Space Mono', monospace",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {sub.artist_name}
              </div>
            </div>
            {sub.spotify_url && (
              <a
                href={sub.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  background: palette.accent,
                  color: "#000",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: "none",
                  fontFamily: "'Space Mono', monospace",
                  whiteSpace: "nowrap",
                }}
              >
                ▶ Spotify
              </a>
            )}
          </div>

          {/* Star rating (public) */}
          {sub.rating && !isOwner && (
            <div style={{ marginTop: 6 }}>
              <StarRating rating={sub.rating} interactive={false} />
            </div>
          )}

          {sub.note && (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: palette.textMuted,
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              "{sub.note}"
            </div>
          )}

          {/* Tags */}
          {sub.tags && sub.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginTop: 8,
              }}
            >
              {sub.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "'Space Mono', monospace",
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: "rgba(29,185,84,0.1)",
                    color: palette.accent,
                    border: `1px solid rgba(29,185,84,0.2)`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: palette.textDim,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            from {sub.submitted_by}
          </div>
        </div>
      </div>

      {/* Daniel's feedback */}
      {sub.owner_feedback && (
        <div
          style={{
            margin: "0 16px 16px",
            padding: 14,
            background: "rgba(29,185,84,0.08)",
            border: `1px solid rgba(29,185,84,0.2)`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: palette.accent,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            {ownerName}'s take
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: palette.text,
            }}
          >
            "{sub.owner_feedback}"
          </div>
        </div>
      )}

      {/* Admin controls */}
      {isOwner && (
        <div style={{ padding: "0 16px 16px" }}>
          {/* Listened + Rating controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => onListened(sub.id, !sub.listened)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: sub.listened
                  ? `1px solid ${palette.accent}`
                  : `1px solid ${palette.border}`,
                background: sub.listened
                  ? "rgba(29,185,84,0.15)"
                  : "transparent",
                color: sub.listened ? palette.accent : palette.textMuted,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {sub.listened ? "✓ Listened" : "Mark Listened"}
            </button>
            {sub.listened && (
              <StarRating
                rating={sub.rating || 0}
                interactive={true}
                onRate={(r) => onRate(sub.id, r)}
              />
            )}
          </div>

          {/* Reply UI (only if no feedback yet) */}
          {!sub.owner_feedback && (
            <>
              {replying ? (
                <div style={{ marginBottom: 8 }}>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="What did you think of this album?"
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: 60,
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleSendFeedback}
                      disabled={!feedbackText.trim() || sending}
                      style={{
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "'Space Mono', monospace",
                        cursor: !feedbackText.trim() ? "not-allowed" : "pointer",
                        background: !feedbackText.trim()
                          ? palette.border
                          : palette.accent,
                        color: !feedbackText.trim() ? palette.textDim : "#000",
                        transition: "all 0.2s",
                      }}
                    >
                      {sending ? "Sending..." : "Send Feedback"}
                    </button>
                    <button
                      onClick={() => {
                        setReplying(false);
                        setFeedbackText("");
                      }}
                      style={{
                        padding: "8px 16px",
                        border: `1px solid ${palette.border}`,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "'Space Mono', monospace",
                        cursor: "pointer",
                        background: "transparent",
                        color: palette.textMuted,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Action buttons row */}
          <div style={{ display: "flex", gap: 8 }}>
            {!sub.owner_feedback && !replying && (
              <button
                onClick={() => setReplying(true)}
                style={{
                  padding: "8px 16px",
                  border: `1px solid ${palette.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                  background: "transparent",
                  color: palette.textMuted,
                  transition: "all 0.2s",
                }}
              >
                Reply to {sub.submitted_by}
              </button>
            )}

            {/* Delete button */}
            {confirmDelete ? (
              <>
                <button
                  onClick={() => {
                    onDelete(sub.id);
                    setConfirmDelete(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                    background: palette.coral,
                    color: "#fff",
                    transition: "all 0.2s",
                  }}
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    padding: "8px 16px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 8,
                    fontSize: 12,
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
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  padding: "8px 16px",
                  border: `1px solid rgba(255,107,107,0.3)`,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                  background: "transparent",
                  color: palette.coral,
                  transition: "all 0.2s",
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
