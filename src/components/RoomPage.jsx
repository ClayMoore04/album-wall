import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import NavBar from "./NavBar";
import SpotifySearch from "./SpotifySearch";
import RoomTrackCard from "./RoomTrackCard";

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Load room data
  useEffect(() => {
    if (!supabase || !user || !roomId) return;

    let cancelled = false;

    (async () => {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError || !roomData) {
        if (!cancelled) setNotFound(true);
        setLoadingRoom(false);
        return;
      }
      if (!cancelled) setRoom(roomData);

      // Load members with profile info
      const { data: memberData } = await supabase
        .from("room_members")
        .select("*, profiles!user_id(id, display_name, slug)")
        .eq("room_id", roomId);
      if (!cancelled) setMembers(memberData || []);

      // Load tracks with added_by profile
      const { data: trackData } = await supabase
        .from("room_tracks")
        .select("*, profiles!added_by(display_name)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });
      if (!cancelled) setTracks(trackData || []);

      if (!cancelled) setLoadingRoom(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, roomId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!supabase || !roomId) return;

    const trackChannel = supabase
      .channel(`room-tracks-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_tracks",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch full track with profile
          const { data } = await supabase
            .from("room_tracks")
            .select("*, profiles!added_by(display_name)")
            .eq("id", payload.new.id)
            .single();
          if (data) setTracks((prev) => [data, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "room_tracks",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setTracks((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      )
      .subscribe();

    const memberChannel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          // Reload members
          const { data } = await supabase
            .from("room_members")
            .select("*, profiles!user_id(id, display_name, slug)")
            .eq("room_id", roomId);
          setMembers(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(trackChannel);
      supabase.removeChannel(memberChannel);
    };
  }, [roomId]);

  const handleAddTrack = useCallback(
    async (item) => {
      if (!supabase || !user) return;

      const { error } = await supabase.from("room_tracks").insert({
        room_id: roomId,
        album_name: item.name,
        artist_name: item.artist,
        album_art_url: item.imageUrl || "",
        spotify_url: item.spotifyUrl || "",
        spotify_id: item.id || "",
        type: item.type || "album",
        added_by: user.id,
      });
      if (error) console.error("Failed to add track:", error);
    },
    [roomId, user]
  );

  const handleRemoveTrack = async (trackId) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("room_tracks")
      .delete()
      .eq("id", trackId);
    if (error) console.error("Failed to remove track:", error);
  };

  const handleCopyInvite = () => {
    if (!room) return;
    const url = `${window.location.origin}/room/join/${room.invite_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (!supabase || !user) return;
    await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", user.id);
    navigate("/rooms");
  };

  if (loading || loadingRoom) {
    return (
      <div
        style={{ textAlign: "center", padding: 80, color: palette.textMuted }}
      >
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Room Not Found
        </h2>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          This room doesn't exist or you're not a member.
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

  const isCreator = user && room && user.id === room.created_by;

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 0" }}>
        {/* Room header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: "0 0 8px",
            }}
          >
            {room.name}
          </h1>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              onClick={handleCopyInvite}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: `1px solid ${palette.border}`,
                background: "transparent",
                color: copied ? palette.accent : palette.textMuted,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              {copied ? "Copied!" : "Copy invite link"}
            </button>
            {!isCreator && (
              <button
                onClick={handleLeave}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1px solid ${palette.border}`,
                  background: "transparent",
                  color: palette.coral,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                }}
              >
                Leave
              </button>
            )}
          </div>
        </div>

        {/* Members */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          {members.map((m) => (
            <span
              key={m.user_id}
              style={{
                padding: "4px 10px",
                borderRadius: 12,
                background: palette.surface,
                border: `1px solid ${palette.border}`,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                color:
                  m.user_id === room.created_by
                    ? palette.accent
                    : palette.text,
              }}
            >
              {m.profiles?.display_name || "Member"}
            </span>
          ))}
        </div>

        {/* Search + add tracks */}
        <div
          style={{
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              color: palette.textMuted,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Add to playlist
          </div>
          <SpotifySearch onSelect={handleAddTrack} />
        </div>

        {/* Track list */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            color: palette.textMuted,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Playlist ({tracks.length} track{tracks.length !== 1 ? "s" : ""})
        </div>

        {tracks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: palette.textMuted,
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            No tracks yet. Search and add some!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tracks.map((track) => (
              <RoomTrackCard
                key={track.id}
                track={track}
                addedByName={track.profiles?.display_name}
                canRemove={true}
                onRemove={handleRemoveTrack}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
