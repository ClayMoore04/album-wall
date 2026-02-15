import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify auth via Supabase JWT
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "No authorization token" });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }
  }

  const { email, albumName, artistName, feedback, ownerName } = req.body;

  if (!email || !feedback) {
    return res.status(400).json({ error: "Missing email or feedback" });
  }

  const name = ownerName || "The wall owner";

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("Missing RESEND_API_KEY");
    return res.status(500).json({ error: "Email service not configured" });
  }

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `${name}'s Album Wall <onboarding@resend.dev>`,
        to: [email],
        subject: `${name} listened to ${albumName}! 🎧`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 48px;">💿</span>
            </div>
            <h1 style="font-size: 22px; text-align: center; margin: 0 0 8px;">
              ${name} has thoughts on your rec!
            </h1>
            <p style="text-align: center; color: #777; font-size: 14px; margin: 0 0 24px;">
              You recommended <strong>${albumName}</strong> by <strong>${artistName}</strong>
            </p>
            <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #555; margin: 0 0 8px; font-weight: 600;">
                ${name} says:
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin: 0; color: #111;">
                "${feedback}"
              </p>
            </div>
            <p style="text-align: center; color: #999; font-size: 12px;">
              Sent from ${name}'s Album Wall
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errorBody = await emailRes.text();
      console.error("Resend error:", emailRes.status, errorBody);
      return res.status(500).json({ error: "Failed to send email" });
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("Email send error:", e);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
