import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { palette } from "../lib/palette";

const inputStyle = { background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 8, color: "#e8e6e3", fontFamily: "'Syne', sans-serif", fontSize: 13, padding: "10px 12px", boxSizing: "border-box", outline: "none", width: "100%" };
const labelStyle = { fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function GuestBook({ wallId, isOwner }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    if (!supabase || !wallId) return;

    (async () => {
      const { data } = await supabase
        .from("guestbook")
        .select("*")
        .eq("wall_id", wallId)
        .order("created_at", { ascending: false });
      setEntries(data || []);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`guestbook-${wallId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guestbook",
          filter: `wall_id=eq.${wallId}`,
        },
        (payload) => {
          setEntries((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "guestbook",
          filter: `wall_id=eq.${wallId}`,
        },
        (payload) => {
          setEntries((prev) => prev.filter((e) => e.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wallId]);

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim() || honeypot) return;
    setSubmitting(true);
    const { error } = await supabase.from("guestbook").insert({
      wall_id: wallId,
      author_name: name.trim(),
      message: message.trim(),
    });
    if (!error) {
      setName("");
      setMessage("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!supabase) return;
    await supabase.from("guestbook").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div>
      {/* Sign form */}
      <div
        style={{
          background: "#111",
          border: `1px solid #1e1e1e`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          Sign the guest book
        </h3>

        {/* Honeypot */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
        />

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a note, shout out a favorite track, say hi..."
            rows={3}
            maxLength={280}
            style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
          />
          <div
            style={{
              textAlign: "right",
              fontSize: 10,
              color: "#333",
              fontFamily: "'Space Mono', monospace",
              marginTop: 4,
            }}
          >
            {message.length}/280
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !message.trim() || submitting}
          style={{
            padding: "10px 24px",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: !name.trim() || !message.trim() ? "not-allowed" : "pointer",
            background: !name.trim() || !message.trim() ? "#1e1e1e" : palette.accent,
            color: !name.trim() || !message.trim() ? "#333" : "#000",
            transition: "all 0.2s",
          }}
        >
          {submitting ? "Signing..." : "Sign"}
        </button>
      </div>

      {/* Entries */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#555",
            fontSize: 13,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#555",
            fontSize: 13,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          No entries yet. Be the first to sign!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: "#111",
                border: "1px solid #1e1e1e",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {entry.author_name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#333",
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {timeAgo(entry.created_at)}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      style={{
                        padding: "2px 6px",
                        border: "none",
                        background: "transparent",
                        color: "#333",
                        fontSize: 10,
                        cursor: "pointer",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      delete
                    </button>
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#555",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {entry.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
