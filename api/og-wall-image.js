import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, bio, status_text")
    .eq("slug", slug)
    .single();

  if (!profile) {
    return new Response("Not found", { status: 404 });
  }

  const [{ data: submissions, count: subCount }, { count: followerCount }] =
    await Promise.all([
      supabase
        .from("submissions")
        .select("album_art_url", { count: "exact" })
        .eq("wall_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id),
    ]);

  const arts = (submissions || [])
    .filter((s) => s.album_art_url)
    .map((s) => s.album_art_url)
    .slice(0, 6);

  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        },
        children: [
          // Ambient gradient
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
                  "radial-gradient(ellipse at 50% 80%, rgba(244,114,182,0.06) 0%, transparent 60%)",
              },
            },
          },
          // Top accent strip
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: "#f472b6",
              },
            },
          },
          // Main content
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "60px 80px",
                flex: 1,
              },
              children: [
                // Label
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 11,
                      color: "#f472b6",
                      letterSpacing: 3,
                      marginBottom: 16,
                      textTransform: "uppercase",
                    },
                    children: "MUSIC RECOMMENDATION WALL",
                  },
                },
                // Name
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 56,
                      fontWeight: 800,
                      color: "#e8e6e3",
                      lineHeight: 1.05,
                      marginBottom: 10,
                    },
                    children:
                      profile.display_name.length > 22
                        ? profile.display_name.slice(0, 22) + "..."
                        : profile.display_name,
                  },
                },
                // Bio
                profile.bio
                  ? {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 18,
                          color: "#555",
                          marginBottom: 12,
                          lineHeight: 1.4,
                        },
                        children:
                          profile.bio.length > 70
                            ? profile.bio.slice(0, 70) + "..."
                            : profile.bio,
                      },
                    }
                  : null,
                // Status
                profile.status_text
                  ? {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 14,
                          color: "#f472b6",
                          fontStyle: "italic",
                          marginBottom: 16,
                        },
                        children: profile.status_text,
                      },
                    }
                  : null,
                // Stats row
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      gap: 20,
                      marginBottom: 28,
                    },
                    children: [
                      subCount > 0
                        ? {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: 24,
                                      fontWeight: 800,
                                      color: "#e8e6e3",
                                    },
                                    children: String(subCount),
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: 12,
                                      color: "#555",
                                      letterSpacing: 1,
                                    },
                                    children: subCount === 1 ? "ALBUM" : "ALBUMS",
                                  },
                                },
                              ],
                            },
                          }
                        : null,
                      followerCount
                        ? {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: 24,
                                      fontWeight: 800,
                                      color: "#e8e6e3",
                                    },
                                    children: String(followerCount),
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: 12,
                                      color: "#555",
                                      letterSpacing: 1,
                                    },
                                    children:
                                      followerCount === 1 ? "FOLLOWER" : "FOLLOWERS",
                                  },
                                },
                              ],
                            },
                          }
                        : null,
                    ].filter(Boolean),
                  },
                },
                // Album art row
                arts.length > 0
                  ? {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          gap: 8,
                        },
                        children: arts.map((url, i) => ({
                          type: "img",
                          props: {
                            key: i,
                            src: url,
                            width: 80,
                            height: 80,
                            style: {
                              objectFit: "cover",
                              borderRadius: 8,
                            },
                          },
                        })),
                      },
                    }
                  : null,
              ].filter(Boolean),
            },
          },
          // Bottom branding
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                bottom: 30,
                right: 60,
                fontSize: 12,
                color: "#252525",
                letterSpacing: 2,
              },
              children: "THE BOOTH",
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
