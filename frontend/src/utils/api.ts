/**
 * Constructs a full API URL ensuring proper protocol
 * @param path - The API path (should start with '/')
 * @returns The complete API URL
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
  // Ensure baseUrl starts with https:// if not already
  const fullBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${fullBaseUrl}${normalizedPath}`;
}; 