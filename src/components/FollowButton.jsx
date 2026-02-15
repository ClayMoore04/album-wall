import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function FollowButton({ wallId, onCountChange }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user || !wallId) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", wallId)
        .maybeSingle();
      setFollowing(!!data);
      setLoading(false);
    })();
  }, [user, wallId]);

  const handleToggle = async () => {
    if (!supabase || !user || loading) return;
    setLoading(true);

    try {
      if (following) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", wallId);
        setFollowing(false);
        onCountChange?.(-1);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: wallId });
        setFollowing(true);
        onCountChange?.(1);
      }
    } catch (e) {
      console.error("Follow toggle failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === wallId) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        padding: "6px 16px",
        borderRadius: 20,
        border: following
          ? `1px solid ${palette.accent}`
          : `1px solid ${palette.border}`,
        background: following ? palette.accent : "transparent",
        color: following ? "#000" : palette.textMuted,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "'Space Mono', monospace",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "all 0.2s",
      }}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
