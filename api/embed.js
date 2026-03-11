import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { slug, theme = "dark" } = req.query;

  if (!slug) {
    return res.status(400).send("Missing slug parameter");
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, slug")
    .eq("slug", slug)
    .single();

  if (!profile) {
    return res.status(404).send("Booth not found");
  }

  const { data: submissions } = await supabase
    .from("submissions")
    .select("album_name, artist_name, album_art_url")
    .eq("wall_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const { count: albumCount } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("wall_id", profile.id);

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const albums = submissions || [];
  const isLight = theme === "light";
  const bg = isLight ? "#fff" : "#0a0a0a";
  const text = isLight ? "#1a1a1a" : "#e8e6e3";
  const textMuted = isLight ? "#666" : "#777";
  const border = isLight ? "#e0e0e0" : "#222";
  const surface = isLight ? "#f5f5f5" : "#141414";
  const accent = "#1DB954";

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const siteUrl = `${proto}://${host}`;
  const boothUrl = `${siteUrl}/${slug}`;

  const albumGrid = albums
    .map(
      (a) =>
        `<div style="width:calc(33.333% - 4px);aspect-ratio:1;border-radius:6px;overflow:hidden;background:${surface};">
          <img src="${a.album_art_url}" alt="${a.album_name} by ${a.artist_name}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
        </div>`
    )
    .join("\n");

  const emptySlots = Math.max(0, 6 - albums.length);
  const emptyGrid = Array(emptySlots)
    .fill(
      `<div style="width:calc(33.333% - 4px);aspect-ratio:1;border-radius:6px;background:${surface};"></div>`
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bg};
      color: ${text};
      width: 320px;
      padding: 20px;
    }
    .header { margin-bottom: 16px; }
    .name {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .stats {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: ${textMuted};
    }
    .stats .accent { color: ${accent}; }
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }
    .footer a {
      display: inline-block;
      padding: 8px 16px;
      background: ${accent};
      color: #000;
      text-decoration: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
    }
    .footer a:hover { opacity: 0.9; }
    .branding {
      margin-top: 12px;
      font-size: 10px;
      color: ${textMuted};
    }
    .branding a { color: ${textMuted}; text-decoration: none; }
    .branding a:hover { color: ${accent}; }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${profile.display_name}</div>
    <div class="stats">
      <span>${albumCount || 0} album${albumCount !== 1 ? "s" : ""}</span>
      <span class="accent">${followerCount || 0} follower${followerCount !== 1 ? "s" : ""}</span>
    </div>
  </div>
  <div class="grid">
    ${albumGrid}
    ${emptyGrid}
  </div>
  <div class="footer">
    <a href="${boothUrl}" target="_blank" rel="noopener noreferrer">View on The Booth</a>
    <div class="branding">
      <a href="${siteUrl}" target="_blank" rel="noopener noreferrer">Powered by The Booth</a>
    </div>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=600"
  );
  res.status(200).send(html);
}
