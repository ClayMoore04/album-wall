import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, title, body, url, icon } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: "Missing userId or title" });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to fetch subscriptions:", error);
    return res.status(500).json({ error: "Failed to fetch subscriptions" });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({ sent: 0, message: "No subscriptions found" });
  }

  const payload = JSON.stringify({
    title,
    body: body || "",
    url: url || "/",
    icon: icon || "/icons/icon-192.png",
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: sub.keys,
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        return { id: sub.id, status: "sent" };
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid — remove it
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          return { id: sub.id, status: "expired" };
        }
        console.error(`Push failed for sub ${sub.id}:`, err.message);
        return { id: sub.id, status: "failed", error: err.message };
      }
    })
  );

  const sent = results.filter(
    (r) => r.status === "fulfilled" && r.value.status === "sent"
  ).length;
  const expired = results.filter(
    (r) => r.status === "fulfilled" && r.value.status === "expired"
  ).length;

  return res.status(200).json({ sent, expired, total: subscriptions.length });
}
