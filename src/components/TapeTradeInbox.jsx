import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette, noiseOverlay } from "../lib/palette";
import { extractColor, hexToRgb } from "../lib/colorExtract";
import { injectAnimations } from "../lib/animations";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TapeUnboxing({ trade, onOpen }) {
  // sealed -> unwrapping -> revealing -> revealed
  const [phase, setPhase] = useState("sealed");
  const [coverUrl, setCoverUrl] = useState(null);
  const [artColor, setArtColor] = useState(null);

  useEffect(() => { injectAnimations(); }, []);

  // Fetch cover art for the sender's mixtape
  useEffect(() => {
    if (!supabase || !trade.sender_mixtape?.id) return;
    (async () => {
      const { data } = await supabase
        .from("mixtape_tracks")
        .select("album_art_url")
        .eq("mixtape_id", trade.sender_mixtape.id)
        .order("position", { ascending: true })
        .limit(1);
      const url = data?.[0]?.album_art_url;
      if (url) {
        setCoverUrl(url);
        const color = await extractColor(url);
        if (color) setArtColor(color);
      }
    })();
  }, [trade.sender_mixtape?.id]);

  const tintHex = artColor || "#ef4444";
  const tintRgb = hexToRgb(tintHex);

  const handleOpen = () => {
    setPhase("unwrapping");
    setTimeout(() => {
      setPhase("revealing");
      setTimeout(() => {
        setPhase("revealed");
        setTimeout(() => onOpen(), 800);
      }, 1000);
    }, 1200);
  };

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        cursor: phase === "sealed" ? "pointer" : "default",
        minHeight: 180,
      }}
      onClick={phase === "sealed" ? handleOpen : undefined}
    >
      {/* Base layer: dark surface with accent gradient (visible after paper tears) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, rgba(${tintRgb},0.12) 0%, #0a0a0a 70%)`,
          transition: "background 0.6s ease",
        }}
      />

      {/* Noise texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...noiseOverlay,
          pointerEvents: "none",
        }}
      />

      {/* Paper wrapping layer (tears away on unwrap) */}
      <AnimatePresence>
        {(phase === "sealed" || phase === "unwrapping") && (
          <motion.div
            initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
            animate={
              phase === "unwrapping"
                ? { clipPath: "inset(50% 50% 50% 50%)" }
                : { clipPath: "inset(0% 0% 0% 0%)" }
            }
            exit={{ clipPath: "inset(50% 50% 50% 50%)", opacity: 0 }}
            transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(145deg, #8B7355 0%, #A0855C 25%, #8B7355 50%, #9C8050 75%, #8B7355 100%)`,
              backgroundSize: "200% 200%",
              animation: phase === "sealed" ? "booth-shimmer 4s ease-in-out infinite" : "none",
              borderRadius: 14,
              zIndex: 2,
            }}
          >
            {/* Paper texture lines */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `repeating-linear-gradient(
                  90deg,
                  transparent 0px,
                  rgba(0,0,0,0.03) 1px,
                  transparent 2px,
                  transparent 6px
                )`,
                borderRadius: 14,
              }}
            />
            {/* String/ribbon across paper */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent, rgba(${tintRgb},0.5), transparent)`,
                transform: "translateY(-50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 2,
                background: `linear-gradient(180deg, transparent, rgba(${tintRgb},0.5), transparent)`,
                transform: "translateX(-50%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content layer */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: 24,
          textAlign: "center",
          minHeight: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Sealed: cassette icon with breathing animation */}
        {phase === "sealed" && (
          <div style={{ position: "relative", zIndex: 3 }}>
            <div
              style={{
                fontSize: 40,
                marginBottom: 12,
                animation: "booth-breathe 3s ease-in-out infinite",
              }}
            >
              📼
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              <span style={{ color: tintHex, transition: "color 0.6s" }}>
                {trade.sender?.display_name}
              </span>{" "}
              made you a mixtape
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#555",
                fontFamily: "'Space Mono', monospace",
                animation: "skeleton-pulse 2s ease-in-out infinite",
              }}
            >
              tap to open
            </div>
          </div>
        )}

        {/* Unwrapping: cassette scales up and starts spinning */}
        {phase === "unwrapping" && (
          <motion.div
            initial={{ scale: 1, rotateY: 0 }}
            animate={{ scale: 1.3, rotateY: 180 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            style={{ fontSize: 48, perspective: 600 }}
          >
            📼
          </motion.div>
        )}

        {/* Revealing: flip to cover art with spring bounce */}
        {phase === "revealing" && (
          <motion.div
            initial={{ rotateY: 180, scale: 1.3 }}
            animate={{ rotateY: 360, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              perspective: 600,
            }}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 10,
                  objectFit: "cover",
                  boxShadow: `0 8px 24px rgba(${tintRgb},0.3)`,
                  marginBottom: 14,
                }}
              />
            ) : (
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 10,
                  background: `rgba(${tintRgb},0.2)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  marginBottom: 14,
                }}
              >
                🎶
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ fontSize: 16, fontWeight: 700 }}
            >
              {trade.sender_mixtape?.title}
            </motion.div>
          </motion.div>
        )}

        {/* Revealed: final state with CTA */}
        {phase === "revealed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  objectFit: "cover",
                  boxShadow: `0 6px 20px rgba(${tintRgb},0.25)`,
                  marginBottom: 12,
                }}
              />
            ) : (
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  background: `rgba(${tintRgb},0.15)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  marginBottom: 12,
                }}
              >
                🎶
              </div>
            )}
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              {trade.sender_mixtape?.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#555",
                fontFamily: "'Space Mono', monospace",
                marginBottom: 14,
              }}
            >
              from {trade.sender?.display_name}
            </div>
            <Link
              to={`/mixtape/${trade.sender_mixtape?.id}`}
              style={{
                display: "inline-block",
                padding: "8px 20px",
                borderRadius: 8,
                background: tintHex,
                color: "#000",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                textDecoration: "none",
                transition: "background 0.3s",
              }}
            >
              Listen now
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function TapeTradeInbox() {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myMixtapes, setMyMixtapes] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const [selectedMixtapeId, setSelectedMixtapeId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [openedTrades, setOpenedTrades] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("booth_opened_trades") || "[]"));
    } catch { return new Set(); }
  });

  const markTradeOpened = (tradeId) => {
    setOpenedTrades((prev) => {
      const next = new Set(prev);
      next.add(tradeId);
      localStorage.setItem("booth_opened_trades", JSON.stringify([...next]));
      return next;
    });
  };

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
          color: "#555",
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
          color: "#555",
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

        // Show unboxing animation for incoming trades not yet opened
        if (isPending && isReceiver && !openedTrades.has(trade.id)) {
          return (
            <TapeUnboxing
              key={trade.id}
              trade={trade}
              onOpen={() => markTradeOpened(trade.id)}
            />
          );
        }

        return (
          <div
            key={trade.id}
            style={{
              padding: "12px 14px",
              background: "#111",
              border: "1px solid #1e1e1e",
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
                    ? "#333"
                    : "#ef4444",
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
                  color: "#333",
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
                      color: "#ef4444",
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
                      color: "#ef4444",
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
                  color: "#555",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {isReceiver ? "You" : trade.receiver?.display_name} sent back{" "}
                <Link
                  to={`/mixtape/${trade.receiver_mixtape.id}`}
                  style={{
                    color: "#ef4444",
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
                    color: "#333",
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
                    border: "1px solid #1e1e1e",
                    borderRadius: 6,
                    background: "transparent",
                    color: "#555",
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
                    background: "#ef4444",
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
                    border: "1px solid #1e1e1e",
                    borderRadius: 8,
                    background: "transparent",
                    color: "#555",
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
                    color: "#555",
                    marginBottom: 8,
                  }}
                >
                  Pick a tape to send back:
                </div>
                {myMixtapes.length === 0 ? (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#333",
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
                                ? "#ef4444"
                                : "#1e1e1e"
                            }`,
                            borderRadius: 6,
                            background:
                              selectedMixtapeId === m.id
                                ? "rgba(239,68,68,0.1)"
                                : "transparent",
                            color: "#e8e6e3",
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
                              ? "#1e1e1e"
                              : palette.accent,
                          color:
                            !selectedMixtapeId || processing
                              ? "#333"
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
                          border: "1px solid #1e1e1e",
                          borderRadius: 8,
                          background: "transparent",
                          color: "#555",
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
