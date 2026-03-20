import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/AuthProvider";
import {
  getValidAccessToken,
  isSpotifyConnected,
  startSpotifyAuth,
} from "../lib/spotifyAuth";

const MAX_DURATION_MS = 90 * 60 * 1000; // 90 minutes
const SIDE_DURATION_MS = 45 * 60 * 1000;

export function formatMs(ms) {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getWhoseTurn(mixtape, collaborators, tracks) {
  const participants = [
    {
      userId: mixtape.user_id,
      displayName: mixtape.profiles?.display_name || "Owner",
    },
    ...collaborators
      .sort((a, b) => a.turn_order - b.turn_order)
      .map((c) => ({
        userId: c.user_id,
        displayName: c.profiles?.display_name || "Collaborator",
      })),
  ];
  if (participants.length === 0) return null;
  const turnIndex = tracks.length % participants.length;
  return { ...participants[turnIndex], turnIndex };
}

export default function useMixtapeData() {
  const { id: mixtapeId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [mixtape, setMixtape] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loadingMixtape, setLoadingMixtape] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingTheme, setEditingTheme] = useState(false);
  const [themeValue, setThemeValue] = useState("");
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesValue, setNotesValue] = useState("");
  const [tapeWarning, setTapeWarning] = useState(null);
  const [contributorName, setContributorName] = useState("");
  const [copied, setCopied] = useState(false);
  const [collabCopied, setCollabCopied] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [topPlayerIndex, setTopPlayerIndex] = useState(null);
  const [copiedTracks, setCopiedTracks] = useState(false);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState(null);

  // Load mixtape data
  useEffect(() => {
    if (!supabase || !mixtapeId) return;
    let cancelled = false;

    (async () => {
      const { data: mixtapeData, error: mixtapeError } = await supabase
        .from("mixtapes")
        .select("*, profiles!user_id(display_name, slug)")
        .eq("id", mixtapeId)
        .single();

      if (mixtapeError || !mixtapeData) {
        if (!cancelled) setNotFound(true);
        setLoadingMixtape(false);
        return;
      }
      if (!cancelled) {
        setMixtape(mixtapeData);
        setTitleValue(mixtapeData.title);
        setThemeValue(mixtapeData.theme || "");
        setPlaylistName(mixtapeData.title);
      }

      const trackQuery = supabase
        .from("mixtape_tracks")
        .select("*, profiles:added_by_user_id(display_name)")
        .eq("mixtape_id", mixtapeId)
        .order("position", { ascending: true });

      const { data: trackData } = await trackQuery;

      if (!cancelled) {
        setTracks(trackData || []);
      }

      if (mixtapeData.is_collab) {
        const { data: collabData } = await supabase
          .from("mixtape_collaborators")
          .select("*, profiles!user_id(id, display_name, slug)")
          .eq("mixtape_id", mixtapeId)
          .order("turn_order", { ascending: true });
        if (!cancelled) setCollaborators(collabData || []);
      }

      if (!cancelled) setLoadingMixtape(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [mixtapeId]);

  // Realtime subscriptions for collab tapes
  useEffect(() => {
    if (!supabase || !mixtapeId || !mixtape?.is_collab) return;

    const trackChannel = supabase
      .channel(`mixtape-tracks-${mixtapeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mixtape_tracks",
          filter: `mixtape_id=eq.${mixtapeId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("mixtape_tracks")
            .select("*, profiles:added_by_user_id(display_name)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setTracks((prev) => {
              if (prev.some((t) => t.id === data.id)) return prev;
              return [...prev, data].sort((a, b) => a.position - b.position);
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "mixtape_tracks",
          filter: `mixtape_id=eq.${mixtapeId}`,
        },
        (payload) => {
          setTracks((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      )
      .subscribe();

    const collabChannel = supabase
      .channel(`mixtape-collabs-${mixtapeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mixtape_collaborators",
          filter: `mixtape_id=eq.${mixtapeId}`,
        },
        async () => {
          const { data } = await supabase
            .from("mixtape_collaborators")
            .select("*, profiles!user_id(id, display_name, slug)")
            .eq("mixtape_id", mixtapeId)
            .order("turn_order", { ascending: true });
          setCollaborators(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(trackChannel);
      supabase.removeChannel(collabChannel);
    };
  }, [mixtapeId, mixtape?.is_collab]);

  // Derived state
  const totalMs = tracks.reduce((sum, t) => sum + t.duration_ms, 0);
  const remainingMs = MAX_DURATION_MS - totalMs;
  const isOwner = user && mixtape && user.id === mixtape.user_id;
  const isCollaborator =
    user && collaborators.some((c) => c.user_id === user.id);
  const canEdit = isOwner;
  const connected = isSpotifyConnected();

  const currentTurn =
    mixtape?.is_collab && mixtape?.collab_mode === "turns" && collaborators.length > 0
      ? getWhoseTurn(mixtape, collaborators, tracks)
      : null;
  const isMyTurn = !currentTurn || currentTurn.userId === user?.id;
  const canAddTrack = isOwner || isCollaborator || !mixtape?.is_collab;
  const canAddTrackNow = canAddTrack && isMyTurn;

  // Side A / Side B split
  let sideBStartIndex = tracks.length;
  {
    let cumMs = 0;
    for (let i = 0; i < tracks.length; i++) {
      if (cumMs >= SIDE_DURATION_MS) {
        sideBStartIndex = i;
        break;
      }
      cumMs += tracks[i].duration_ms;
    }
  }
  const sideATracks = tracks.slice(0, sideBStartIndex);
  const sideBTracks = tracks.slice(sideBStartIndex);
  const sideAMs = sideATracks.reduce((s, t) => s + t.duration_ms, 0);
  const sideBMs = sideBTracks.reduce((s, t) => s + t.duration_ms, 0);

  const progressPercent = Math.min(100, (totalMs / MAX_DURATION_MS) * 100);
  const isOverTime = totalMs > MAX_DURATION_MS;
  const isNearFull = totalMs / MAX_DURATION_MS > 0.8;

  // Mutations
  const handleAddTrack = useCallback(
    async (item) => {
      if (!supabase || !mixtapeId) return;

      if (mixtape?.is_collab && mixtape?.collab_mode === "turns" && currentTurn) {
        if (currentTurn.userId !== user?.id) return;
      }

      const newTotalMs = totalMs + (item.durationMs || 0);
      if (newTotalMs > MAX_DURATION_MS) {
        setTapeWarning(
          `Tape is full! Adding this puts you at ${formatMs(newTotalMs)}`
        );
        setTimeout(() => setTapeWarning(null), 3000);
      }

      const nextPosition = tracks.length;

      const { data, error } = await supabase
        .from("mixtape_tracks")
        .insert({
          mixtape_id: mixtapeId,
          position: nextPosition,
          track_name: item.name,
          artist_name: item.artist,
          album_name: item.albumName || "",
          album_art_url: item.imageUrl || "",
          spotify_url: item.spotifyUrl || "",
          spotify_id: item.id,
          duration_ms: item.durationMs || 0,
          added_by_name: isOwner ? "" : contributorName.trim(),
          added_by_user_id: user?.id || null,
        })
        .select("*, profiles:added_by_user_id(display_name)")
        .single();

      if (!error && data) {
        setTracks((prev) => [...prev, data]);
      }
    },
    [mixtapeId, tracks.length, totalMs, isOwner, contributorName, mixtape, currentTurn, user]
  );

  const handleRemove = async (trackId) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("mixtape_tracks")
      .delete()
      .eq("id", trackId);
    if (!error) {
      setTracks((prev) => {
        const updated = prev.filter((t) => t.id !== trackId);
        return updated.map((t, i) => ({ ...t, position: i }));
      });
      const remaining = tracks.filter((t) => t.id !== trackId);
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from("mixtape_tracks")
          .update({ position: i })
          .eq("id", remaining[i].id);
      }
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= tracks.length) return;

    const newTracks = [...tracks];
    [newTracks[index], newTracks[targetIndex]] = [
      newTracks[targetIndex],
      newTracks[index],
    ];
    const updated = newTracks.map((t, i) => ({ ...t, position: i }));
    setTracks(updated);

    await Promise.all([
      supabase
        .from("mixtape_tracks")
        .update({ position: updated[index].position })
        .eq("id", updated[index].id),
      supabase
        .from("mixtape_tracks")
        .update({ position: updated[targetIndex].position })
        .eq("id", updated[targetIndex].id),
    ]);
  };

  const handleSaveNotes = async () => {
    if (!supabase || !editingNotesId) return;
    await supabase
      .from("mixtape_tracks")
      .update({ liner_notes: notesValue })
      .eq("id", editingNotesId);
    setTracks((prev) =>
      prev.map((t) =>
        t.id === editingNotesId ? { ...t, liner_notes: notesValue } : t
      )
    );
    setEditingNotesId(null);
  };

  const handleSaveTitle = async () => {
    if (!supabase || !mixtape || !titleValue.trim()) return;
    await supabase
      .from("mixtapes")
      .update({ title: titleValue.trim(), updated_at: new Date().toISOString() })
      .eq("id", mixtape.id);
    setMixtape((prev) => ({ ...prev, title: titleValue.trim() }));
    setEditingTitle(false);
  };

  const handleSaveTheme = async () => {
    if (!supabase || !mixtape) return;
    await supabase
      .from("mixtapes")
      .update({ theme: themeValue.trim(), updated_at: new Date().toISOString() })
      .eq("id", mixtape.id);
    setMixtape((prev) => ({ ...prev, theme: themeValue.trim() }));
    setEditingTheme(false);
  };

  const handleCoverChange = async (index) => {
    if (!supabase || !mixtape) return;
    await supabase
      .from("mixtapes")
      .update({
        cover_art_index: index,
        custom_cover_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mixtape.id);
    setMixtape((prev) => ({ ...prev, cover_art_index: index, custom_cover_url: null }));
    setShowCoverPicker(false);
  };

  const handleSaveCustomCover = async (url, jsonData, shape) => {
    if (!supabase || !mixtape) return;
    await supabase
      .from("mixtapes")
      .update({
        custom_cover_url: url,
        custom_cover_data: jsonData,
        custom_cover_shape: shape,
        cover_art_index: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mixtape.id);
    setMixtape((prev) => ({
      ...prev,
      custom_cover_url: url,
      custom_cover_data: jsonData,
      custom_cover_shape: shape,
      cover_art_index: null,
    }));
  };

  const handleDelete = async () => {
    if (!supabase || !mixtape) return;
    if (!window.confirm("Delete this mixtape? This cannot be undone.")) return;
    await supabase.from("mixtapes").delete().eq("id", mixtape.id);
    navigate("/mixtapes");
  };

  const handleToggleCollabMode = async () => {
    if (!supabase || !mixtape) return;
    const newMode = mixtape.collab_mode === "turns" ? "open" : "turns";
    await supabase
      .from("mixtapes")
      .update({ collab_mode: newMode, updated_at: new Date().toISOString() })
      .eq("id", mixtape.id);
    setMixtape((prev) => ({ ...prev, collab_mode: newMode }));
  };

  const handleToggleVisibility = async () => {
    if (!supabase || !mixtape) return;
    const newVal = !mixtape.is_public;
    await supabase
      .from("mixtapes")
      .update({ is_public: newVal, updated_at: new Date().toISOString() })
      .eq("id", mixtape.id);
    setMixtape((prev) => ({ ...prev, is_public: newVal }));
  };

  const handleLeave = async () => {
    if (!supabase || !user) return;
    await supabase
      .from("mixtape_collaborators")
      .delete()
      .eq("mixtape_id", mixtape.id)
      .eq("user_id", user.id);
    navigate("/mixtapes");
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        setExportError("Spotify session expired. Please reconnect.");
        setExporting(false);
        return;
      }

      const res = await fetch("/api/spotify-create-mixtape-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          playlist_name: playlistName,
          description: `Mixtape: ${mixtape.title} — Created on The Booth`,
          is_public: isPublic,
          track_ids: tracks.map((t) => t.spotify_id),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create playlist");
      }

      const data = await res.json();
      setExportResult(data);
    } catch (e) {
      console.error("Export error:", e);
      setExportError(e.message || "Failed to create playlist");
    } finally {
      setExporting(false);
    }
  };

  return {
    // IDs & navigation
    mixtapeId,
    navigate,

    // Auth
    user,
    loading,

    // Core data
    mixtape,
    setMixtape,
    tracks,
    setTracks,
    collaborators,
    loadingMixtape,
    notFound,

    // Editing state
    editingTitle,
    setEditingTitle,
    titleValue,
    setTitleValue,
    editingTheme,
    setEditingTheme,
    themeValue,
    setThemeValue,
    editingNotesId,
    setEditingNotesId,
    notesValue,
    setNotesValue,
    tapeWarning,
    contributorName,
    setContributorName,
    copied,
    setCopied,
    collabCopied,
    setCollabCopied,
    showCoverPicker,
    setShowCoverPicker,
    playingTrackId,
    setPlayingTrackId,
    topPlayerIndex,
    setTopPlayerIndex,
    copiedTracks,
    setCopiedTracks,

    // Export
    showExportModal,
    setShowExportModal,
    playlistName,
    setPlaylistName,
    isPublic,
    setIsPublic,
    exporting,
    exportResult,
    setExportResult,
    exportError,
    handleExport,

    // Derived
    totalMs,
    remainingMs,
    isOwner,
    isCollaborator,
    canEdit,
    connected,
    currentTurn,
    isMyTurn,
    canAddTrack,
    canAddTrackNow,
    sideBStartIndex,
    sideATracks,
    sideBTracks,
    sideAMs,
    sideBMs,
    progressPercent,
    isOverTime,
    isNearFull,

    // Mutations
    handleAddTrack,
    handleRemove,
    handleMove,
    handleSaveNotes,
    handleSaveTitle,
    handleSaveTheme,
    handleCoverChange,
    handleSaveCustomCover,
    handleDelete,
    handleToggleCollabMode,
    handleToggleVisibility,
    handleLeave,

    // Constants
    MAX_DURATION_MS,
    startSpotifyAuth,
  };
}
