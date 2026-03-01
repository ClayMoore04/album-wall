import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: mixtape } = await supabase
    .from("mixtapes")
    .select("*, profiles!user_id(display_name)")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!mixtape) {
    return new Response("Not found", { status: 404 });
  }

  const { data: tracks } = await supabase
    .from("mixtape_tracks")
    .select("track_name, artist_name, album_art_url, duration_ms")
    .eq("mixtape_id", id)
    .order("position", { ascending: true });

  const trackList = tracks || [];
  const totalMs = trackList.reduce((s, t) => s + t.duration_ms, 0);
  const totalMins = Math.floor(totalMs / 60000);
  const totalSecs = Math.floor((totalMs % 60000) / 1000);
  const duration = `${totalMins}:${String(totalSecs).padStart(2, "0")}`;
  const creator = mixtape.profiles?.display_name || "Unknown";

  // Get first 4 album arts for collage
  const arts = trackList
    .filter((t) => t.album_art_url)
    .slice(0, 4)
    .map((t) => t.album_art_url);

  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          padding: 60,
          fontFamily: "sans-serif",
        },
        children: [
          // Left: cover art area
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                marginRight: 60,
              },
              children: arts.length > 0
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexWrap: "wrap",
                        width: 280,
                        height: 280,
                        borderRadius: 12,
                        overflow: "hidden",
                        gap: 2,
                      },
                      children: arts.slice(0, 4).map((url, i) => ({
                        type: "img",
                        props: {
                          key: i,
                          src: url,
                          width: arts.length === 1 ? 280 : 138,
                          height: arts.length === 1 ? 280 : 138,
                          style: { objectFit: "cover" },
                        },
                      })),
                    },
                  }
                : {
                    type: "div",
                    props: {
                      style: {
                        width: 280,
                        height: 280,
                        borderRadius: 12,
                        background: "#141414",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 80,
                        color: "#555",
                      },
                      children: "M",
                    },
                  },
            },
          },
          // Right: text content
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
              },
              children: [
                // Title
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 48,
                      fontWeight: 800,
                      color: "#e8e6e3",
                      lineHeight: 1.1,
                      marginBottom: 12,
                    },
                    children: mixtape.title.length > 30
                      ? mixtape.title.slice(0, 30) + "..."
                      : mixtape.title,
                  },
                },
                // Theme
                mixtape.theme
                  ? {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 20,
                          color: "#1DB954",
                          marginBottom: 16,
                          fontStyle: "italic",
                        },
                        children: `for: ${mixtape.theme}`,
                      },
                    }
                  : null,
                // Creator
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 18,
                      color: "#777",
                      marginBottom: 24,
                    },
                    children: `by ${creator}`,
                  },
                },
                // Stats
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 14,
                      color: "#555",
                      letterSpacing: 2,
                    },
                    children: `${trackList.length} TRACKS \u00B7 ${duration}`,
                  },
                },
                // Branding
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 14,
                      color: "#333",
                      marginTop: 40,
                      letterSpacing: 1,
                    },
                    children: "The Booth",
                  },
                },
              ].filter(Boolean),
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  );
}
