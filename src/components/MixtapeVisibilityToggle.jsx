import { palette } from "../lib/palette";
import { toggleSwitchStyle } from "../lib/styles";

export default function MixtapeVisibilityToggle({ mixtape, onToggle }) {
  const isPublic = mixtape?.is_public !== false;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <div
        onClick={onToggle}
        style={toggleSwitchStyle(isPublic).outer}
      >
        <div style={toggleSwitchStyle(isPublic).knob} />
      </div>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            color: palette.text,
          }}
        >
          {isPublic ? "Public" : "Private"}
        </div>
        <div
          style={{
            fontSize: 10,
            color: palette.textDim,
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
