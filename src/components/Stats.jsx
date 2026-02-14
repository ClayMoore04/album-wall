import { useMemo } from "react";
import { palette } from "../lib/palette";

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
        padding: 20,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "'Space Mono', monospace",
          color: palette.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: palette.textDim,
            fontFamily: "'Space Mono', monospace",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function BarChart({ items, maxValue }) {
  if (items.length === 0) return null;
  const max = maxValue || Math.max(...items.map((i) => i.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 80,
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
              color: palette.textMuted,
              textAlign: "right",
              flexShrink: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              flex: 1,
              height: 20,
              background: palette.surface,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${max > 0 ? (item.value / max) * 100 : 0}%`,
                height: "100%",
                background: item.color || palette.accent,
                borderRadius: 4,
                minWidth: item.value > 0 ? 4 : 0,
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div
            style={{
              width: 24,
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
              color: palette.text,
              fontWeight: 600,
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Stats({ submissions }) {
  const stats = useMemo(() => {
    const total = submissions.length;
    const listened = submissions.filter((s) => s.listened).length;
    const rated = submissions.filter((s) => s.rating);
    const avgRating =
      rated.length > 0
        ? (rated.reduce((sum, s) => sum + s.rating, 0) / rated.length).toFixed(1)
        : "—";

    // Top recommenders
    const recommenderMap = {};
    submissions.forEach((s) => {
      const name = s.submitted_by || "Anonymous";
      recommenderMap[name] = (recommenderMap[name] || 0) + 1;
    });
    const topRecommenders = Object.entries(recommenderMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Tag breakdown
    const tagMap = {};
    submissions.forEach((s) => {
      (s.tags || []).forEach((tag) => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });
    const tagBreakdown = Object.entries(tagMap)
      .map(([label, value]) => ({ label, value, color: palette.accent }))
      .sort((a, b) => b.value - a.value);

    // Rating distribution
    const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
      label: "★".repeat(r),
      value: submissions.filter((s) => s.rating === r).length,
      color: "#f5c518",
    }));

    return {
      total,
      listened,
      listenedPct: total > 0 ? Math.round((listened / total) * 100) : 0,
      avgRating,
      topRecommenders,
      tagBreakdown,
      ratingDist,
      withFeedback: submissions.filter((s) => s.daniel_feedback).length,
    };
  }, [submissions]);

  if (submissions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>📊</div>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
          }}
        >
          No data yet — stats will appear
          <br />
          once albums are on the wall.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Top stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard label="Albums" value={stats.total} />
        <StatCard
          label="Listened"
          value={`${stats.listenedPct}%`}
          sub={`${stats.listened} of ${stats.total}`}
        />
        <StatCard label="Avg Rating" value={stats.avgRating} />
        <StatCard label="Reviewed" value={stats.withFeedback} />
      </div>

      {/* Listening progress bar */}
      <div
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            color: palette.textDim,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          Listening Progress
        </div>
        <div
          style={{
            height: 12,
            background: palette.surface,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${stats.listenedPct}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${palette.accent}, #1ed760)`,
              borderRadius: 6,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Top recommenders */}
      {stats.topRecommenders.length > 0 && (
        <div
          style={{
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: palette.textDim,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Top Recommenders
          </div>
          <BarChart items={stats.topRecommenders} />
        </div>
      )}

      {/* Tag breakdown */}
      {stats.tagBreakdown.length > 0 && (
        <div
          style={{
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: palette.textDim,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Vibes Breakdown
          </div>
          <BarChart items={stats.tagBreakdown} />
        </div>
      )}

      {/* Rating distribution */}
      {stats.ratingDist.some((r) => r.value > 0) && (
        <div
          style={{
            background: palette.cardBg,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: palette.textDim,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Rating Distribution
          </div>
          <BarChart items={stats.ratingDist} />
        </div>
      )}
    </div>
  );
}
