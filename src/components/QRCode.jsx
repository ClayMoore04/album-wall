import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { palette } from "../lib/palette";

export default function QRCode({ url, size = 160 }) {
  const svgRef = useRef(null);

  const handleDownload = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = palette.surface;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      link.download = "booth-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div
        ref={svgRef}
        style={{
          background: palette.text,
          padding: 12,
          borderRadius: 10,
          display: "inline-block",
        }}
      >
        <QRCodeSVG
          value={url}
          size={size}
          bgColor={palette.text}
          fgColor={palette.bg}
          level="M"
        />
      </div>
      <button
        onClick={handleDownload}
        style={{
          padding: "6px 14px",
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
          background: "transparent",
          color: palette.textMuted,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "'Space Mono', monospace",
          cursor: "pointer",
        }}
      >
        Download QR
      </button>
    </div>
  );
}
