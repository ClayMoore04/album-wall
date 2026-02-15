import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { palette } from "../lib/palette";
import { getColor } from "../lib/palette";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ActivityFeed({ followedWallIds }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !followedWallIds?.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("submissions")
        .select("*, profiles!wall_id(display_name, slug)")
        .in("wall_id", followedWallIds)
        .order("created_at", { ascending: false })
        .limit(30);
      setItems(data || []);
      setLoading(false);
    })();
  }, [followedWallIds]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 24,
          color: palette.textMuted,
          fontSize: 13,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        Loading activity...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 24,
          color: palette.textMuted,
          fontSize: 13,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        No recent activity from walls you follow.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: palette.cardBg,
            borderRadius: 10,
            border: `1px solid ${palette.border}`,
          }}
        >
          {item.album_art_url ? (
            <img
              src={item.album_art_url}
              alt=""
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${getColor(item.artist_name)}, ${getColor(item.album_name)})`,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.album_name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: palette.textMuted,
                fontFamily: "'Space Mono', monospace",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.artist_name}
              {item.profiles && (
                <>
                  {" "}
                  <span style={{ color: palette.textDim }}>on</span>{" "}
                  <Link
                    to={`/${item.profiles.slug}`}
                    style={{ color: palette.accent, textDecoration: "none" }}
                  >
                    {item.profiles.display_name}'s wall
                  </Link>
                </>
              )}
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              color: palette.textDim,
              fontFamily: "'Space Mono', monospace",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {timeAgo(item.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
}
