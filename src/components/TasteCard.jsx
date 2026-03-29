import { useState, useRef, useCallback } from "react";
import { palette } from "../lib/palette";

const W = 1080;
const H = 1350;
const PAD = 60;
const ACCENT = "#f472b6";
const CORAL = "#ef4444";
const BG = "#0a0a0a";
const SURFACE = "#181818";
const BORDER = "#282828";
const TEXT = "#e8e6e3";
const MUTED = "#888";
const DIM = "#555";

function computeStats(submissions) {
  const total = submissions.length;
  const listened = submissions.filter((s) => s.listened).length;
  const rated = submissions.filter((s) => s.rating);
  const avgRating =
    rated.length > 0
      ? (rated.reduce((sum, s) => sum + s.rating, 0) / rated.length).toFixed(1)
      : null;

  const recommenderMap = {};
  submissions.forEach((s) => {
    const name = s.submitted_by || "Anonymous";
    recommenderMap[name] = (recommenderMap[name] || 0) + 1;
  });
  const topRecommenders = Object.entries(recommenderMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const tagMap = {};
  submissions.forEach((s) => {
    (s.tags || []).forEach((tag) => {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
  });
  const topVibes = Object.entries(tagMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    total,
    listened,
    listenedPct: total > 0 ? Math.round((listened / total) * 100) : 0,
    avgRating,
    topRecommenders,
    topVibes,
  };
}

function roundRect(ctx, x, y, w, h, r) {
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
}

function drawCard(canvas, profile, submissions) {
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  const stats = computeStats(submissions);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay
  const grad = ctx.createRadialGradient(200, 0, 0, 200, 0, W);
  grad.addColorStop(0, "rgba(244,114,182,0.08)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const grad2 = ctx.createRadialGradient(W - 200, H, 0, W - 200, H, W);
  grad2.addColorStop(0, "rgba(239,68,68,0.05)");
  grad2.addColorStop(1, "transparent");
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, W, H);

  let y = PAD;

  // --- Header ---
  ctx.fillStyle = ACCENT;
  ctx.font = "bold 28px 'Helvetica Neue', sans-serif";
  ctx.fillText("THE BOOTH", PAD, y + 28);

  ctx.fillStyle = MUTED;
  ctx.font = "500 22px 'Helvetica Neue', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`inthebooth.vercel.app/${profile.slug}`, W - PAD, y + 28);
  ctx.textAlign = "left";

  y += 70;

  // Divider line
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();

  y += 50;

  // --- User name ---
  ctx.fillStyle = TEXT;
  ctx.font = "bold 56px 'Helvetica Neue', sans-serif";
  ctx.fillText(profile.display_name, PAD, y + 50);

  y += 70;

  // Tagline
  ctx.fillStyle = MUTED;
  ctx.font = "400 24px 'Helvetica Neue', sans-serif";
  ctx.fillText("My Booth Taste Card", PAD, y + 24);

  y += 70;

  // --- Stats grid (3 cards) ---
  const cardW = (W - PAD * 2 - 30) / 3;
  const cardH = 140;
  const statItems = [
    { label: "ALBUMS", value: String(stats.total) },
    { label: "LISTENED", value: `${stats.listenedPct}%` },
    { label: "AVG RATING", value: stats.avgRating ? `${stats.avgRating}` : "--" },
  ];

  statItems.forEach((item, i) => {
    const cx = PAD + i * (cardW + 15);

    roundRect(ctx, cx, y, cardW, cardH, 16);
    ctx.fillStyle = SURFACE;
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Value
    ctx.fillStyle = TEXT;
    ctx.font = "bold 48px 'Helvetica Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.value, cx + cardW / 2, y + 70);

    // Label
    ctx.fillStyle = MUTED;
    ctx.font = "600 16px 'Helvetica Neue', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(item.label, cx + cardW / 2, y + 110);

    ctx.textAlign = "left";
  });

  y += cardH + 40;

  // --- Listening progress bar ---
  ctx.fillStyle = DIM;
  ctx.font = "700 16px 'Helvetica Neue', sans-serif";
  ctx.fillText("LISTENING PROGRESS", PAD, y);

  y += 16;
  const barW = W - PAD * 2;
  const barH = 16;

  roundRect(ctx, PAD, y, barW, barH, 8);
  ctx.fillStyle = SURFACE;
  ctx.fill();

  if (stats.listenedPct > 0) {
    const fillW = Math.max(16, (stats.listenedPct / 100) * barW);
    roundRect(ctx, PAD, y, fillW, barH, 8);
    const barGrad = ctx.createLinearGradient(PAD, 0, PAD + fillW, 0);
    barGrad.addColorStop(0, ACCENT);
    barGrad.addColorStop(1, "#1ed760");
    ctx.fillStyle = barGrad;
    ctx.fill();
  }

  y += barH + 50;

  // --- Top Vibes ---
  if (stats.topVibes.length > 0) {
    ctx.fillStyle = DIM;
    ctx.font = "700 16px 'Helvetica Neue', sans-serif";
    ctx.fillText("TOP VIBES", PAD, y);
    y += 24;

    let tagX = PAD;
    const tagH = 44;
    const tagGap = 12;
    const maxTagW = W - PAD * 2;

    stats.topVibes.forEach((vibe) => {
      ctx.font = "600 20px 'Helvetica Neue', sans-serif";
      const tw = ctx.measureText(vibe.name).width + 36;

      if (tagX + tw > PAD + maxTagW) {
        tagX = PAD;
        y += tagH + tagGap;
      }

      roundRect(ctx, tagX, y, tw, tagH, 22);
      ctx.fillStyle = "rgba(244,114,182,0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(244,114,182,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = ACCENT;
      ctx.font = "600 20px 'Helvetica Neue', sans-serif";
      ctx.fillText(vibe.name, tagX + 18, y + 29);

      tagX += tw + tagGap;
    });

    y += tagH + 50;
  }

  // --- Top Recommenders ---
  if (stats.topRecommenders.length > 0) {
    ctx.fillStyle = DIM;
    ctx.font = "700 16px 'Helvetica Neue', sans-serif";
    ctx.fillText("TOP RECOMMENDERS", PAD, y);
    y += 20;

    const maxCount = stats.topRecommenders[0].count;
    const recBarMaxW = W - PAD * 2 - 180;

    stats.topRecommenders.forEach((rec) => {
      // Name
      ctx.fillStyle = MUTED;
      ctx.font = "500 22px 'Helvetica Neue', sans-serif";
      ctx.textAlign = "left";
      const nameDisplay = rec.name.length > 14 ? rec.name.slice(0, 14) + "..." : rec.name;
      ctx.fillText(nameDisplay, PAD, y + 28);

      // Bar
      const bx = PAD + 160;
      const bw = maxCount > 0 ? Math.max(8, (rec.count / maxCount) * recBarMaxW) : 0;
      roundRect(ctx, bx, y + 10, bw, 22, 6);
      ctx.fillStyle = ACCENT;
      ctx.fill();

      // Count
      ctx.fillStyle = TEXT;
      ctx.font = "700 20px 'Helvetica Neue', sans-serif";
      ctx.fillText(String(rec.count), bx + bw + 12, y + 28);

      y += 42;
    });

    y += 20;
  }

  // --- Footer ---
  const footerY = H - PAD - 10;

  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, footerY - 30);
  ctx.lineTo(W - PAD, footerY - 30);
  ctx.stroke();

  ctx.fillStyle = MUTED;
  ctx.font = "400 20px 'Helvetica Neue', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Drop album recs on my booth", W / 2, footerY);

  ctx.fillStyle = ACCENT;
  ctx.font = "600 22px 'Helvetica Neue', sans-serif";
  ctx.fillText(`inthebooth.vercel.app/${profile.slug}`, W / 2, footerY + 34);

  ctx.textAlign = "left";
}

export default function TasteCard({ profile, submissions }) {
  const canvasRef = useRef(null);
  const [generated, setGenerated] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleGenerate = useCallback(() => {
    if (!canvasRef.current || !profile || submissions.length === 0) return;
    drawCard(canvasRef.current, profile, submissions);
    setPreviewUrl(canvasRef.current.toDataURL("image/png"));
    setGenerated(true);
  }, [profile, submissions]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `${profile.slug}-taste-card.png`;
    a.click();
  }, [previewUrl, profile]);

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise((resolve) =>
        canvasRef.current.toBlob(resolve, "image/png")
      );
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch {
      // Fallback: just download
      handleDownload();
    }
  }, [handleDownload]);

  if (!profile || submissions.length === 0) return null;

  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Taste Card
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            Share your booth stats as an image
          </div>
        </div>

        {!generated ? (
          <button
            onClick={handleGenerate}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              background: palette.accent,
              color: "#000",
              transition: "all 0.2s",
            }}
          >
            Generate
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCopy}
              style={{
                padding: "10px 16px",
                border: "1px solid #1e1e1e",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                background: "#111",
                color: "#e8e6e3",
              }}
            >
              Copy
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                background: palette.accent,
                color: "#000",
              }}
            >
              Download
            </button>
            <button
              onClick={handleGenerate}
              style={{
                padding: "10px 16px",
                border: "1px solid #1e1e1e",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                background: "transparent",
                color: "#555",
              }}
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
      />

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Taste Card preview"
          style={{
            width: "100%",
            borderRadius: 10,
            border: "1px solid #1e1e1e",
          }}
        />
      )}
    </div>
  );
}
