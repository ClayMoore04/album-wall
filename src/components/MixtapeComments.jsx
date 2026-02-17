import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MixtapeComments({ mixtapeId, isOwner }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase || !mixtapeId) return;
    loadComments();
  }, [mixtapeId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from("mixtape_comments")
      .select("*")
      .eq("mixtape_id", mixtapeId)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const handleSubmit = async () => {
    if (!body.trim() || !supabase) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("mixtape_comments")
      .insert({
        mixtape_id: mixtapeId,
        user_id: user?.id || null,
        author_name:
          user && profile
            ? profile.display_name
            : authorName.trim() || "Anonymous",
        body: body.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setBody("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    if (!supabase) return;
    await supabase.from("mixtape_comments").delete().eq("id", commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div style={{ marginTop: 32, paddingBottom: 80 }}>
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
        Reactions ({comments.length})
      </div>

      {/* Comment list */}
      {comments.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "10px 14px",
                background: palette.cardBg,
                border: `1px solid ${palette.border}`,
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>
                  {c.author_name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: palette.textDim,
                    fontFamily: "'Space Mono', monospace",
                    marginLeft: 8,
                  }}
                >
                  {timeAgo(c.created_at)}
                </span>
                <div
                  style={{
                    fontSize: 13,
                    color: palette.text,
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {c.body}
                </div>
              </div>
              {(isOwner || (user && user.id === c.user_id)) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: palette.textDim,
                    cursor: "pointer",
                    fontSize: 12,
                    flexShrink: 0,
                    padding: "2px 4px",
                  }}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!user && (
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name..."
            maxLength={40}
            style={{
              padding: "8px 12px",
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 8,
              color: palette.text,
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 140))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Leave a reaction..."
            maxLength={140}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 8,
              color: palette.text,
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !body.trim()}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              cursor: submitting || !body.trim() ? "not-allowed" : "pointer",
              background: palette.accent,
              color: "#000",
              opacity: submitting || !body.trim() ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>
        <div
          style={{
            fontSize: 10,
            color: palette.textDim,
            fontFamily: "'Space Mono', monospace",
            textAlign: "right",
          }}
        >
          {body.length}/140
        </div>
      </div>
    </div>
  );
}
