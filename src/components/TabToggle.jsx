import { useState, useEffect, useRef } from "react";
import { palette } from "../lib/palette";
import { injectAnimations } from "../lib/animations";

export default function TabToggle({ view, setView, count }) {
  const tabs = [
    { key: "submit", label: "Submit", icon: "🎵" },
    { key: "wall", label: `Wall (${count})`, icon: "🧱" },
    { key: "guestbook", label: "Guest Book", icon: "📝" },
    { key: "playlist", label: "Playlist", icon: "🎧" },
    { key: "stats", label: "Stats", icon: "📊" },
  ];

  const activeIdx = tabs.findIndex((t) => t.key === view);
  const prevCount = useRef(count);
  const [countPulsing, setCountPulsing] = useState(false);

  useEffect(() => { injectAnimations(); }, []);

  useEffect(() => {
    if (prevCount.current !== count) {
      prevCount.current = count;
      setCountPulsing(true);
      const t = setTimeout(() => setCountPulsing(false), 300);
      return () => clearTimeout(t);
    }
  }, [count]);

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: palette.surface,
        borderRadius: 10,
        padding: 4,
        marginBottom: 32,
        border: `1px solid ${palette.border}`,
        position: "relative",
      }}
    >
      {/* Sliding pill indicator */}
      <div
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: `calc(4px + ${activeIdx} * 20%)`,
          width: "calc(20% - 4px)",
          background: palette.accent,
          borderRadius: 8,
          transition: "left 0.25s ease",
          zIndex: 0,
        }}
      />
      {tabs.map((tab) => {
        const isWallTab = tab.key === "wall";
        return (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              transition: "color 0.2s",
              background: "transparent",
              color: view === tab.key ? "#000" : palette.textMuted,
              position: "relative",
              zIndex: 1,
            }}
          >
            {tab.icon}{" "}
            {isWallTab ? (
              <span style={countPulsing ? { display: "inline-block", animation: "booth-countPulse 0.3s ease" } : undefined}>
                {tab.label}
              </span>
            ) : (
              tab.label
            )}
          </button>
        );
      })}
    </div>
  );
}
