import { NavigateFunction } from 'react-router-dom';
import { getApiUrl } from './api';

// Define storage type options
export type StorageType = 'local' | 'session';

/**
 * Sets the authentication token and user data in the specified storage
 * @param token JWT token string
 * @param userData User data object
 * @param storageType Where to store the token ('local' or 'session')
 */
export function setAuthToken(token: string, userData: any, storageType: StorageType = 'session') {
  const storage = storageType === 'local' ? localStorage : sessionStorage;
  
  // Store token and user data
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(userData));
  storage.setItem('storageType', storageType); // Remember which storage type was used
}

/**
 * Retrieves the authentication token from either localStorage or sessionStorage
 * @returns The token string or null if not found
 */
export function getAuthToken(): string | null {
  // First check localStorage
  const localToken = localStorage.getItem('token');
  if (localToken) return localToken;
  
  // Then check sessionStorage
  return sessionStorage.getItem('token');
}

/**
 * Retrieves user data from either localStorage or sessionStorage
 * @returns The user data object or null if not found
 */
export function getUserData(): any | null {
  // First check localStorage
  const localUser = localStorage.getItem('user');
  if (localUser) return JSON.parse(localUser);
  
  // Then check sessionStorage
  const sessionUser = sessionStorage.getItem('user');
  if (sessionUser) return JSON.parse(sessionUser);
  
  return null;
}

/**
 * Checks if the user is authenticated
 * @returns True if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Handles the logout process with proper data cleanup
 * @param navigate React Router's navigate function for redirection
 * @param options Optional configurations for logout
 */
export async function logout(
  navigate: NavigateFunction,
  options: {
    showConfirmation?: boolean;
    onSuccess?: () => void;
    clearAll?: boolean;
  } = {}
) {
  const {
    showConfirmation = false,
    onSuccess,
    clearAll = false
  } = options;
  
  if (showConfirmation) {
    return true; // Return true to indicate that confirmation is pending
  }
  
  try {
    // Optional: Notify backend about logout (if you have such an endpoint)
    const token = getAuthToken();
    if (token) {
      try {
        await fetch(getApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => console.error('Error notifying server about logout:', err));
      } catch (error) {
        // Continue with logout even if server request fails
        console.error('Error notifying server about logout:', error);
      }
    }
    
    // Determine which storage was used
    const storageType = localStorage.getItem('storageType') || 
                        sessionStorage.getItem('storageType') || 
                        'both';
    
    // Clean up localStorage if token was stored there or if clearAll is true
    if (storageType === 'local' || storageType === 'both' || clearAll) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('storageType');
    }
    
    // Always clean up sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('storageType');
    
    // Clear all storage if requested
    if (clearAll) {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Execute success callback if provided
    if (onSuccess) {
      onSuccess();
    }
    
    // Navigate to login page
    navigate('/login');
    
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    // Force logout even if there's an error
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/login');
    return false;
  }
}