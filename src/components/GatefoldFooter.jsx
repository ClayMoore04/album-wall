import { useState } from "react";
import { Link } from "react-router-dom";
import { formatMs } from "../hooks/useMixtapeData";
import { useToast } from "./Toast";
import { extractColor, hexToRgb } from "../lib/colorExtract";
import TapeTradeButton from "./TapeTradeButton";
import BookmarkButton from "./BookmarkButton";

// Load an image with crossOrigin support, returns null on failure
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Generate a small noise pattern canvas tile
function createNoiseTile() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.random() * 255;
    imageData.data[i] = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
    imageData.data[i + 3] = 10; // ~4% opacity
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Draw rounded-rect clipped image
function drawRoundedImage(ctx, img, x, y, w, h, r) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

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
      const W = 1080, H = 1920;
      canvas.width = W;
      canvas.height = H;

      // Determine cover art URL
      let coverUrl = mixtape.custom_cover_url;
      if (!coverUrl && mixtape.cover_art_index != null && tracks[mixtape.cover_art_index]?.album_art_url) {
        coverUrl = tracks[mixtape.cover_art_index].album_art_url;
      }
      if (!coverUrl) {
        coverUrl = tracks.find((t) => t.album_art_url)?.album_art_url;
      }

      // Extract dominant color
      const dominantColor = coverUrl ? await extractColor(coverUrl) : null;
      const tintHex = dominantColor || accent || "#f472b6";
      const tintRgb = hexToRgb(tintHex);

      // 1. Full-bleed blurred background
      const coverImg = coverUrl ? await loadImage(coverUrl) : null;
      if (coverImg) {
        ctx.save();
        ctx.filter = "blur(60px) brightness(0.4)";
        // Scale to fill
        const scale = Math.max(W / coverImg.width, H / coverImg.height);
        const sw = coverImg.width * scale;
        const sh = coverImg.height * scale;
        ctx.drawImage(coverImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
        ctx.restore();
      } else {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, W, H);
      }

      // 2. Dark overlay to ensure readability
      ctx.fillStyle = "rgba(10,10,10,0.55)";
      ctx.fillRect(0, 0, W, H);

      // 3. Dominant color gradient overlay
      const colorGrad = ctx.createLinearGradient(0, 0, 0, H);
      colorGrad.addColorStop(0, `rgba(${tintRgb},0.25)`);
      colorGrad.addColorStop(0.5, "transparent");
      colorGrad.addColorStop(1, `rgba(${tintRgb},0.10)`);
      ctx.fillStyle = colorGrad;
      ctx.fillRect(0, 0, W, H);

      // 4. Grain texture overlay
      const noise = createNoiseTile();
      const pattern = ctx.createPattern(noise, "repeat");
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, W, H);

      // 5. Cover art (sharp, centered, rounded corners)
      const artSize = 420;
      const artX = (W - artSize) / 2;
      const artY = 220;
      if (coverImg) {
        // Shadow behind cover
        ctx.save();
        ctx.shadowColor = `rgba(${tintRgb},0.3)`;
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 12;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.roundRect(artX, artY, artSize, artSize, 16);
        ctx.fill();
        ctx.restore();
        drawRoundedImage(ctx, coverImg, artX, artY, artSize, artSize, 16);
      }

      // 6. Title
      const titleY = artY + artSize + 60;
      ctx.fillStyle = "#e8e6e3";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      const title = mixtape.title.length > 28 ? mixtape.title.slice(0, 28) + "..." : mixtape.title;
      ctx.fillText(title, W / 2, titleY);

      // 7. Theme
      let nextY = titleY + 10;
      if (mixtape.theme) {
        nextY += 40;
        ctx.fillStyle = `rgba(${tintRgb},0.9)`;
        ctx.font = "italic 22px sans-serif";
        ctx.fillText(`for: ${mixtape.theme}`, W / 2, nextY);
      }

      // 8. Creator + stats
      nextY += 40;
      const creator = mixtape.profiles?.display_name || "Unknown";
      ctx.fillStyle = "#777";
      ctx.font = "18px sans-serif";
      ctx.fillText(`by ${creator}  ·  ${tracks.length} tracks  ·  ${formatMs(totalMs)}`, W / 2, nextY);

      // 9. Side A / Side B tracklist columns
      nextY += 60;
      const colX = { a: 100, b: W / 2 + 40 };
      const maxPerSide = 7;

      // Compute side split (same as og-image.js: 60min threshold)
      let sideAMs = 0;
      let splitIdx = tracks.length;
      for (let i = 0; i < tracks.length; i++) {
        if (sideAMs + tracks[i].duration_ms > 60 * 60000) {
          splitIdx = i;
          break;
        }
        sideAMs += tracks[i].duration_ms;
      }

      const sideATracks = tracks.slice(0, Math.min(splitIdx, maxPerSide));
      const sideBTracks = tracks.slice(splitIdx, splitIdx + maxPerSide);

      // Side A header
      ctx.textAlign = "left";
      ctx.fillStyle = `rgba(${tintRgb},0.8)`;
      ctx.font = "bold 14px sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillText("SIDE A", colX.a, nextY);

      if (sideBTracks.length > 0) {
        ctx.fillText("SIDE B", colX.b, nextY);
      }

      // Track rows
      ctx.font = "16px sans-serif";
      const rowH = 32;
      sideATracks.forEach((t, i) => {
        const y = nextY + 30 + i * rowH;
        ctx.fillStyle = "#555";
        ctx.fillText(String(i + 1).padStart(2, "0"), colX.a, y);
        ctx.fillStyle = "#ccc";
        const name = `${t.track_name} — ${t.artist_name}`;
        ctx.fillText(name.length > 35 ? name.slice(0, 35) + "..." : name, colX.a + 36, y);
      });
      if (splitIdx > maxPerSide) {
        const y = nextY + 30 + sideATracks.length * rowH;
        ctx.fillStyle = "#555";
        ctx.fillText(`+ ${splitIdx - maxPerSide} more`, colX.a + 36, y);
      }

      sideBTracks.forEach((t, i) => {
        const y = nextY + 30 + i * rowH;
        const num = splitIdx + i + 1;
        ctx.fillStyle = "#555";
        ctx.fillText(String(num).padStart(2, "0"), colX.b, y);
        ctx.fillStyle = "#ccc";
        const name = `${t.track_name} — ${t.artist_name}`;
        ctx.fillText(name.length > 35 ? name.slice(0, 35) + "..." : name, colX.b + 36, y);
      });
      if (tracks.length - splitIdx > maxPerSide) {
        const y = nextY + 30 + sideBTracks.length * rowH;
        ctx.fillStyle = "#555";
        ctx.fillText(`+ ${tracks.length - splitIdx - maxPerSide} more`, colX.b + 36, y);
      }

      // 10. Branding watermark
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(${tintRgb},0.4)`;
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
        <BookmarkButton mixtapeId={mixtapeId} />

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
