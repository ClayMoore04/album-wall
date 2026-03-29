// Color extraction from album art using canvas sampling
// Returns dominant color as hex string, cached per URL

const cache = new Map();
const pending = new Map();

/**
 * Extract dominant color from an image URL.
 * Uses a small canvas to sample pixels and find the most vibrant color.
 * Results are cached by URL.
 *
 * @param {string} url - Image URL to extract from
 * @returns {Promise<string>} - Hex color string, e.g. "#e84393"
 */
export function extractColor(url) {
  if (!url) return Promise.resolve(null);
  if (cache.has(url)) return Promise.resolve(cache.get(url));
  if (pending.has(url)) return pending.get(url);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        const color = findDominant(data);
        cache.set(url, color);
        pending.delete(url);
        resolve(color);
      } catch {
        // CORS or other canvas error — fall back gracefully
        pending.delete(url);
        resolve(null);
      }
    };
    img.onerror = () => {
      pending.delete(url);
      resolve(null);
    };
    img.src = url;
  });

  pending.set(url, promise);
  return promise;
}

/**
 * Find the most vibrant/dominant color from pixel data.
 * Skips very dark, very light, and desaturated pixels.
 */
function findDominant(data) {
  // Bucket colors into a simplified palette (5-bit per channel)
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    // Skip very dark or very light pixels
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 230) continue;

    // Skip desaturated pixels
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation < 0.15) continue;

    // Quantize to 5-bit (32 levels per channel)
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const entry = buckets.get(key);
    if (entry) {
      entry.count++;
      entry.r += r;
      entry.g += g;
      entry.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  if (buckets.size === 0) return "#f472b6"; // fallback accent

  // Find bucket with highest count, weighted by saturation
  let best = null;
  let bestScore = 0;

  for (const entry of buckets.values()) {
    const avgR = entry.r / entry.count;
    const avgG = entry.g / entry.count;
    const avgB = entry.b / entry.count;
    const max = Math.max(avgR, avgG, avgB);
    const min = Math.min(avgR, avgG, avgB);
    const sat = max === 0 ? 0 : (max - min) / max;

    // Score = frequency * saturation (prefer vibrant + common)
    const score = entry.count * (0.5 + sat);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (!best) return "#f472b6";

  const r = Math.round(best.r / best.count);
  const g = Math.round(best.g / best.count);
  const b = Math.round(best.b / best.count);

  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/**
 * Convert hex to "r,g,b" string for use in rgba().
 */
export function hexToRgb(hex) {
  if (!hex) return "244,114,182";
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
