import { palette } from "../lib/palette";

export default function TabToggle({ view, setView, count }) {
  const tabs = [
    { key: "submit", label: "Submit a Rec", icon: "🎵" },
    { key: "wall", label: `The Wall (${count})`, icon: "🧱" },
  ];

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
      }}
    >
      {tabs.map((tab) => (
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
            transition: "all 0.2s",
            background: view === tab.key ? palette.accent : "transparent",
            color: view === tab.key ? "#000" : palette.textMuted,
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
