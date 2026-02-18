import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import { getThemeAccent } from "../lib/themes";
import Header from "./Header";
import NavBar from "./NavBar";
import FollowButton from "./FollowButton";
import TabToggle from "./TabToggle";
import SubmitForm from "./SubmitForm";
import ThankYou from "./ThankYou";
import Wall from "./Wall";
import Stats from "./Stats";
import PlaylistBuilder from "./PlaylistBuilder";

export default function WallPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("submit");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

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
          setSubmissions((prev) => [payload.new, ...prev]);
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
    if (!supabase || !profile) return;
    try {
      const { error } = await supabase
        .from("submissions")
        .insert([{ ...submission, wall_id: profile.id }]);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to save submission:", e);
    }
    setJustSubmitted(true);
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
            color: palette.textMuted,
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
        style={{ textAlign: "center", padding: 80, color: palette.textMuted }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      <NavBar wallSlug={slug} isOwner={isOwner} />

      <Header
        profile={profile}
        followerCount={followerCount}
        bannerStyle={profile.banner_style}
        bannerUrl={profile.banner_url}
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

      <TabToggle view={view} setView={setView} count={submissions.length} />

      {view === "submit" ? (
        justSubmitted ? (
          <ThankYou
            ownerName={ownerName}
            onAnother={() => setJustSubmitted(false)}
            onViewWall={() => {
              setJustSubmitted(false);
              setView("wall");
            }}
          />
        ) : (
          <SubmitForm onSubmit={addSubmission} ownerName={ownerName} />
        )
      ) : view === "wall" ? (
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
        />
      ) : view === "playlist" ? (
        <PlaylistBuilder submissions={submissions} />
      ) : (
        <Stats submissions={submissions} />
      )}
    </>
  );
}
