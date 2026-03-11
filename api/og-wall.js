import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const slug = req.query.slug;

  if (!slug) {
    return res.status(400).send("Missing slug");
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!profile) {
    return res.status(404).send("Not found");
  }

  const { data: submissions } = await supabase
    .from("submissions")
    .select("album_name, artist_name, album_art_url, rating")
    .eq("wall_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const subList = submissions || [];
  const listenedCount = subList.filter((s) => s.rating).length;
  const topArtists = [...new Set(subList.map((s) => s.artist_name))].slice(0, 5);

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const siteUrl = `${proto}://${host}`;
  const pageUrl = `${siteUrl}/${slug}`;
  const ogImageUrl = `${siteUrl}/api/og-wall-image?slug=${slug}`;

  const description = [
    profile.bio || `${profile.display_name}'s music recommendation wall.`,
    `${subList.length} album${subList.length !== 1 ? "s" : ""} recommended.`,
    followerCount ? `${followerCount} follower${followerCount !== 1 ? "s" : ""}.` : "",
    topArtists.length > 0 ? `Featuring ${topArtists.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const albumListHtml = subList
    .slice(0, 10)
    .map(
      (s) =>
        `<li>${s.album_name} — ${s.artist_name}${
          s.rating ? ` (${"★".repeat(s.rating)})` : ""
        }</li>`
    )
    .join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${profile.display_name}'s Booth`,
    description,
    url: pageUrl,
    author: {
      "@type": "Person",
      name: profile.display_name,
    },
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${profile.display_name}'s Booth — The Booth</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${pageUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="${profile.display_name}'s Booth" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="The Booth" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${profile.display_name}'s Booth" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImageUrl}" />

  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

  <!-- Redirect real users to SPA -->
  <meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body>
  <h1>${profile.display_name}'s Booth</h1>
  ${profile.bio ? `<p>${profile.bio}</p>` : ""}
  <p>${subList.length} albums recommended${followerCount ? ` · ${followerCount} followers` : ""}</p>
  ${subList.length > 0 ? `<h2>Recent Albums</h2><ol>${albumListHtml}</ol>` : ""}
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
