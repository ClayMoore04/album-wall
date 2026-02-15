import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function RoomJoinPage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      sessionStorage.setItem("room_join_return", inviteCode);
      navigate("/login");
      return;
    }

    joinRoom();
  }, [user, loading, inviteCode]);

  const joinRoom = async () => {
    if (!supabase || joining) return;
    setJoining(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "join_room_by_invite",
        { code: inviteCode }
      );
      if (rpcError) throw rpcError;
      navigate(`/room/${data}`, { replace: true });
    } catch (e) {
      console.error("Join room failed:", e);
      setError("Invalid or expired invite code.");
      setJoining(false);
    }
  };

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔗</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Couldn't Join Room
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
          onClick={() => navigate("/rooms")}
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
          Go to Rooms
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
      Joining room...
    </div>
  );
}
