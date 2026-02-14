import { useState, useMemo } from "react";
import { palette } from "../lib/palette";
import { TAGS } from "../lib/tags";
import WallCard from "./WallCard";

export default function Wall({
  submissions,
  loading,
  isAdmin,
  onFeedback,
  onDelete,
  onListened,
  onRate,
}) {
  const [filterTags, setFilterTags] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [listenedFilter, setListenedFilter] = useState("all"); // "all" | "listened" | "unlistened"
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "rating"

  const toggleTag = (tag) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    let result = [...submissions];

    // Tag filter (OR logic)
    if (filterTags.length > 0) {
      result = result.filter(
        (s) => s.tags && s.tags.some((t) => filterTags.includes(t))
      );
    }

    // Listened filter
    if (listenedFilter === "listened") {
      result = result.filter((s) => s.listened);
    } else if (listenedFilter === "unlistened") {
      result = result.filter((s) => !s.listened);
    }

    // Sort
    if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [submissions, filterTags, listenedFilter, sortBy]);

  const hasActiveFilters =
    filterTags.length > 0 || listenedFilter !== "all" || sortBy !== "newest";

  if (loading) {
    return (
      <div
        style={{ textAlign: "center", padding: 60, color: palette.textMuted }}
      >
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

  const pillBtn = (label, active, onClick) => (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: 16,
        border: active
          ? `1px solid ${palette.accent}`
          : `1px solid ${palette.border}`,
        background: active ? "rgba(29,185,84,0.15)" : "transparent",
        color: active ? palette.accent : palette.textMuted,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'Space Mono', monospace",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Filter toggle + sort */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={() => setShowFilter(!showFilter)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              background: showFilter ? palette.surfaceHover : "transparent",
              color: palette.textMuted,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
            }}
          >
            Filter {hasActiveFilters ? "●" : ""}
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterTags([]);
                setListenedFilter("all");
                setSortBy("newest");
              }}
              style={{
                padding: "4px 8px",
                border: "none",
                background: "transparent",
                color: palette.coral,
                fontSize: 11,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: palette.textDim,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {filtered.length} album{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div
          style={{
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          {/* Status filter */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                color: palette.textDim,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Status
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {pillBtn("All", listenedFilter === "all", () =>
                setListenedFilter("all")
              )}
              {pillBtn("Listened", listenedFilter === "listened", () =>
                setListenedFilter("listened")
              )}
              {pillBtn("Unlistened", listenedFilter === "unlistened", () =>
                setListenedFilter("unlistened")
              )}
            </div>
          </div>

          {/* Sort */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                color: palette.textDim,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Sort
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {pillBtn("Newest", sortBy === "newest", () =>
                setSortBy("newest")
              )}
              {pillBtn("Top Rated", sortBy === "rating", () =>
                setSortBy("rating")
              )}
            </div>
          </div>

          {/* Tag filter */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                color: palette.textDim,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Vibes
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TAGS.map((tag) =>
                pillBtn(tag, filterTags.includes(tag), () => toggleTag(tag))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((sub) => (
          <WallCard
            key={sub.id}
            submission={sub}
            isAdmin={isAdmin}
            onFeedback={onFeedback}
            onDelete={onDelete}
            onListened={onListened}
            onRate={onRate}
          />
        ))}
        {filtered.length === 0 && submissions.length > 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
            }}
          >
            No albums match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
