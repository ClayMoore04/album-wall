import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { id, theme = "dark" } = req.query;

  if (!id) {
    return res.status(400).send("Missing id parameter");
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: mixtape } = await supabase
    .from("mixtapes")
    .select("id, title, user_id, tracks, profiles!user_id(display_name, slug)")
    .eq("id", id)
    .single();

  if (!mixtape) {
    return res.status(404).send("Mixtape not found");
  }

  const tracks = mixtape.tracks || [];
  const trackCount = tracks.length;

  // Calculate total duration in minutes
  const totalMs = tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
  const totalMin = Math.round(totalMs / 60000);

  // Get unique album art for collage (up to 4)
  const uniqueArt = [];
  const seen = new Set();
  for (const t of tracks) {
    if (t.album_art_url && !seen.has(t.album_art_url)) {
      seen.add(t.album_art_url);
      uniqueArt.push(t.album_art_url);
      if (uniqueArt.length >= 4) break;
    }
  }

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
  const mixtapeUrl = `${siteUrl}/mixtape/${id}`;
  const creatorName = mixtape.profiles?.display_name || "Unknown";

  // Build collage HTML
  let collageHtml;
  if (uniqueArt.length === 0) {
    collageHtml = `<div style="width:100%;aspect-ratio:1;background:${surface};border-radius:8px;display:flex;align-items:center;justify-content:center;color:${textMuted};font-size:14px;">No artwork</div>`;
  } else if (uniqueArt.length === 1) {
    collageHtml = `<div style="width:100%;aspect-ratio:1;border-radius:8px;overflow:hidden;">
      <img src="${uniqueArt[0]}" style="width:100%;height:100%;object-fit:cover;display:block;" />
    </div>`;
  } else {
    const collageItems = uniqueArt
      .slice(0, 4)
      .map(
        (url) =>
          `<div style="width:calc(50% - 2px);aspect-ratio:1;overflow:hidden;">
            <img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
          </div>`
      )
      .join("\n");
    // Fill empty slots if fewer than 4
    const emptyCollage = Array(Math.max(0, 4 - uniqueArt.length))
      .fill(
        `<div style="width:calc(50% - 2px);aspect-ratio:1;background:${surface};"></div>`
      )
      .join("\n");
    collageHtml = `<div style="display:flex;flex-wrap:wrap;gap:4px;border-radius:8px;overflow:hidden;">
      ${collageItems}
      ${emptyCollage}
    </div>`;
  }

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
    .collage { margin-bottom: 16px; }
    .title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .creator {
      font-size: 12px;
      color: ${textMuted};
      margin-bottom: 10px;
    }
    .meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: ${textMuted};
      margin-bottom: 16px;
    }
    .meta .accent { color: ${accent}; }
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
  <div class="collage">
    ${collageHtml}
  </div>
  <div class="title">${mixtape.title}</div>
  <div class="creator">by ${creatorName}</div>
  <div class="meta">
    <span>${trackCount} track${trackCount !== 1 ? "s" : ""}</span>
    <span class="accent">${totalMin} min</span>
  </div>
  <div class="footer">
    <a href="${mixtapeUrl}" target="_blank" rel="noopener noreferrer">Listen on The Booth</a>
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
