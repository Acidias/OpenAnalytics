interface IngestionToken {
  public_id?: string;
  secret?: string;
}

/**
 * Builds the tracking script tag for a given site.
 * Uses NEXT_PUBLIC_TRACKER_URL (the public-facing API URL that visitors'
 * browsers will reach), falling back to NEXT_PUBLIC_API_URL.
 */
export function getScriptTag(publicId: string, ingestionToken?: IngestionToken): string {
  const trackerUrl = getTrackerBaseUrl();
  const tokenAttrs = ingestionToken?.public_id && ingestionToken?.secret
    ? ` data-token-id="${ingestionToken.public_id}" data-token="${ingestionToken.secret}"`
    : '';
  return `<script defer data-site="${publicId}"${tokenAttrs} src="${trackerUrl}/oa.js"></script>`;
}

export function isHostedDeployment(): boolean {
  const url = getTrackerBaseUrl();
  return !url.includes('localhost') && !url.includes('127.0.0.1');
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
