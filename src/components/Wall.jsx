import { useState, useMemo } from "react";
import { palette } from "../lib/palette";
import { TAGS } from "../lib/tags";
import WallCard from "./WallCard";
import { WallCardSkeleton } from "./Skeleton";

export default function Wall({
  submissions,
  loading,
  isOwner,
  ownerName,
  onFeedback,
  onDelete,
  onListened,
  onRate,
  pinnedIds = [],
  onPin,
  onUnpin,
  newSubmissionCount = 0,
  onDismissNew,
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

  // Separate pinned and unpinned submissions
  const pinnedSubmissions = useMemo(() => {
    if (pinnedIds.length === 0) return [];
    return pinnedIds
      .map((id) => submissions.find((s) => s.id === id))
      .filter(Boolean);
  }, [submissions, pinnedIds]);

  const filtered = useMemo(() => {
    // Exclude pinned from the main list
    let result = submissions.filter((s) => !pinnedIds.includes(s.id));

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
  }, [submissions, pinnedIds, filterTags, listenedFilter, sortBy]);

  const hasActiveFilters =
    filterTags.length > 0 || listenedFilter !== "all" || sortBy !== "newest";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <WallCardSkeleton key={i} delay={i * 0.15} />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    if (isOwner) {
      const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      };
      return (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🧱</div>
          <p
            style={{
              color: "#555",
              fontFamily: "'Space Mono', monospace",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            Your wall is empty — share your booth link to get recommendations.
          </p>
          <button
            onClick={handleCopyLink}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              background: palette.accent,
              color: "#000",
            }}
          >
            Copy booth link
          </button>
        </div>
      );
    }
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 42, marginBottom: 12 }}>🧱</div>
        <p
          style={{
            color: "#555",
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          No albums on the wall yet.
        </p>
        <p
          style={{
            color: palette.accent,
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Be the first to drop one — switch to the Submit tab!
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
          : "1px solid #1e1e1e",
        background: active ? "rgba(236,72,153,0.15)" : "transparent",
        color: active ? palette.accent : "#555",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'Space Mono', monospace",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        boxShadow: active ? "0 0 8px rgba(236,72,153,0.2)" : "none",
      }}
    >
      {label}
    </button>
  );

  const cardProps = (sub, index) => ({
    key: sub.id,
    submission: sub,
    isOwner,
    ownerName,
    onFeedback,
    onDelete,
    onListened,
    onRate,
    isPinned: pinnedIds.includes(sub.id),
    canPin: pinnedIds.length < 3,
    onPin,
    onUnpin,
    entranceIndex: index,
  });

  return (
    <div>
      {/* New submissions banner */}
      {newSubmissionCount > 0 && (
        <button
          onClick={() => {
            onDismissNew && onDismissNew();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          style={{
            position: "sticky",
            top: 8,
            zIndex: 10,
            width: "100%",
            padding: "10px 16px",
            border: "none",
            borderRadius: 10,
            background: palette.accent,
            color: "#000",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          {newSubmissionCount} new — tap to see
        </button>
      )}

      {/* Pinned albums section */}
      {pinnedSubmissions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: "#333",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12 }}>📌</span> Pinned
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pinnedSubmissions.map((sub, i) => (
              <WallCard {...cardProps(sub, i)} />
            ))}
          </div>
        </div>
      )}

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
              border: "1px solid #1e1e1e",
              background: showFilter ? "#1a1a1a" : "transparent",
              color: "#555",
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
                color: "#ef4444",
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
            color: "#333",
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
            background: "#111",
            border: "1px solid #1e1e1e",
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
                color: "#333",
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
                color: "#333",
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
                color: "#333",
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
        {filtered.map((sub, i) => (
          <WallCard {...cardProps(sub, i)} />
        ))}
        {filtered.length === 0 && submissions.length > 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#555",
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
