import { useState } from "react";
import { palette, getColor } from "../lib/palette";
import { inputStyle } from "../lib/styles";

export default function WallCard({ submission, isAdmin, onFeedback, onDelete }) {
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
      {sub.daniel_feedback && (
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
            Daniel's take
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: palette.text,
            }}
          >
            "{sub.daniel_feedback}"
          </div>
        </div>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <div style={{ padding: "0 16px 16px" }}>
          {/* Reply UI (only if no feedback yet) */}
          {!sub.daniel_feedback && (
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
            {!sub.daniel_feedback && !replying && (
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
