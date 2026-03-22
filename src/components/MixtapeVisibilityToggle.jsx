import { palette } from "../lib/palette";

export default function MixtapeVisibilityToggle({ mixtape, onToggle }) {
  const isPublic = mixtape?.is_public !== false;

  const toggleOuter = {
    width: 40,
    height: 22,
    borderRadius: 11,
    background: isPublic ? palette.accent : "#1e1e1e",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
  };

  const toggleKnob = {
    width: 16,
    height: 16,
    borderRadius: 8,
    background: "#fff",
    position: "absolute",
    top: 3,
    left: isPublic ? 21 : 3,
    transition: "left 0.2s",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <div
        onClick={onToggle}
        style={toggleOuter}
      >
        <div style={toggleKnob} />
      </div>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            color: "#e8e6e3",
          }}
        >
          {isPublic ? "Public" : "Private"}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#333",
            fontFamily: "'Space Mono', monospace",
            marginTop: 2,
          }}
        >
          {isPublic
            ? "Anyone can view this mixtape"
            : "Only you and collaborators can view"}
        </div>
      </div>
    </div>
  );
}
