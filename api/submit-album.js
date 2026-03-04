import { createClient } from "@supabase/supabase-js";

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;

  // Honeypot check
  if (body.website) {
    // Silently reject — looks like success to bots
    return res.status(200).json({ ok: true });
  }

  // Rate limit by IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many submissions. Try again in a minute." });
  }

  const { wall_id, album_name, artist_name, album_art_url, spotify_url, spotify_id, submitted_by, email, note, tags } = body;

  if (!wall_id || !album_name || !artist_name || !submitted_by || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: inserted, error } = await supabase
    .from("submissions")
    .insert([
      {
        wall_id,
        album_name,
        artist_name,
        album_art_url: album_art_url || null,
        spotify_url: spotify_url || null,
        spotify_id: spotify_id || null,
        submitted_by,
        email,
        note: note || null,
        tags: tags || [],
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("submit-album insert error:", error);
    return res.status(500).json({ error: "Failed to save submission" });
  }

  // Create notification for wall owner
  try {
    await supabase.from("notifications").insert({
      recipient_id: wall_id,
      type: "new_submission",
      entity_id: String(inserted.id),
      data: { album_name, artist_name, submitted_by },
    });
  } catch (e) {
    // Non-critical — don't fail the submission
    console.error("Notification insert failed:", e);
  }

  return res.status(200).json({ ok: true });
}
