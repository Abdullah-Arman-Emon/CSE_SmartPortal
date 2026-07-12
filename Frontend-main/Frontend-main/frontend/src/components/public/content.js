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

// Resolve a stored image/attachment value to a loadable URL.
//   - absolute (http/https/protocol-relative/data:)  -> used as-is
//   - backend uploads under /resources/...            -> routed via the API origin
//   - anything else (e.g. "/1.jpg", "/chairman.jpg")  -> a FRONTEND public asset,
//                                                        served as-is by the SPA host
// The /resources check is the key fix: only backend-served files get the
// BACKEND_URL (/api) prefix; frontend public assets must NOT, or they 404.
export function resourceUrl(url) {
  if (!url) return "";
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  if (path.startsWith("/resources")) return `${BACKEND_URL}${path}`;
  return path;
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
