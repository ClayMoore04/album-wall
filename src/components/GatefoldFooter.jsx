import { useState } from "react";
import { Link } from "react-router-dom";
import { formatMs } from "../hooks/useMixtapeData";
import { useToast } from "./Toast";
import TapeTradeButton from "./TapeTradeButton";

export default function GatefoldFooter({ mixtape, mixtapeId, tracks, totalMs, user, isOwner, isCollaborator, accent }) {
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Copied!");
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
    showToast("Tracklist copied!");
  };

  const handleShareImage = async () => {
    setSharing(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const W = 1080, H = 1920; // Instagram story size
      canvas.width = W;
      canvas.height = H;

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Accent gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, (accent || "#1DB954") + "18");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Cover art (load first album art if available)
      const coverArts = tracks.filter(t => t.album_art_url).slice(0, 4);
      if (coverArts.length > 0) {
        const artSize = 400;
        const artX = (W - artSize) / 2;
        const artY = 200;

        if (coverArts.length >= 4) {
          const half = artSize / 2 - 2;
          for (let i = 0; i < 4; i++) {
            try {
              const img = new Image();
              img.crossOrigin = "anonymous";
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = coverArts[i].album_art_url;
              });
              const dx = artX + (i % 2) * (half + 4);
              const dy = artY + Math.floor(i / 2) * (half + 4);
              ctx.drawImage(img, dx, dy, half, half);
            } catch { /* skip failed images */ }
          }
        } else {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = coverArts[0].album_art_url;
            });
            ctx.drawImage(img, artX, artY, artSize, artSize);
          } catch { /* skip */ }
        }
      }

      // Title
      ctx.fillStyle = "#e8e6e3";
      ctx.font = "bold 52px sans-serif";
      ctx.textAlign = "center";
      const title = mixtape.title.length > 30 ? mixtape.title.slice(0, 30) + "..." : mixtape.title;
      ctx.fillText(title, W / 2, 700);

      // Theme
      if (mixtape.theme) {
        ctx.fillStyle = accent || "#1DB954";
        ctx.font = "italic 24px sans-serif";
        ctx.fillText(`for: ${mixtape.theme}`, W / 2, 750);
      }

      // Creator
      ctx.fillStyle = "#777";
      ctx.font = "20px sans-serif";
      const creator = mixtape.profiles?.display_name || "Unknown";
      ctx.fillText(`by ${creator}`, W / 2, mixtape.theme ? 790 : 750);

      // Tracklist
      ctx.textAlign = "left";
      ctx.font = "18px sans-serif";
      const startY = mixtape.theme ? 860 : 820;
      const maxTracks = Math.min(tracks.length, 14);
      tracks.slice(0, maxTracks).forEach((t, i) => {
        const y = startY + i * 34;
        ctx.fillStyle = "#555";
        ctx.fillText(`${String(i + 1).padStart(2, "0")}`, 120, y);
        ctx.fillStyle = "#e8e6e3";
        const trackText = `${t.track_name} — ${t.artist_name}`;
        ctx.fillText(trackText.length > 45 ? trackText.slice(0, 45) + "..." : trackText, 170, y);
      });
      if (tracks.length > maxTracks) {
        ctx.fillStyle = "#555";
        ctx.fillText(`+ ${tracks.length - maxTracks} more`, 170, startY + maxTracks * 34);
      }

      // Stats
      ctx.textAlign = "center";
      ctx.fillStyle = "#555";
      ctx.font = "16px sans-serif";
      ctx.fillText(`${tracks.length} tracks · ${formatMs(totalMs)}`, W / 2, H - 140);

      // Branding
      ctx.fillStyle = "#333";
      ctx.font = "14px sans-serif";
      ctx.fillText("inthebooth.vercel.app", W / 2, H - 80);

      canvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare({ files: [new File([blob], "mixtape.png", { type: "image/png" })] })) {
          await navigator.share({
            files: [new File([blob], `${mixtape.title}.png`, { type: "image/png" })],
            title: mixtape.title,
            text: `Check out "${mixtape.title}" on The Booth`,
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${mixtape.title.replace(/[^a-z0-9]/gi, "_")}.png`;
          a.click();
          URL.revokeObjectURL(url);
          showToast("Image downloaded!");
        }
      }, "image/png");
    } catch (e) {
      console.error("Share image failed:", e);
      showToast("Failed to generate image");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px 20px 40px",
        borderTop: "1px solid #1e1e1e",
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
            border: "1px solid #1e1e1e",
            background: "transparent",
            color: "#555",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            transition: "color 0.2s",
          }}
        >
          Copy link
        </button>

        {tracks.length > 0 && (
          <button
            onClick={handleCopyTracklist}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid #1e1e1e",
              background: "transparent",
              color: "#555",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
          >
            Copy tracklist
          </button>
        )}

        {tracks.some((t) => t.liner_notes) && (
          <Link
            to={`/mixtape/${mixtapeId}/notes`}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid #1e1e1e",
              background: "transparent",
              color: "#555",
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

        {tracks.length > 0 && (
          <button
            onClick={handleShareImage}
            disabled={sharing}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid #1e1e1e",
              background: "transparent",
              color: "#555",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              cursor: sharing ? "not-allowed" : "pointer",
              transition: "color 0.2s",
              opacity: sharing ? 0.5 : 1,
            }}
          >
            {sharing ? "Generating..." : "Share as image"}
          </button>
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
            color: "#333",
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
            color: "#333",
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
