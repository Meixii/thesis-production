/**
 * Constructs a full API URL ensuring proper protocol
 * @param path - The API path (should start with '/')
 * @returns The complete API URL
 */
export const getApiUrl = (path: string): string => {
  let baseUrl = import.meta.env.VITE_BACKEND_URL || '';
  
  // Remove trailing slashes from baseUrl
  baseUrl = baseUrl.replace(/\/+$/, '');

  // Add https:// if no protocol is specified
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }

  // Ensure path starts with / and remove any extra slashes
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
}; 