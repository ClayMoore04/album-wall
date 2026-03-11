const BOT_USER_AGENTS =
  /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp|ChatGPT|claude|perplexity|discordbot|Applebot|iMessagebot|Snapchat|TelegramBot/i;

const RESERVED_PATHS = new Set([
  "signup", "login", "dashboard", "callback", "discover",
  "rooms", "room", "mixtapes", "mixtape", "api", "assets",
  "sitemap", "_next", "favicon.ico",
]);

export default function middleware(request) {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";

  if (!BOT_USER_AGENTS.test(ua)) return;

  // Intercept /mixtape/:id for bots
  const mixtapeMatch = url.pathname.match(
    /^\/mixtape\/([a-f0-9-]{36})$/
  );
  if (mixtapeMatch) {
    const apiUrl = new URL(
      `/api/og-mixtape?id=${mixtapeMatch[1]}`,
      request.url
    );
    return fetch(apiUrl);
  }

  // Intercept /:slug (wall pages) for bots
  const slugMatch = url.pathname.match(/^\/([a-z0-9][a-z0-9-]{0,29})$/);
  if (slugMatch && !RESERVED_PATHS.has(slugMatch[1])) {
    const apiUrl = new URL(
      `/api/og-wall?slug=${slugMatch[1]}`,
      request.url
    );
    return fetch(apiUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|assets/).*)"],
};
