import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

export default function TapeTradeInbox() {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myMixtapes, setMyMixtapes] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const [selectedMixtapeId, setSelectedMixtapeId] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!supabase || !user) return;
    loadTrades();
  }, [user]);

  const loadTrades = async () => {
    const { data } = await supabase
      .from("mixtape_trades")
      .select(
        `*,
        sender:profiles!sender_id(display_name, slug),
        receiver:profiles!receiver_id(display_name, slug),
        sender_mixtape:mixtapes!sender_mixtape_id(id, title),
        receiver_mixtape:mixtapes!receiver_mixtape_id(id, title)`
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setTrades(data || []);
    setLoading(false);
  };

  const loadMyMixtapes = async () => {
    const { data } = await supabase
      .from("mixtapes")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMyMixtapes(data || []);
  };

  const handleStartRespond = async (tradeId) => {
    setRespondingId(tradeId);
    setSelectedMixtapeId(null);
    await loadMyMixtapes();
  };

  const handleComplete = async (tradeId) => {
    if (!selectedMixtapeId) return;
    setProcessing(true);
    await supabase
      .from("mixtape_trades")
      .update({
        receiver_mixtape_id: selectedMixtapeId,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", tradeId);
    setRespondingId(null);
    setProcessing(false);
    await loadTrades();
  };

  const handleDecline = async (tradeId) => {
    setProcessing(true);
    await supabase
      .from("mixtape_trades")
      .update({ status: "declined" })
      .eq("id", tradeId);
    setProcessing(false);
    await loadTrades();
  };

  const handleCancel = async (tradeId) => {
    await supabase.from("mixtape_trades").delete().eq("id", tradeId);
    setTrades((prev) => prev.filter((t) => t.id !== tradeId));
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          textAlign: "center",
          color: palette.textMuted,
          fontSize: 12,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        Loading trades...
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <p
        style={{
          fontSize: 12,
          color: palette.textMuted,
          fontFamily: "'Space Mono', monospace",
          margin: 0,
        }}
      >
        No tape trades yet. Visit someone's mixtape and send a trade!
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {trades.map((trade) => {
        const isSender = trade.sender_id === user.id;
        const isReceiver = trade.receiver_id === user.id;
        const isPending = trade.status === "pending";
        const isCompleted = trade.status === "completed";
        const isDeclined = trade.status === "declined";

        return (
          <div
            key={trade.id}
            style={{
              padding: "12px 14px",
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 10,
            }}
          >
            {/* Status badge */}
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
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: isCompleted
                    ? palette.accent
                    : isDeclined
                    ? palette.textDim
                    : palette.coral,
                }}
              >
                {isCompleted
                  ? "COMPLETED"
                  : isDeclined
                  ? "DECLINED"
                  : isSender
                  ? "WAITING"
                  : "INCOMING"}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: palette.textDim,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {timeAgo(trade.created_at)}
              </span>
            </div>

            {/* Trade details */}
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              {isSender ? (
                <>
                  You sent{" "}
                  <Link
                    to={`/mixtape/${trade.sender_mixtape?.id}`}
                    style={{
                      color: palette.coral,
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    {trade.sender_mixtape?.title}
                  </Link>{" "}
                  to{" "}
                  <Link
                    to={`/${trade.receiver?.slug}`}
                    style={{ color: palette.accent, textDecoration: "none" }}
                  >
                    {trade.receiver?.display_name}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={`/${trade.sender?.slug}`}
                    style={{ color: palette.accent, textDecoration: "none" }}
                  >
                    {trade.sender?.display_name}
                  </Link>{" "}
                  sent you{" "}
                  <Link
                    to={`/mixtape/${trade.sender_mixtape?.id}`}
                    style={{
                      color: palette.coral,
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    {trade.sender_mixtape?.title}
                  </Link>
                </>
              )}
            </div>

            {/* Completed: show receiver's tape */}
            {isCompleted && trade.receiver_mixtape && (
              <div
                style={{
                  fontSize: 12,
                  color: palette.textMuted,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {isReceiver ? "You" : trade.receiver?.display_name} sent back{" "}
                <Link
                  to={`/mixtape/${trade.receiver_mixtape.id}`}
                  style={{
                    color: palette.coral,
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  {trade.receiver_mixtape.title}
                </Link>
              </div>
            )}

            {/* Pending actions */}
            {isPending && isSender && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: palette.textDim,
                    fontFamily: "'Space Mono', monospace",
                    flex: 1,
                    alignSelf: "center",
                  }}
                >
                  Waiting for response...
                </span>
                <button
                  onClick={() => handleCancel(trade.id)}
                  style={{
                    padding: "4px 10px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 6,
                    background: "transparent",
                    color: palette.textMuted,
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {isPending && isReceiver && respondingId !== trade.id && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => handleStartRespond(trade.id)}
                  style={{
                    padding: "6px 14px",
                    border: "none",
                    borderRadius: 8,
                    background: palette.coral,
                    color: "#000",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  Send one back
                </button>
                <button
                  onClick={() => handleDecline(trade.id)}
                  disabled={processing}
                  style={{
                    padding: "6px 14px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 8,
                    background: "transparent",
                    color: palette.textMuted,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  Decline
                </button>
              </div>
            )}

            {/* Respond picker */}
            {isPending && isReceiver && respondingId === trade.id && (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Space Mono', monospace",
                    color: palette.textMuted,
                    marginBottom: 8,
                  }}
                >
                  Pick a tape to send back:
                </div>
                {myMixtapes.length === 0 ? (
                  <div
                    style={{
                      fontSize: 11,
                      color: palette.textDim,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    You don't have any mixtapes yet.
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        maxHeight: 150,
                        overflowY: "auto",
                        marginBottom: 10,
                      }}
                    >
                      {myMixtapes.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMixtapeId(m.id)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "8px 12px",
                            border: `1px solid ${
                              selectedMixtapeId === m.id
                                ? palette.coral
                                : palette.border
                            }`,
                            borderRadius: 6,
                            background:
                              selectedMixtapeId === m.id
                                ? "rgba(255,107,107,0.1)"
                                : "transparent",
                            color: palette.text,
                            fontSize: 12,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleComplete(trade.id)}
                        disabled={!selectedMixtapeId || processing}
                        style={{
                          padding: "6px 14px",
                          border: "none",
                          borderRadius: 8,
                          background:
                            !selectedMixtapeId || processing
                              ? palette.border
                              : palette.accent,
                          color:
                            !selectedMixtapeId || processing
                              ? palette.textDim
                              : "#000",
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "'Space Mono', monospace",
                          cursor:
                            !selectedMixtapeId || processing
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {processing ? "Sending..." : "Complete Trade"}
                      </button>
                      <button
                        onClick={() => setRespondingId(null)}
                        style={{
                          padding: "6px 14px",
                          border: `1px solid ${palette.border}`,
                          borderRadius: 8,
                          background: "transparent",
                          color: palette.textMuted,
                          fontSize: 11,
                          fontFamily: "'Space Mono', monospace",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
