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

  // Get cover art URL (same logic as frontend MixtapeCoverArt)
  let coverUrl = null;
  if (mixtape.custom_cover_url) {
    coverUrl = mixtape.custom_cover_url;
  } else if (
    mixtape.cover_art_index != null &&
    trackList[mixtape.cover_art_index]?.album_art_url
  ) {
    coverUrl = trackList[mixtape.cover_art_index].album_art_url;
  }

  // First 4 album arts for collage fallback
  const arts = trackList
    .filter((t) => t.album_art_url)
    .slice(0, 4)
    .map((t) => t.album_art_url);

  // Side A / Side B split (60min threshold)
  let sideAMs = 0;
  let splitIdx = trackList.length;
  for (let i = 0; i < trackList.length; i++) {
    if (sideAMs + trackList[i].duration_ms > 60 * 60000) {
      splitIdx = i;
      break;
    }
    sideAMs += trackList[i].duration_ms;
  }

  // Show up to 5 tracks from each side
  const sideATracks = trackList.slice(0, Math.min(splitIdx, 5));
  const sideBTracks = trackList.slice(splitIdx, splitIdx + 5);

  const formatTrackMs = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        },
        children: [
          // Ambient gradient background from accent
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "radial-gradient(ellipse at 25% 50%, rgba(236,72,153,0.08) 0%, transparent 70%)",
              },
            },
          },
          // Left: cover art area
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "60px 40px 60px 60px",
                position: "relative",
              },
              children: [
                // Vinyl record behind cover
                {
                  type: "div",
                  props: {
                    style: {
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-15%, -50%)",
                      width: 260,
                      height: 260,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle, #111 0%, #111 15%, #1a1a1a 15.5%, #1a1a1a 16%, #111 16.5%, #111 30%, #1a1a1a 30.5%, #1a1a1a 31%, #111 31.5%, #111 45%, #1a1a1a 45.5%, #1a1a1a 46%, #111 46.5%)",
                    },
                    children: {
                      type: "div",
                      props: {
                        style: {
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          background: "#ec4899",
                          opacity: 0.7,
                        },
                      },
                    },
                  },
                },
                // Cover art
                coverUrl
                  ? {
                      type: "img",
                      props: {
                        src: coverUrl,
                        width: 280,
                        height: 280,
                        style: {
                          objectFit: "cover",
                          borderRadius: 12,
                          position: "relative",
                          zIndex: 1,
                          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                        },
                      },
                    }
                  : arts.length > 0
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
                            position: "relative",
                            zIndex: 1,
                            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
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
                            color: "#333",
                            position: "relative",
                            zIndex: 1,
                          },
                          children: "M",
                        },
                      },
              ],
            },
          },
          // Right: text + tracklist preview
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                padding: "60px 60px 60px 30px",
              },
              children: [
                // Label
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 11,
                      color: "#ec4899",
                      letterSpacing: 3,
                      marginBottom: 12,
                      textTransform: "uppercase",
                    },
                    children: "MIXTAPE",
                  },
                },
                // Title
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 42,
                      fontWeight: 800,
                      color: "#e8e6e3",
                      lineHeight: 1.1,
                      marginBottom: 8,
                    },
                    children:
                      mixtape.title.length > 28
                        ? mixtape.title.slice(0, 28) + "..."
                        : mixtape.title,
                  },
                },
                // Theme
                mixtape.theme
                  ? {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 16,
                          color: "#ec4899",
                          marginBottom: 10,
                          fontStyle: "italic",
                        },
                        children: `for: ${mixtape.theme}`,
                      },
                    }
                  : null,
                // Creator + stats
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 15,
                      color: "#555",
                      marginBottom: 20,
                    },
                    children: `by ${creator}  ·  ${trackList.length} tracks  ·  ${duration}`,
                  },
                },
                // Tracklist preview
                trackList.length > 0
                  ? {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          gap: 30,
                        },
                        children: [
                          // Side A
                          {
                            type: "div",
                            props: {
                              style: { display: "flex", flexDirection: "column" },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: 10,
                                      color: "#ec4899",
                                      letterSpacing: 2,
                                      marginBottom: 8,
                                    },
                                    children: "SIDE A",
                                  },
                                },
                                ...sideATracks.map((t, i) => ({
                                  type: "div",
                                  props: {
                                    key: `a${i}`,
                                    style: {
                                      fontSize: 12,
                                      color: "#666",
                                      marginBottom: 4,
                                      lineHeight: 1.3,
                                    },
                                    children: `${t.track_name.length > 22 ? t.track_name.slice(0, 22) + "..." : t.track_name}  ${formatTrackMs(t.duration_ms)}`,
                                  },
                                })),
                                splitIdx > 5
                                  ? {
                                      type: "div",
                                      props: {
                                        style: { fontSize: 11, color: "#333", marginTop: 2 },
                                        children: `+${splitIdx - 5} more`,
                                      },
                                    }
                                  : null,
                              ].filter(Boolean),
                            },
                          },
                          // Side B
                          sideBTracks.length > 0
                            ? {
                                type: "div",
                                props: {
                                  style: { display: "flex", flexDirection: "column" },
                                  children: [
                                    {
                                      type: "div",
                                      props: {
                                        style: {
                                          fontSize: 10,
                                          color: "#ec4899",
                                          letterSpacing: 2,
                                          marginBottom: 8,
                                        },
                                        children: "SIDE B",
                                      },
                                    },
                                    ...sideBTracks.map((t, i) => ({
                                      type: "div",
                                      props: {
                                        key: `b${i}`,
                                        style: {
                                          fontSize: 12,
                                          color: "#666",
                                          marginBottom: 4,
                                          lineHeight: 1.3,
                                        },
                                        children: `${t.track_name.length > 22 ? t.track_name.slice(0, 22) + "..." : t.track_name}  ${formatTrackMs(t.duration_ms)}`,
                                      },
                                    })),
                                    trackList.length - splitIdx > 5
                                      ? {
                                          type: "div",
                                          props: {
                                            style: { fontSize: 11, color: "#333", marginTop: 2 },
                                            children: `+${trackList.length - splitIdx - 5} more`,
                                          },
                                        }
                                      : null,
                                  ].filter(Boolean),
                                },
                              }
                            : null,
                        ].filter(Boolean),
                      },
                    }
                  : null,
                // Branding
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 12,
                      color: "#252525",
                      marginTop: 24,
                      letterSpacing: 2,
                    },
                    children: "THE BOOTH",
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
