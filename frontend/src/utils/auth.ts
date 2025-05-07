import { NavigateFunction } from 'react-router-dom';
import { getApiUrl } from './api';

/**
 * Handles the logout process with proper data cleanup
 * @param navigate - React Router's navigate function
 * @param options - Optional configuration
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
  
  // Skip confirmation if not requested
  if (showConfirmation) {
    return true; // Return true to indicate that confirmation is pending
  }
  
  try {
    // Optional: Notify backend about logout (if you have such an endpoint)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(getApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        // Continue with logout even if server request fails
        console.error('Error notifying server about logout:', error);
      }
    }
    
    // Clean up localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear all storage if requested (for security-sensitive applications)
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
    navigate('/login');
    return false;
  }
}