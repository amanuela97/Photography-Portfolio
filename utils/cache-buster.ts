export function appendCacheBuster(
  url?: string | null,
  version?: string | number
): string {
  if (!url) {
    return "";
  }
  const separator = url.includes("?") ? "&" : "?";
  const cacheKey = version ?? Date.now().toString();
  return `${url}${separator}v=${cacheKey}`;
}
