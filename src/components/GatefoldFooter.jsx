import { useState } from "react";
import { Link } from "react-router-dom";
import { palette } from "../lib/palette";
import { formatMs } from "../hooks/useMixtapeData";
import TapeTradeButton from "./TapeTradeButton";

export default function GatefoldFooter({ mixtape, mixtapeId, tracks, totalMs, user, isOwner, isCollaborator, accent }) {
  const [copied, setCopied] = useState(false);
  const [copiedTracks, setCopiedTracks] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTracklist = () => {
    const text = `${mixtape.title}\n\n${tracks
      .map(
        (t, i) =>
          `${i + 1}. ${t.track_name} — ${t.artist_name}${
            t.liner_notes ? `\n   "${t.liner_notes}"` : ""
          }`
      )
      .join("\n")}\n\n${tracks
      .map((t) => t.spotify_url)
      .filter(Boolean)
      .join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedTracks(true);
    setTimeout(() => setCopiedTracks(false), 2000);
  };

  return (
    <div
      style={{
        padding: "24px 20px 40px",
        borderTop: `1px solid ${palette.border}`,
        marginTop: 32,
      }}
    >
      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <button
          onClick={handleCopyLink}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: `1px solid ${palette.border}`,
            background: "transparent",
            color: copied ? accent : palette.textMuted,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            transition: "color 0.2s",
          }}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>

        {tracks.length > 0 && (
          <button
            onClick={handleCopyTracklist}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: "transparent",
              color: copiedTracks ? accent : palette.textMuted,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
          >
            {copiedTracks ? "Copied!" : "Copy tracklist"}
          </button>
        )}

        {tracks.some((t) => t.liner_notes) && (
          <Link
            to={`/mixtape/${mixtapeId}/notes`}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: "transparent",
              color: palette.textMuted,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Liner notes
          </Link>
        )}

        {user && !isOwner && !isCollaborator && (
          <TapeTradeButton mixtape={mixtape} />
        )}
      </div>

      {/* Stats line */}
      {tracks.length > 0 && (
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            fontFamily: "'Space Mono', monospace",
            color: palette.textDim,
            marginBottom: 16,
          }}
        >
          {tracks.length} track{tracks.length !== 1 ? "s" : ""} &middot;{" "}
          {formatMs(totalMs)}
        </div>
      )}

      {/* Attribution */}
      <div style={{ textAlign: "center" }}>
        <Link
          to="/"
          style={{
            fontSize: 10,
            fontFamily: "'Space Mono', monospace",
            color: palette.textDim,
            textDecoration: "none",
            letterSpacing: 1,
          }}
        >
          Made on The Booth
        </Link>
      </div>
    </div>
  );
}
