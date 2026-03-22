import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { useToast } from "./Toast";
import { palette } from "../lib/palette";
import { getThemeAccent, getBannerCss } from "../lib/themes";
import Header from "./Header";
import FollowButton from "./FollowButton";
import TabToggle from "./TabToggle";
import SubmitForm from "./SubmitForm";
import Wall from "./Wall";
import Stats from "./Stats";
import PlaylistBuilder from "./PlaylistBuilder";
import Celebration from "./Celebration";
import GuestBook from "./GuestBook";
import TasteCard from "./TasteCard";

export default function WallPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("wall");
  const [showSubmitDrawer, setShowSubmitDrawer] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newSubmissionCount, setNewSubmissionCount] = useState(0);
  const { showToast } = useToast();

  const isOwner = user && profile && user.id === profile.id;
  const ownerName = profile?.display_name || "Someone";
  const themeAccent = getThemeAccent(profile?.theme);
  const pinnedIds = profile?.pinned_submission_ids || [];

  // Load profile + submissions
  useEffect(() => {
    if (!supabase || !slug) return;

    let cancelled = false;

    (async () => {
      // Load profile
      const { data: prof, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", slug)
        .single();

      if (profError || !prof) {
        if (!cancelled) setNotFound(true);
        setLoading(false);
        return;
      }
      if (!cancelled) setProfile(prof);

      // Load submissions
      const { data: subs, error: subError } = await supabase
        .from("submissions")
        .select("*")
        .eq("wall_id", prof.id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setSubmissions(subs || []);
        setLoading(false);
      }

      // Fetch follower count
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", prof.id);
      if (!cancelled) setFollowerCount(count || 0);

      // Set page title
      document.title = `${prof.display_name}'s Booth — The Booth`;
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Realtime subscription filtered by wall_id
  useEffect(() => {
    if (!supabase || !profile) return;

    const channel = supabase
      .channel(`wall-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: `wall_id=eq.${profile.id}`,
        },
        (payload) => {
          setSubmissions((prev) => {
            if (isOwner && prev.length === 0) {
              setShowCelebration(true);
            }
            return [payload.new, ...prev];
          });
          setNewSubmissionCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "submissions",
          filter: `wall_id=eq.${profile.id}`,
        },
        (payload) => {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === payload.new.id ? payload.new : s))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "submissions",
          filter: `wall_id=eq.${profile.id}`,
        },
        (payload) => {
          setSubmissions((prev) =>
            prev.filter((s) => s.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Handlers
  const addSubmission = async (submission) => {
    if (!profile) return;
    try {
      const res = await fetch("/api/submit-album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...submission, wall_id: profile.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }
    } catch (e) {
      console.error("Failed to save submission:", e);
    }
    setShowSubmitDrawer(false);
    showToast("Album dropped! 🎵");
  };

  const handleFeedback = async (
    submissionId,
    feedback,
    email,
    albumName,
    artistName
  ) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          owner_feedback: feedback,
          feedback_at: new Date().toISOString(),
        })
        .eq("id", submissionId);
      if (error) throw error;

      // Send email notification
      if (email) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await fetch("/api/send-feedback-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({
            email,
            albumName,
            artistName,
            feedback,
            ownerName,
          }),
        });
      }
    } catch (e) {
      console.error("Failed to send feedback:", e);
    }
  };

  const handleListened = async (submissionId, listened) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ listened })
        .eq("id", submissionId);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update listened:", e);
    }
  };

  const handleRate = async (submissionId, rating) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ rating })
        .eq("id", submissionId);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to update rating:", e);
    }
  };

  const handleDelete = async (submissionId) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionId);
      if (error) throw error;
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      // Also remove from pinned if it was pinned
      if (pinnedIds.includes(submissionId)) {
        const newPinned = pinnedIds.filter((id) => id !== submissionId);
        await supabase
          .from("profiles")
          .update({ pinned_submission_ids: newPinned })
          .eq("id", profile.id);
        setProfile((prev) => ({ ...prev, pinned_submission_ids: newPinned }));
      }
    } catch (e) {
      console.error("Failed to delete submission:", e);
    }
  };

  const handlePin = async (submissionId) => {
    if (!supabase || !profile) return;
    if (pinnedIds.length >= 3) return;
    const newPinned = [...pinnedIds, submissionId];
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ pinned_submission_ids: newPinned })
        .eq("id", profile.id);
      if (error) throw error;
      setProfile((prev) => ({ ...prev, pinned_submission_ids: newPinned }));
    } catch (e) {
      console.error("Failed to pin submission:", e);
    }
  };

  const handleUnpin = async (submissionId) => {
    if (!supabase || !profile) return;
    const newPinned = pinnedIds.filter((id) => id !== submissionId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ pinned_submission_ids: newPinned })
        .eq("id", profile.id);
      if (error) throw error;
      setProfile((prev) => ({ ...prev, pinned_submission_ids: newPinned }));
    } catch (e) {
      console.error("Failed to unpin submission:", e);
    }
  };

  if (notFound) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Wall Not Found
        </h2>
        <p
          style={{
            color: "#555",
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          No wall exists at /{slug}
        </p>
        <button
          onClick={() => navigate("/")}
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
          Go Home
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{ textAlign: "center", padding: 80, color: "#555" }}
      >
        Loading...
      </div>
    );
  }

  const bannerCss = getBannerCss(profile.banner_style, profile.banner_url);

  return (
    <>
      {showCelebration && <Celebration />}
      {/* Full-page banner background */}
      {bannerCss && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "45vh",
            background: bannerCss,
            opacity: 0.18,
            zIndex: 0,
            pointerEvents: "none",
            maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
          }}
        />
      )}


      <Header
        profile={profile}
        followerCount={followerCount}
        statusText={profile.status_text}
        themeAccent={themeAccent}
      />

      {!isOwner && user && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <FollowButton
            wallId={profile.id}
            onCountChange={(delta) => setFollowerCount((c) => c + delta)}
          />
        </div>
      )}

      {isOwner && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 12,
            padding: "6px 12px",
            background: `${themeAccent}1a`,
            border: `1px solid ${themeAccent}4d`,
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "'Space Mono', monospace",
            color: themeAccent,
          }}
        >
          You're viewing your own wall — admin controls are active
        </div>
      )}

      <TabToggle
        view={view}
        setView={setView}
        accent={themeAccent}
        tabs={[
          { key: "wall", label: `Wall (${submissions.length})`, icon: "🧱" },
          { key: "guestbook", label: "Guest Book", icon: "📝" },
          { key: "playlist", label: "Playlist", icon: "🎧" },
          { key: "stats", label: "Stats", icon: "📊" },
        ]}
      />

      {view === "wall" ? (
        <Wall
          submissions={submissions}
          loading={loading}
          isOwner={isOwner}
          ownerName={ownerName}
          onFeedback={handleFeedback}
          onDelete={handleDelete}
          onListened={handleListened}
          onRate={handleRate}
          pinnedIds={pinnedIds}
          onPin={handlePin}
          onUnpin={handleUnpin}
          newSubmissionCount={newSubmissionCount}
          onDismissNew={() => setNewSubmissionCount(0)}
        />
      ) : view === "guestbook" ? (
        <GuestBook wallId={profile.id} isOwner={isOwner} />
      ) : view === "playlist" ? (
        <PlaylistBuilder submissions={submissions} />
      ) : (
        <>
          <Stats submissions={submissions} />
          {isOwner && <TasteCard profile={profile} submissions={submissions} />}
        </>
      )}

      {/* Floating "Drop a rec" button — visitors only */}
      {!isOwner && !showSubmitDrawer && (
        <button
          onClick={() => setShowSubmitDrawer(true)}
          style={{
            position: "fixed",
            bottom: 76,
            right: 20,
            zIndex: 150,
            background: themeAccent,
            color: "#000",
            border: "none",
            borderRadius: 28,
            padding: "12px 20px",
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: "pointer",
            boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 20px ${themeAccent}33`,
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          🎵 DROP A REC
        </button>
      )}

      {/* Submit drawer overlay */}
      {showSubmitDrawer && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowSubmitDrawer(false)}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 300,
            }}
          />
          {/* Drawer */}
          <div
            style={{
              position: "fixed",
              bottom: 0, left: 0, right: 0,
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#0a0a0a",
              borderTop: `2px solid ${themeAccent}`,
              borderRadius: "16px 16px 0 0",
              zIndex: 301,
              padding: "0 20px 20px",
              paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
            }}
          >
            {/* Drawer handle */}
            <div style={{
              display: "flex", justifyContent: "center",
              padding: "12px 0 16px",
              cursor: "pointer",
            }}
              onClick={() => setShowSubmitDrawer(false)}
            >
              <div style={{
                width: 36, height: 4,
                borderRadius: 2,
                background: "#333",
              }} />
            </div>
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <SubmitForm onSubmit={addSubmission} ownerName={ownerName} accent={themeAccent} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
