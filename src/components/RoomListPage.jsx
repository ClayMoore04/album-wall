import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import NavBar from "./NavBar";

export default function RoomListPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!supabase || !user) return;
    loadRooms();
  }, [user]);

  const loadRooms = async () => {
    if (!supabase || !user) return;
    setLoadingRooms(true);

    const { data: memberships } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("user_id", user.id);

    if (!memberships?.length) {
      setRooms([]);
      setLoadingRooms(false);
      return;
    }

    const roomIds = memberships.map((m) => m.room_id);

    const { data: roomData } = await supabase
      .from("rooms")
      .select("*, profiles!created_by(display_name)")
      .in("id", roomIds)
      .order("created_at", { ascending: false });

    // Get counts for each room
    const roomsWithCounts = await Promise.all(
      (roomData || []).map(async (room) => {
        const [{ count: memberCount }, { count: trackCount }] =
          await Promise.all([
            supabase
              .from("room_members")
              .select("*", { count: "exact", head: true })
              .eq("room_id", room.id),
            supabase
              .from("room_tracks")
              .select("*", { count: "exact", head: true })
              .eq("room_id", room.id),
          ]);
        return { ...room, memberCount: memberCount || 0, trackCount: trackCount || 0 };
      })
    );

    setRooms(roomsWithCounts);
    setLoadingRooms(false);
  };

  const handleCreate = async () => {
    if (!supabase || !user || !newRoomName.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("rooms")
        .insert({ name: newRoomName.trim(), created_by: user.id })
        .select()
        .single();
      if (insertError) throw insertError;

      // Auto-join as creator
      await supabase
        .from("room_members")
        .insert({ room_id: data.id, user_id: user.id });

      navigate(`/room/${data.id}`);
    } catch (e) {
      console.error("Create room failed:", e);
      setError("Failed to create room");
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    navigate(`/room/join/${joinCode.trim()}`);
  };

  if (loading || !user) {
    return (
      <div
        style={{ textAlign: "center", padding: 80, color: palette.textMuted }}
      >
        Loading...
      </div>
    );
  }

  const inputStyle = {
    flex: 1,
    padding: "10px 14px",
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    color: palette.text,
    fontSize: 14,
    fontFamily: "'Syne', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const btnStyle = {
    padding: "10px 18px",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
    cursor: "pointer",
    background: palette.accent,
    color: "#000",
    flexShrink: 0,
  };

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 0" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Rooms<span style={{ color: palette.accent }}>.</span>
        </h1>
        <p
          style={{
            textAlign: "center",
            color: palette.textMuted,
            fontSize: 14,
            fontFamily: "'Space Mono', monospace",
            marginBottom: 28,
          }}
        >
          Build collaborative playlists with friends.
        </p>

        {/* Create room */}
        <div
          style={{
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="New room name..."
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              style={inputStyle}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newRoomName.trim()}
              style={{
                ...btnStyle,
                opacity: creating || !newRoomName.trim() ? 0.5 : 1,
              }}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {/* Join room */}
        <div
          style={{
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Paste invite code..."
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              style={inputStyle}
            />
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim()}
              style={{
                ...btnStyle,
                background: "transparent",
                border: `1px solid ${palette.border}`,
                color: palette.text,
                opacity: !joinCode.trim() ? 0.5 : 1,
              }}
            >
              Join
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: palette.coral,
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Room list */}
        {loadingRooms ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: palette.textMuted,
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: palette.textMuted,
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            No rooms yet. Create one or join with an invite code.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rooms.map((room) => (
              <Link
                key={room.id}
                to={`/room/${room.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: palette.cardBg,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 12,
                  textDecoration: "none",
                  color: palette.text,
                  transition: "border-color 0.2s",
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {room.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: palette.textMuted,
                      fontFamily: "'Space Mono', monospace",
                      marginTop: 4,
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    <span>
                      {room.memberCount} member
                      {room.memberCount !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {room.trackCount} track{room.trackCount !== 1 ? "s" : ""}
                    </span>
                    {room.profiles && (
                      <span style={{ color: palette.textDim }}>
                        by {room.profiles.display_name}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    color: palette.accent,
                    fontSize: 18,
                    fontWeight: 300,
                  }}
                >
                  {"\u2192"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
