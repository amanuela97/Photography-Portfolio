/**
 * Get the base API URL for fetch calls
 * Uses NEXT_PUBLIC_API_URL if set, otherwise falls back to relative path
 * Works in both client and server components
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Use environment variable if available (for production)
  // NEXT_PUBLIC_* vars are available in both client and server in Next.js
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (baseUrl) {
    // Ensure baseUrl doesn't end with a slash
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/${cleanPath}`;
  }

  // Fallback to relative path (works for same-origin requests)
  return `/${cleanPath}`;
}
