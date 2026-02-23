/**
 * Builds the tracking script tag for a given site.
 * Uses NEXT_PUBLIC_API_URL if set, otherwise derives from the current page URL.
 */
export function getScriptTag(publicId: string): string {
  const apiUrl = getApiBaseUrl();
  return `<script defer data-site="${publicId}" src="${apiUrl}/oa.js"></script>`;
}

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    // Default: same host, port 3001
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return "http://localhost:3001";
}
