import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: mixtapes } = await supabase
    .from("mixtapes")
    .select("id, updated_at")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(1000);

  const siteUrl = "https://inthebooth.vercel.app";

  const urls = (mixtapes || [])
    .map(
      (m) => `
    <url>
      <loc>${siteUrl}/mixtape/${m.id}</loc>
      <lastmod>${new Date(m.updated_at).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
    </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/discover</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>${urls}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=600"
  );
  res.status(200).send(xml);
}
