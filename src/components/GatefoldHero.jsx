import { Link } from "react-router-dom";
import { palette } from "../lib/palette";
import { formatMs } from "../hooks/useMixtapeData";
import MixtapeCoverArt from "./MixtapeCoverArt";

export default function GatefoldHero({ mixtape, tracks, collaborators, totalMs, accent }) {
  const accentFaint = accent + "12";

  return (
    <div
      style={{
        padding: "60px 20px 40px",
        textAlign: "center",
        background: `linear-gradient(180deg, ${accentFaint} 0%, transparent 60%)`,
        borderBottom: `1px solid ${palette.border}`,
        marginBottom: 32,
      }}
    >
      {/* Cover art with vinyl record peeking out */}
      <div
        style={{
          display: "inline-block",
          position: "relative",
          marginBottom: 24,
        }}
      >
        {/* Vinyl record behind cover */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-30%, -50%)",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 50%,
              #111 0%, #111 15%,
              #1a1a1a 15.5%, #1a1a1a 16%,
              #111 16.5%, #111 30%,
              #1a1a1a 30.5%, #1a1a1a 31%,
              #111 31.5%, #111 45%,
              #1a1a1a 45.5%, #1a1a1a 46%,
              #111 46.5%, #111 100%)`,
            boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
            zIndex: 0,
          }}
        >
          {/* Center label */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: accent,
              opacity: 0.8,
            }}
          />
        </div>

        {/* Cover art */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <MixtapeCoverArt
            tracks={tracks}
            coverArtIndex={mixtape.cover_art_index}
            customCoverUrl={mixtape.custom_cover_url}
            size={260}
          />
        </div>
      </div>

      {/* Collab badge */}
      {mixtape.is_collab && (
        <div style={{ marginBottom: 10 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: accent,
              background: accent + "15",
              padding: "4px 12px",
              borderRadius: 6,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            COLLABORATIVE MIXTAPE
          </span>
        </div>
      )}

      {/* Title */}
      <h1
        style={{
          fontSize: 38,
          fontWeight: 800,
          fontFamily: "'Syne', sans-serif",
          margin: "0 0 8px",
          lineHeight: 1.1,
          color: palette.text,
        }}
      >
        {mixtape.title}
      </h1>

      {/* Theme subtitle */}
      {mixtape.theme && (
        <div
          style={{
            fontSize: 14,
            fontStyle: "italic",
            color: accent,
            fontFamily: "'Space Mono', monospace",
            marginBottom: 12,
          }}
        >
          for: {mixtape.theme}
        </div>
      )}

      {/* Credits */}
      <div
        style={{
          fontSize: 13,
          color: palette.textMuted,
          fontFamily: "'Space Mono', monospace",
          marginBottom: 16,
        }}
      >
        by{" "}
        <Link
          to={`/${mixtape.profiles?.slug}`}
          style={{ color: palette.text, textDecoration: "none", fontWeight: 600 }}
        >
          {mixtape.profiles?.display_name || "Unknown"}
        </Link>
        {mixtape.is_collab &&
          collaborators.length > 0 &&
          collaborators.map((c, i) => (
            <span key={c.user_id}>
              {i === collaborators.length - 1 ? " & " : ", "}
              <Link
                to={`/${c.profiles?.slug}`}
                style={{ color: palette.text, textDecoration: "none", fontWeight: 600 }}
              >
                {c.profiles?.display_name}
              </Link>
            </span>
          ))}
      </div>

      {/* Stats */}
      <div
        style={{
          fontSize: 11,
          fontFamily: "'Space Mono', monospace",
          color: palette.textDim,
          letterSpacing: 1,
        }}
      >
        {tracks.length} TRACK{tracks.length !== 1 ? "S" : ""} &middot;{" "}
        {formatMs(totalMs)}
      </div>
    </div>
  );
}
