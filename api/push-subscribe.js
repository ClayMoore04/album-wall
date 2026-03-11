import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { subscription, userId } = req.body;

  if (!subscription || !userId) {
    return res.status(400).json({ error: "Missing subscription or userId" });
  }

  if (user.id !== userId) {
    return res.status(403).json({ error: "User ID mismatch" });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    console.error("Failed to store push subscription:", error);
    return res.status(500).json({ error: "Failed to store subscription" });
  }

  return res.status(200).json({ success: true });
}
