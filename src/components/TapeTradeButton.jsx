import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function TapeTradeButton({ mixtape }) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [myMixtapes, setMyMixtapes] = useState([]);
  const [loadingMixtapes, setLoadingMixtapes] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleOpen = async () => {
    setShowModal(true);
    setSent(false);
    setError(null);
    setSelectedId(null);
    setLoadingMixtapes(true);

    const { data } = await supabase
      .from("mixtapes")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setMyMixtapes(data || []);
    setLoadingMixtapes(false);
  };

  const handleSend = async () => {
    if (!selectedId || !supabase) return;
    setSending(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("mixtape_trades")
      .insert({
        sender_id: user.id,
        receiver_id: mixtape.user_id,
        sender_mixtape_id: selectedId,
      });

    if (insertError) {
      setError(insertError.message || "Failed to send trade");
      setSending(false);
      return;
    }

    setSending(false);
    setSent(true);
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          padding: "4px 12px",
          borderRadius: 6,
          border: `1px solid ${palette.border}`,
          background: "transparent",
          color: palette.coral,
          fontSize: 10,
          fontFamily: "'Space Mono', monospace",
          cursor: "pointer",
        }}
      >
        Trade a tape
      </button>

      {showModal && (
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
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            style={{
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 380,
              margin: "0 20px",
            }}
          >
            {sent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                  Trade Sent!
                </div>
                <p
                  style={{
                    color: palette.textMuted,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    marginBottom: 20,
                    lineHeight: 1.5,
                  }}
                >
                  They'll get your tape and can send one back.
                </p>
                <button
                  onClick={() => setShowModal(false)}
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
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}
                >
                  Trade a Tape
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: palette.textMuted,
                    fontFamily: "'Space Mono', monospace",
                    marginBottom: 20,
                    lineHeight: 1.5,
                  }}
                >
                  Send one of your mixtapes to{" "}
                  {mixtape.profiles?.display_name || "them"} in exchange for
                  theirs.
                </div>

                {loadingMixtapes ? (
                  <div
                    style={{
                      padding: 20,
                      textAlign: "center",
                      color: palette.textMuted,
                      fontSize: 12,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    Loading your mixtapes...
                  </div>
                ) : myMixtapes.length === 0 ? (
                  <div
                    style={{
                      padding: 20,
                      textAlign: "center",
                      color: palette.textMuted,
                      fontSize: 12,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    You don't have any mixtapes yet. Create one first!
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      maxHeight: 200,
                      overflowY: "auto",
                      marginBottom: 16,
                    }}
                  >
                    {myMixtapes.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedId(m.id)}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 14px",
                          border: `1px solid ${
                            selectedId === m.id ? palette.coral : palette.border
                          }`,
                          borderRadius: 8,
                          background:
                            selectedId === m.id
                              ? "rgba(255,107,107,0.1)"
                              : "transparent",
                          color: palette.text,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      fontSize: 12,
                      color: palette.coral,
                      fontFamily: "'Space Mono', monospace",
                      marginBottom: 12,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleSend}
                    disabled={!selectedId || sending}
                    style={{
                      flex: 1,
                      padding: "12px",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      cursor:
                        !selectedId || sending ? "not-allowed" : "pointer",
                      background:
                        !selectedId || sending ? palette.border : palette.coral,
                      color: !selectedId || sending ? palette.textDim : "#000",
                      transition: "all 0.2s",
                    }}
                  >
                    {sending ? "Sending..." : "Send Trade"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "12px 20px",
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
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
