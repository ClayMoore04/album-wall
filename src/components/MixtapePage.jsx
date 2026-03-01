import { palette } from "../lib/palette";
import useMixtapeData from "../hooks/useMixtapeData";
import MixtapeEditView from "./MixtapeEditView";
import MixtapePublicView from "./MixtapePublicView";

export default function MixtapePage() {
  const data = useMixtapeData();

  if (data.loading || data.loadingMixtape) {
    return (
      <div
        style={{ textAlign: "center", padding: 80, color: palette.textMuted }}
      >
        Loading...
      </div>
    );
  }

  if (data.notFound) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Mixtape Not Found
        </h2>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          This mixtape doesn't exist or is private.
        </p>
        <button
          onClick={() => data.navigate("/mixtapes")}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            background: palette.accent,
            color: "#000",
          }}
        >
          Go to Mixtapes
        </button>
      </div>
    );
  }

  // Owner or collaborator sees the edit view
  if (data.isOwner || data.isCollaborator) {
    return <MixtapeEditView {...data} />;
  }

  // Everyone else sees the gatefold public view
  return <MixtapePublicView {...data} />;
}
