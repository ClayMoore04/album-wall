import { palette } from "../lib/palette";
import WallCard from "./WallCard";

export default function Wall({ submissions, loading, isAdmin, onFeedback }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: palette.textMuted }}>
        Loading...
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>🧱</div>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
          }}
        >
          No albums on the wall yet.
          <br />
          Be the first to drop one!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {submissions.map((sub) => (
        <WallCard key={sub.id} submission={sub} isAdmin={isAdmin} onFeedback={onFeedback} />
      ))}
    </div>
  );
}
