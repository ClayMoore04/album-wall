import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { injectAnimations } from "../lib/animations";

const REACTIONS = [
  { key: "fire", emoji: "\uD83D\uDD25" },
  { key: "heart", emoji: "\u2764\uFE0F" },
  { key: "headphones", emoji: "\uD83C\uDFA7" },
  { key: "mind_blown", emoji: "\uD83E\uDD2F" },
];

export default function ReactionBar({ submissionId, reactions = {} }) {
  const [counts, setCounts] = useState(reactions);
  const [poppingKey, setPoppingKey] = useState(null);

  useEffect(() => { injectAnimations(); }, []);

  const storageKey = `booth_reactions_${submissionId}`;

  const getReacted = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  };

  const handleReaction = async (key) => {
    const reacted = getReacted();
    if (reacted.includes(key)) return;

    // Optimistic update + pop animation
    setCounts((prev) => ({
      ...prev,
      [key]: (parseInt(prev[key]) || 0) + 1,
    }));
    setPoppingKey(key);
    setTimeout(() => setPoppingKey(null), 350);

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify([...reacted, key]));

    // Call RPC
    if (supabase) {
      try {
        await supabase.rpc("add_reaction", {
          submission_id: submissionId,
          reaction_type: key,
        });
      } catch (e) {
        console.error("Reaction failed:", e);
      }
    }
  };

  const reacted = getReacted();

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      {REACTIONS.map(({ key, emoji }) => {
        const count = parseInt(counts[key]) || 0;
        const hasReacted = reacted.includes(key);
        return (
          <button
            key={key}
            onClick={() => handleReaction(key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 16,
              border: hasReacted
                ? "1px solid #1DB954"
                : "1px solid #1e1e1e",
              background: hasReacted ? "rgba(29,185,84,0.1)" : "transparent",
              cursor: hasReacted ? "default" : "pointer",
              fontSize: 13,
              color: "#e8e6e3",
              fontFamily: "'Space Mono', monospace",
              transition: "all 0.15s",
              opacity: hasReacted ? 0.8 : 1,
            }}
          >
            <span style={poppingKey === key ? { display: "inline-block", animation: "itb-emojiPop 0.35s ease" } : undefined}>{emoji}</span>
            {count > 0 && (
              <span style={{ fontSize: 11, color: "#555" }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
