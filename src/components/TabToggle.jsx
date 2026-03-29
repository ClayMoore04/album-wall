import { useEffect } from "react";
import { motion } from "framer-motion";
import { injectAnimations } from "../lib/animations";

function hexToRgb(hex = "#f472b6") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export default function TabToggle({ view, setView, tabs, accent = "#f472b6" }) {
  const accentRgb = hexToRgb(accent);

  useEffect(() => { injectAnimations(); }, []);

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
          {/* Animated pill behind active tab */}
          {view === tab.key && (
            <motion.div
              layoutId="tab-pill"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                position: "absolute",
                inset: 0,
                background: accent,
                borderRadius: 8,
                zIndex: -1,
              }}
            />
          )}
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
