import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { palette } from "./lib/palette";
import Header from "./components/Header";
import TabToggle from "./components/TabToggle";
import SubmitForm from "./components/SubmitForm";
import ThankYou from "./components/ThankYou";
import Wall from "./components/Wall";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export default function App() {
  const [view, setView] = useState("submit");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check for admin mode via URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get("admin");
    if (adminParam && ADMIN_PASSWORD && adminParam === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setView("wall");
    }
  }, []);

  // Fetch submissions + realtime
  useEffect(() => {
    loadSubmissions();

    if (!supabase) return;
    const channel = supabase
      .channel("submissions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (payload) => {
          setSubmissions((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "submissions" },
        (payload) => {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === payload.new.id ? payload.new : s))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSubmissions = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (e) {
      console.error("Failed to load submissions:", e);
    } finally {
      setLoading(false);
    }
  };

  const addSubmission = async (submission) => {
    if (!supabase) {
      setSubmissions((prev) => [
        { ...submission, id: Date.now(), created_at: new Date().toISOString() },
        ...prev,
      ]);
      setJustSubmitted(true);
      return;
    }

    try {
      const { error } = await supabase.from("submissions").insert([submission]);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to save submission:", e);
    }
    setJustSubmitted(true);
  };

  const handleFeedback = async (submissionId, feedback, email, albumName, artistName) => {
    if (!supabase) return;

    try {
      // Update submission in Supabase
      const { error } = await supabase
        .from("submissions")
        .update({
          daniel_feedback: feedback,
          feedback_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      if (error) throw error;

      // Send email notification
      if (email) {
        await fetch("/api/send-feedback-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": ADMIN_PASSWORD,
          },
          body: JSON.stringify({
            email,
            albumName,
            artistName,
            feedback,
          }),
        });
      }
    } catch (e) {
      console.error("Failed to send feedback:", e);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.bg,
        color: palette.text,
        fontFamily: "'Syne', 'Helvetica Neue', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(29,185,84,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(255,107,107,0.04) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 640,
          margin: "0 auto",
          padding: "32px 20px 80px",
        }}
      >
        <Header />

        {/* Admin indicator */}
        {isAdmin && (
          <div
            style={{
              textAlign: "center",
              marginBottom: 12,
              padding: "6px 12px",
              background: "rgba(29,185,84,0.1)",
              border: `1px solid rgba(29,185,84,0.3)`,
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
              color: palette.accent,
            }}
          >
            Admin mode — you can reply to submissions
          </div>
        )}

        <TabToggle view={view} setView={setView} count={submissions.length} />

        {view === "submit" ? (
          justSubmitted ? (
            <ThankYou
              onAnother={() => setJustSubmitted(false)}
              onViewWall={() => {
                setJustSubmitted(false);
                setView("wall");
              }}
            />
          ) : (
            <SubmitForm onSubmit={addSubmission} />
          )
        ) : (
          <Wall
            submissions={submissions}
            loading={loading}
            isAdmin={isAdmin}
            onFeedback={handleFeedback}
          />
        )}
      </div>
    </div>
  );
}
