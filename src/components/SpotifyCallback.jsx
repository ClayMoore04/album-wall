import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForToken } from "../lib/spotifyAuth";
import { palette } from "../lib/palette";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const authError = params.get("error");
    // Preserve the return destination from state if available
    const returnPath = sessionStorage.getItem("spotify_return_path") || "";
    const returnSlug = sessionStorage.getItem("spotify_return_slug") || "";

    if (authError) {
      setStatus("error");
      setError("Spotify authorization was denied.");
      return;
    }

    if (!code) {
      setStatus("error");
      setError("No authorization code received.");
      return;
    }

    (async () => {
      try {
        await exchangeCodeForToken(code);
        setStatus("success");
        sessionStorage.removeItem("spotify_return_path");
        setTimeout(() => {
          if (returnPath) {
            navigate(returnPath);
          } else if (returnSlug) {
            navigate(`/${returnSlug}`);
          } else {
            navigate("/");
          }
        }, 1500);
      } catch (e) {
        console.error("Spotify callback error:", e);
        setStatus("error");
        setError("Failed to connect to Spotify. Please try again.");
      }
    })();
  }, [navigate]);

  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      {status === "connecting" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Connecting to Spotify<span style={{ color: palette.accent }}>...</span>
          </h2>
          <p
            style={{
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
            }}
          >
            Exchanging authorization...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Spotify Connected<span style={{ color: palette.accent }}>!</span>
          </h2>
          <p
            style={{
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
            }}
          >
            Redirecting to the wall...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Connection Failed
          </h2>
          <p
            style={{
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 20px",
              border: `1px solid ${palette.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              background: "transparent",
              color: palette.textMuted,
            }}
          >
            Back to the Wall
          </button>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
