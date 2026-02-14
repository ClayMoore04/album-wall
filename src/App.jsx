import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { palette } from "./lib/palette";
import Header from "./components/Header";
import TabToggle from "./components/TabToggle";
import SubmitForm from "./components/SubmitForm";
import ThankYou from "./components/ThankYou";
import Wall from "./components/Wall";
import Stats from "./components/Stats";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export default function App() {
  const [view, setView] = useState("submit");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState(false);

  // Check for admin mode via URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get("admin");
    if (adminParam && ADMIN_PASSWORD && adminParam === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setView("wall");
    }
  }, []);

  const handleAdminLogin = () => {
    if (adminInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminInput("");
      setAdminError(false);
      setView("wall");
    } else {
      setAdminError(true);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
  };

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
    } catch (e) {
      console.error("Failed to delete submission:", e);
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
        {/* Admin button - top right */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -28 }}>
          {isAdmin ? (
            <button
              onClick={handleAdminLogout}
              style={{
                padding: "6px 14px",
                border: `1px solid rgba(29,185,84,0.3)`,
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                background: "rgba(29,185,84,0.1)",
                color: palette.accent,
                transition: "all 0.2s",
              }}
            >
              Admin ✓ (logout)
            </button>
          ) : (
            <button
              onClick={() => setShowAdminLogin(true)}
              style={{
                padding: "6px 14px",
                border: `1px solid ${palette.border}`,
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                background: "transparent",
                color: palette.textDim,
                transition: "all 0.2s",
              }}
            >
              Admin
            </button>
          )}
        </div>

        {/* Admin login modal */}
        {showAdminLogin && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAdminLogin(false);
                setAdminInput("");
                setAdminError(false);
              }
            }}
          >
            <div
              style={{
                background: palette.surface,
                border: `1px solid ${palette.border}`,
                borderRadius: 16,
                padding: 28,
                width: "100%",
                maxWidth: 340,
                margin: "0 20px",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Admin Login
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: palette.textMuted,
                  fontFamily: "'Space Mono', monospace",
                  marginBottom: 20,
                }}
              >
                Enter the admin password
              </div>
              <input
                type="password"
                value={adminInput}
                onChange={(e) => {
                  setAdminInput(e.target.value);
                  setAdminError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                placeholder="Password"
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: palette.bg,
                  border: `1px solid ${adminError ? palette.coral : palette.border}`,
                  borderRadius: 10,
                  color: palette.text,
                  fontSize: 14,
                  fontFamily: "'Syne', sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: adminError ? 6 : 16,
                }}
              />
              {adminError && (
                <div
                  style={{
                    fontSize: 12,
                    color: palette.coral,
                    fontFamily: "'Space Mono', monospace",
                    marginBottom: 12,
                  }}
                >
                  Wrong password
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleAdminLogin}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                    background: palette.accent,
                    color: "#000",
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminInput("");
                    setAdminError(false);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                    background: "transparent",
                    color: palette.textMuted,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
            Admin mode — you can reply to and delete submissions
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
        ) : view === "wall" ? (
          <Wall
            submissions={submissions}
            loading={loading}
            isAdmin={isAdmin}
            onFeedback={handleFeedback}
            onDelete={handleDelete}
            onListened={handleListened}
            onRate={handleRate}
          />
        ) : (
          <Stats submissions={submissions} />
        )}
      </div>
    </div>
  );
}
