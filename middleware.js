const BOT_USER_AGENTS =
  /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp|ChatGPT|claude|perplexity|discordbot/i;

export default function middleware(request) {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";

  // Only intercept /mixtape/:id for bots
  const mixtapeMatch = url.pathname.match(
    /^\/mixtape\/([a-f0-9-]{36})$/
  );

  if (mixtapeMatch && BOT_USER_AGENTS.test(ua)) {
    const apiUrl = new URL(
      `/api/og-mixtape?id=${mixtapeMatch[1]}`,
      request.url
    );
    return fetch(apiUrl);
  }
}

export const config = {
  matcher: "/mixtape/:path*",
};
