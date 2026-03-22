import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function GatefoldComments({ mixtapeId, accent }) {
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

  // Deterministic slight rotation per comment
  const getRotation = (id) => {
    const hash = String(id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return ((hash % 5) - 2) * 0.3; // -0.6 to 0.6 degrees
  };

  return (
    <div style={{ padding: "0 20px", marginTop: 40, paddingBottom: 80 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            letterSpacing: 3,
            textTransform: "uppercase",
            color: accent,
          }}
        >
          GUESTBOOK
        </span>
        <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "14px 16px",
                background: "#111",
                borderLeft: `3px solid ${accent}`,
                borderRadius: "0 8px 8px 0",
                transform: `rotate(${getRotation(c.id)}deg)`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'Syne', sans-serif",
                    color: "#e8e6e3",
                  }}
                >
                  {c.author_name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "'Space Mono', monospace",
                    color: "#333",
                  }}
                >
                  {timeAgo(c.created_at)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#e8e6e3",
                  lineHeight: 1.5,
                }}
              >
                {c.body}
              </div>
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
              padding: "10px 14px",
              background: "#0e0e0e",
              border: "1px solid #1e1e1e",
              borderRadius: 8,
              color: "#e8e6e3",
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
            placeholder="Sign the guestbook..."
            maxLength={140}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "#0e0e0e",
              border: "1px solid #1e1e1e",
              borderRadius: 8,
              color: "#e8e6e3",
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
              padding: "10px 18px",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              cursor: submitting || !body.trim() ? "not-allowed" : "pointer",
              background: accent,
              color: "#000",
              opacity: submitting || !body.trim() ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            Sign
          </button>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#333",
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
