// Helpers for admin-managed `site_content` values.
// Values arrive as strings (plain text or JSON) — parse defensively so a
// missing/malformed key can never crash a public page.

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function parseContent(raw, fallback) {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return raw;
  try {
    return JSON.parse(trimmed);
  } catch {
    return fallback;
  }
}

// Attachment/image URLs are stored relative ("/resources/x.png"); prefix
// with the backend origin only at render time.
export function resourceUrl(url) {
  if (!url) return "";
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function formatDate(value, opts) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}
