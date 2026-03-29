import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

export default function BookmarkButton({ mixtapeId, size = "default" }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!supabase || !mixtapeId) return;
    (async () => {
      // Get count
      const { count: total } = await supabase
        .from("bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("mixtape_id", mixtapeId);
      setCount(total || 0);

      // Check if current user has bookmarked
      if (user) {
        const { data } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("mixtape_id", mixtapeId)
          .maybeSingle();
        setSaved(!!data);
      }
      setLoading(false);
    })();
  }, [mixtapeId, user]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !supabase) return;

    if (saved) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("mixtape_id", mixtapeId);
      setSaved(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, mixtape_id: mixtapeId });
      setSaved(true);
      setCount((c) => c + 1);
    }
  };

  if (loading || !user) return null;

  const isCompact = size === "compact";

  return (
    <motion.button
      onClick={handleToggle}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: isCompact ? "4px 8px" : "6px 12px",
        border: saved ? "1px solid rgba(236,72,153,0.4)" : "1px solid #1e1e1e",
        borderRadius: isCompact ? 6 : 8,
        background: saved ? "rgba(236,72,153,0.1)" : "transparent",
        color: saved ? "#ec4899" : "#555",
        fontSize: isCompact ? 10 : 12,
        fontWeight: 600,
        fontFamily: "'Space Mono', monospace",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <motion.span
        animate={saved ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        style={{ fontSize: isCompact ? 12 : 14, lineHeight: 1 }}
      >
        {saved ? "♥" : "♡"}
      </motion.span>
      {count > 0 && <span>{count}</span>}
    </motion.button>
  );
}
