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

  const [{ data: submissions }, { count: followerCount }] = await Promise.all([
    supabase
      .from("submissions")
      .select("album_art_url")
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

  const subCount = (submissions || []).length;

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
          // Left: album art grid
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexWrap: "wrap",
                width: 300,
                height: 300,
                borderRadius: 12,
                overflow: "hidden",
                gap: 3,
                flexShrink: 0,
                alignSelf: "center",
              },
              children: arts.length > 0
                ? arts.map((url, i) => ({
                    type: "img",
                    props: {
                      key: i,
                      src: url,
                      width: arts.length <= 1 ? 300 : arts.length <= 4 ? 148 : 98,
                      height: arts.length <= 1 ? 300 : arts.length <= 4 ? 148 : 98,
                      style: { objectFit: "cover" },
                    },
                  }))
                : [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: 300,
                          height: 300,
                          background: "#141414",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 80,
                          color: "#555",
                        },
                        children: "🎙",
                      },
                    },
                  ],
            },
          },
          // Right: text
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                marginLeft: 50,
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 44,
                      fontWeight: 800,
                      color: "#e8e6e3",
                      lineHeight: 1.1,
                      marginBottom: 12,
                    },
                    children: profile.display_name.length > 25
                      ? profile.display_name.slice(0, 25) + "..."
                      : profile.display_name,
                  },
                },
                profile.bio
                  ? {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 18,
                          color: "#777",
                          marginBottom: 16,
                          lineHeight: 1.4,
                        },
                        children: profile.bio.length > 80
                          ? profile.bio.slice(0, 80) + "..."
                          : profile.bio,
                      },
                    }
                  : null,
                profile.status_text
                  ? {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 16,
                          color: "#1DB954",
                          fontStyle: "italic",
                          marginBottom: 16,
                        },
                        children: profile.status_text,
                      },
                    }
                  : null,
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 14,
                      color: "#555",
                      letterSpacing: 2,
                    },
                    children: [
                      subCount > 0 ? `${subCount}+ ALBUMS` : "NO ALBUMS YET",
                      followerCount ? ` · ${followerCount} FOLLOWER${followerCount !== 1 ? "S" : ""}` : "",
                    ].join(""),
                  },
                },
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
