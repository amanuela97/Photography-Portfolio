export function appendCacheBuster(
  url?: string | null,
  version?: string | number
): string {
  if (!url) {
    return "";
  }

  if (isSignedUrl(url)) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  const cacheKey = version ?? Date.now().toString();
  return `${url}${separator}v=${cacheKey}`;
}

export function isSignedUrl(target?: string | null): boolean {
  if (!target) {
    return false;
  }
  return /GoogleAccessId=|Signature=|X-Goog-/.test(target);
}
