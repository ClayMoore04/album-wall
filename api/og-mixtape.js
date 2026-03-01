import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const id = req.query.id;

  if (!id) {
    return res.status(400).send("Missing id");
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: mixtape } = await supabase
    .from("mixtapes")
    .select("*, profiles!user_id(display_name, slug)")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!mixtape) {
    return res.status(404).send("Not found");
  }

  const { data: tracks } = await supabase
    .from("mixtape_tracks")
    .select("track_name, artist_name, album_name, duration_ms, liner_notes, spotify_url")
    .eq("mixtape_id", id)
    .order("position", { ascending: true });

  const trackList = tracks || [];
  const totalMs = trackList.reduce((s, t) => s + t.duration_ms, 0);
  const totalMins = Math.floor(totalMs / 60000);
  const totalSecs = Math.floor((totalMs % 60000) / 1000);
  const duration = `${totalMins}:${String(totalSecs).padStart(2, "0")}`;
  const creator = mixtape.profiles?.display_name || "Unknown";
  const siteUrl = "https://inthebooth.vercel.app";
  const pageUrl = `${siteUrl}/mixtape/${id}`;
  const ogImageUrl = `${siteUrl}/api/og-image?id=${id}`;

  // Top artists for description
  const artists = [...new Set(trackList.map((t) => t.artist_name))].slice(0, 5);
  const description = [
    mixtape.theme ? `A mixtape for: ${mixtape.theme}.` : "A mixtape.",
    `${trackList.length} tracks, ${duration}.`,
    artists.length > 0 ? `Featuring ${artists.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    name: mixtape.title,
    description: description,
    numTracks: trackList.length,
    url: pageUrl,
    creator: {
      "@type": "Person",
      name: creator,
    },
    track: trackList.map((t) => ({
      "@type": "MusicRecording",
      name: t.track_name,
      byArtist: { "@type": "MusicGroup", name: t.artist_name },
      duration: `PT${Math.floor(t.duration_ms / 60000)}M${Math.floor(
        (t.duration_ms % 60000) / 1000
      )}S`,
      ...(t.album_name ? { inAlbum: { "@type": "MusicAlbum", name: t.album_name } } : {}),
    })),
  };

  // Tracklist HTML for noscript
  const tracklistHtml = trackList
    .map(
      (t, i) =>
        `<li>${t.track_name} — ${t.artist_name}${
          t.album_name ? ` (${t.album_name})` : ""
        }${t.liner_notes ? `<br><em>"${t.liner_notes}"</em>` : ""}</li>`
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${mixtape.title} - by ${creator} | The Booth</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${pageUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="music.playlist" />
  <meta property="og:title" content="${mixtape.title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="The Booth" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${mixtape.title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImageUrl}" />

  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

  <!-- Redirect real users to SPA -->
  <meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body>
  <h1>${mixtape.title}</h1>
  <p>by ${creator}</p>
  ${mixtape.theme ? `<p><em>for: ${mixtape.theme}</em></p>` : ""}
  <p>${trackList.length} tracks &middot; ${duration}</p>
  <h2>Tracklist</h2>
  <ol>${tracklistHtml}</ol>
  <p><a href="${siteUrl}">The Booth</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=600"
  );
  res.status(200).send(html);
}
