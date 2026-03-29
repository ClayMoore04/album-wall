import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "./AuthProvider";
import { supabase } from "../lib/supabase";
import { palette, getColor } from "../lib/palette";
import { timeAgo } from "../lib/timeAgo";
import { injectAnimations } from "../lib/animations";
import MixtapeCoverArt from "./MixtapeCoverArt";

import Skeleton from "./Skeleton";

function FeedCardSkeleton({ delay = 0 }) {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        gap: 14,
        ...(delay > 0
          ? { animation: `itb-fadeInUp 0.35s ease ${delay}s both` }
          : {}),
      }}
    >
      <Skeleton width={48} height={48} borderRadius={8} />
      <div style={{ flex: 1 }}>
        <Skeleton width="80%" height={14} borderRadius={4} />
        <div style={{ marginTop: 8 }}>
          <Skeleton width="50%" height={12} borderRadius={4} />
        </div>
        <div style={{ marginTop: 8 }}>
          <Skeleton width="25%" height={10} borderRadius={4} />
        </div>
      </div>
    </div>
  );
}

export default function HomeFeed() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectAnimations();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (profile) fetchFeed();
  }, [user, profile]);

  async function fetchFeed() {
    setLoading(true);

    // Get followed user IDs
    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followedIds = (followRows || []).map((r) => r.following_id);

    if (followedIds.length === 0) {
      setFeedItems([]);
      setLoading(false);
      return;
    }

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Fetch all four sources in parallel
    const [subsResult, mixtapesResult, tradesResult, followersResult] = await Promise.all([
      // Submissions on followed users' walls
      supabase
        .from("submissions")
        .select("id, album_name, artist_name, album_art_url, submitted_by, created_at, wall_id")
        .in("wall_id", followedIds)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(20),

      // Public mixtapes from followed users
      supabase
        .from("mixtapes")
        .select("id, title, user_id, cover_art_index, created_at")
        .in("user_id", followedIds)
        .eq("is_public", true)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),

      // Completed trades involving followed users
      supabase
        .from("mixtape_trades")
        .select("id, sender_id, receiver_id, completed_at, created_at, status")
        .eq("status", "completed")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),

      // New followers of the current user
      supabase
        .from("follows")
        .select("id, follower_id, created_at")
        .eq("following_id", user.id)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // Gather all profile IDs we need to look up
    const profileIds = new Set(followedIds);
    (tradesResult.data || []).forEach((t) => {
      profileIds.add(t.sender_id);
      profileIds.add(t.receiver_id);
    });
    (followersResult.data || []).forEach((f) => {
      profileIds.add(f.follower_id);
    });

    // Fetch profiles for display names and slugs
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, slug")
      .in("id", [...profileIds]);

    const profileMap = {};
    (profiles || []).forEach((p) => {
      profileMap[p.id] = p;
    });

    // Fetch tracks for mixtape cover art
    const mixtapeIds = (mixtapesResult.data || []).map((m) => m.id);
    let tracksMap = {};
    if (mixtapeIds.length > 0) {
      const { data: tracks } = await supabase
        .from("mixtape_tracks")
        .select("mixtape_id, album_art_url")
        .in("mixtape_id", mixtapeIds)
        .order("position", { ascending: true });

      (tracks || []).forEach((t) => {
        if (!tracksMap[t.mixtape_id]) tracksMap[t.mixtape_id] = [];
        tracksMap[t.mixtape_id].push(t);
      });
    }

    // Build unified feed
    const items = [];

    (subsResult.data || []).forEach((sub) => {
      const wallOwner = profileMap[sub.wall_id];
      items.push({
        type: "submission",
        id: `sub-${sub.id}`,
        created_at: sub.created_at,
        data: sub,
        wallOwner,
      });
    });

    (mixtapesResult.data || []).forEach((mix) => {
      const owner = profileMap[mix.user_id];
      items.push({
        type: "mixtape",
        id: `mix-${mix.id}`,
        created_at: mix.created_at,
        data: mix,
        owner,
        tracks: tracksMap[mix.id] || [],
      });
    });

    // Filter trades to only include those involving followed users
    (tradesResult.data || []).forEach((trade) => {
      if (
        !followedIds.includes(trade.sender_id) &&
        !followedIds.includes(trade.receiver_id)
      )
        return;
      const sender = profileMap[trade.sender_id];
      const receiver = profileMap[trade.receiver_id];
      items.push({
        type: "trade",
        id: `trade-${trade.id}`,
        created_at: trade.completed_at || trade.created_at,
        sender,
        receiver,
      });
    });

    (followersResult.data || []).forEach((follow) => {
      const follower = profileMap[follow.follower_id];
      items.push({
        type: "follower",
        id: `follow-${follow.id}`,
        created_at: follow.created_at,
        follower,
      });
    });

    // Sort by created_at desc
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFeedItems(items);
    setLoading(false);
  }

  const quickLinkStyle = {
    padding: "8px 16px",
    border: "1px solid #1e1e1e",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
    textDecoration: "none",
    color: "#e8e6e3",
    background: "#111",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  };

  return (
    <>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: "'Syne', sans-serif",
            margin: 0,
          }}
        >
          Feed
        </h1>
        <Link
          to="/dashboard"
          style={{
            fontSize: 11,
            fontFamily: "'Space Mono', monospace",
            color: "#555",
            textDecoration: "none",
          }}
        >
          Manage
        </Link>
      </div>

      {/* Quick links */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {profile && (
          <Link to={`/${profile.slug}`} style={quickLinkStyle}>
            My Booth
          </Link>
        )}
        <Link to="/mixtapes" style={quickLinkStyle}>
          Mixtapes
        </Link>
        <Link to="/rooms" style={quickLinkStyle}>
          Rooms
        </Link>
      </div>

      {/* Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <>
            <FeedCardSkeleton />
            <FeedCardSkeleton delay={0.08} />
            <FeedCardSkeleton delay={0.16} />
            <FeedCardSkeleton delay={0.24} />
            <FeedCardSkeleton delay={0.32} />
          </>
        ) : feedItems.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#111",
              border: "1px solid #1e1e1e",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                marginBottom: 8,
              }}
            >
              Your feed is empty
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#555",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Follow some booths to see activity here
            </div>
            <Link
              to="/discover"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "#f472b6",
                color: "#000",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                textDecoration: "none",
              }}
            >
              Discover Booths
            </Link>
          </div>
        ) : (
          feedItems.map((item, i) => (
            <FeedCard
              key={item.id}
              item={item}
              entranceIndex={i}
            />
          ))
        )}
      </div>
    </>
  );
}

function FeedCard({ item, entranceIndex }) {
  const [hovered, setHovered] = useState(false);

  const cardStyle = {
    background: "#111",
    border: `1px solid ${hovered ? "rgba(244,114,182,0.3)" : "#1e1e1e"}`,
    borderRadius: 12,
    padding: 16,
    display: "flex",
    gap: 14,
    textDecoration: "none",
    color: "#e8e6e3",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: hovered ? "0 4px 16px rgba(244,114,182,0.08)" : "none",
    cursor: "pointer",
  };

  const MotionWrapper = ({ children, linkTo }) => {
    const inner = (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 24,
          delay: Math.min(entranceIndex, 10) * 0.05,
        }}
      >
        {children}
      </motion.div>
    );
    return linkTo ? inner : inner;
  };

  if (item.type === "submission") {
    const { data: sub, wallOwner } = item;
    const wallSlug = wallOwner?.slug || "";
    const wallName = wallOwner?.display_name || "someone";

    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: Math.min(entranceIndex, 10) * 0.05 }}
      >
      <Link
        to={`/${wallSlug}`}
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Album art */}
        {sub.album_art_url ? (
          <img
            src={sub.album_art_url}
            alt=""
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${getColor(sub.artist_name)}, ${getColor(sub.album_name)})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              color: "rgba(255,255,255,0.9)",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {(sub.album_name || "?")[0]?.toUpperCase()}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontWeight: 700 }}>{sub.artist_name}</span>
            <span style={{ color: "#555" }}> - </span>
            <span>{sub.album_name}</span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#555",
              marginTop: 4,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            recommended to {wallName}'s wall
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#333",
              marginTop: 4,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {timeAgo(sub.created_at)}
          </div>
        </div>
      </Link>
      </motion.div>
    );
  }

  if (item.type === "mixtape") {
    const { data: mix, owner, tracks } = item;
    const ownerName = owner?.display_name || "someone";
    const ownerSlug = owner?.slug || "";

    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: Math.min(entranceIndex, 10) * 0.05 }}
      >
      <Link
        to={`/mixtape/${mix.id}`}
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ flexShrink: 0 }}>
          <MixtapeCoverArt
            tracks={tracks}
            coverArtIndex={mix.cover_art_index}
            size={48}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontWeight: 700 }}>{ownerName}</span>
            <span style={{ color: "#555" }}>
              {" "}
              published a new mixtape
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#f472b6",
              marginTop: 4,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {mix.title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: "'Space Mono', monospace",
                color: "#555",
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(244,114,182,0.1)",
              }}
            >
              {tracks.length} tracks
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#333",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {timeAgo(mix.created_at)}
            </span>
          </div>
        </div>
      </Link>
      </motion.div>
    );
  }

  if (item.type === "trade") {
    const { sender, receiver } = item;
    const senderName = sender?.display_name || "someone";
    const receiverName = receiver?.display_name || "someone";

    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: Math.min(entranceIndex, 10) * 0.05 }}
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            flexShrink: 0,
            background: "rgba(239,68,68,0.1)",
            border: `1px solid rgba(239,68,68,0.2)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          &#x21C4;
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700 }}>{senderName}</span>
            <span style={{ color: "#555" }}> and </span>
            <span style={{ fontWeight: 700 }}>{receiverName}</span>
          </div>
          <div
            style={{
              fontSize: 12, color: "#ef4444", marginTop: 4,
              fontFamily: "'Space Mono', monospace", fontWeight: 600,
            }}
          >
            completed a tape trade
          </div>
          <div style={{ fontSize: 11, color: "#333", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
            {timeAgo(item.created_at)}
          </div>
        </div>
      </motion.div>
    );
  }

  if (item.type === "follower") {
    const { follower } = item;
    const name = follower?.display_name || "Someone";
    const slug = follower?.slug || "";

    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: Math.min(entranceIndex, 10) * 0.05 }}
      >
        <Link
          to={`/${slug}`}
          style={cardStyle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              flexShrink: 0,
              background: `linear-gradient(135deg, ${getColor(name)}, ${palette.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: "rgba(255,255,255,0.9)",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {name[0]?.toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700 }}>{name}</span>
              <span style={{ color: "#555" }}> started following you</span>
            </div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
              {timeAgo(item.created_at)}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return null;
}
