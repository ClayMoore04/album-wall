import { useState, useEffect, useRef } from "react";
import { injectAnimations } from "../lib/animations";

function hexToRgb(hex = "#ec4899") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export default function TabToggle({ view, setView, tabs, accent = "#ec4899" }) {
  const accentRgb = hexToRgb(accent);
  const activeIdx = tabs.findIndex((t) => t.key === view);

  useEffect(() => { injectAnimations(); }, []);

  const pillWidth = `${100 / tabs.length}%`;

  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: "#111",
        borderRadius: 10,
        padding: 3,
        marginBottom: 24,
        border: "1px solid #1a1a1a",
        position: "relative",
      }}
    >
      {/* Sliding pill */}
      <div
        style={{
          position: "absolute",
          top: 3, bottom: 3,
          left: `calc(3px + ${activeIdx} * ${pillWidth})`,
          width: `calc(${pillWidth} - 3px)`,
          background: accent,
          borderRadius: 8,
          transition: "left 0.25s ease",
          zIndex: 0,
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setView(tab.key)}
          style={{
            flex: 1,
            padding: "9px 0",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.04em",
            transition: "color 0.2s",
            background: "transparent",
            color: view === tab.key ? "#000" : "#444",
            position: "relative",
            zIndex: 1,
            whiteSpace: "nowrap",
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
