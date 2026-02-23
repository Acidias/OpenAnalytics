/**
 * Builds the tracking script tag for a given site.
 * Uses NEXT_PUBLIC_TRACKER_URL (the public-facing API URL that visitors'
 * browsers will reach), falling back to NEXT_PUBLIC_API_URL.
 */
export function getScriptTag(publicId: string): string {
  const trackerUrl = getTrackerBaseUrl();
  return `<script defer data-site="${publicId}" src="${trackerUrl}/oa.js"></script>`;
}

export function getTrackerBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_TRACKER_URL) {
    return process.env.NEXT_PUBLIC_TRACKER_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return "http://localhost:3001";
}
