import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "../lib/supabase";
import { getCompatibility } from "../lib/compatibility";
import { palette } from "../lib/palette";

const levelColors = {
  "soul mates": palette.accent,
  "kindred spirits": "#6bc5ff",
  "good vibes": "#ffb347",
  "different wavelengths": palette.textMuted,
};

export default function CompatibilityBadge({ userId, compact }) {
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user || !userId || user.id === userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    getCompatibility(supabase, user.id, userId).then((data) => {
      if (!cancelled) {
        setResult(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [user, userId]);

  if (!user || !userId || user.id === userId) return null;
  if (loading) {
    return (
      <span
        style={{
          display: "inline-block",
          width: compact ? 56 : 120,
          height: 18,
          borderRadius: 9,
          background: palette.surface,
        }}
      />
    );
  }
  if (!result) return null;

  const color = levelColors[result.level] || palette.textMuted;

  if (compact) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px",
          borderRadius: 10,
          background: `${color}18`,
          border: `1px solid ${color}33`,
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "'Space Mono', monospace",
          color,
          whiteSpace: "nowrap",
        }}
      >
        {result.score}% match
      </span>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        borderRadius: 10,
        background: palette.surface,
        border: `1px solid ${color}33`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'Space Mono', monospace",
            color,
          }}
        >
          {result.score}%
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "'Space Mono', monospace",
            color: palette.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {result.level}
        </span>
      </div>
      {result.sharedArtists.length > 0 && (
        <div
          style={{
            fontSize: 10,
            fontFamily: "'Space Mono', monospace",
            color: palette.textDim,
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Both like {result.sharedArtists.slice(0, 3).join(", ")}
          {result.sharedArtists.length > 3 && ` +${result.sharedArtists.length - 3}`}
        </div>
      )}
    </div>
  );
}
