import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function MixtapeJoinPage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      sessionStorage.setItem("mixtape_join_return", inviteCode);
      navigate("/login");
      return;
    }

    joinMixtape();
  }, [user, loading, inviteCode]);

  const joinMixtape = async () => {
    if (!supabase || joining) return;
    setJoining(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "join_mixtape_by_invite",
        { code: inviteCode }
      );
      if (rpcError) throw rpcError;
      navigate(`/mixtape/${data}`, { replace: true });
    } catch (e) {
      console.error("Join mixtape failed:", e);
      const msg = e.message?.includes("full")
        ? "This mixtape is full."
        : "Invalid or expired invite code.";
      setError(msg);
      setJoining(false);
    }
  };

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Couldn't Join Mixtape
        </h2>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {error}
        </p>
        <button
          onClick={() => navigate("/mixtapes")}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            background: palette.accent,
            color: "#000",
          }}
        >
          Go to Mixtapes
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        textAlign: "center",
        padding: 80,
        color: palette.textMuted,
        fontSize: 14,
        fontFamily: "'Space Mono', monospace",
      }}
    >
      Joining mixtape...
    </div>
  );
}
