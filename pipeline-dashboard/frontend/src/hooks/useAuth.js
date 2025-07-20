/*
Data Pipeline Dashboard - Integrated Authentication Hook

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Integration with Data Pilot main application authentication system.
Shares JWT tokens and user sessions between applications.
*/

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import ApiService from '../services/api';

// Auth Context
const AuthContext = createContext(null);

// Shared token storage keys (same as main Data Pilot app)
const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const USER_INFO_KEY = 'user_info';

// Main Data Pilot API URL for authentication
const MAIN_API_URL = process.env.REACT_APP_MAIN_API_URL || 'http://localhost:8081';

/**
 * JWT Token utilities
 */
const TokenUtils = {
  // Decode JWT token
  decodeToken: (token) => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token) => {
    const decoded = TokenUtils.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  },

  // Check if token expires soon (within 5 minutes)
  isTokenExpiringSoon: (token) => {
    const decoded = TokenUtils.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    return decoded.exp < (currentTime + fiveMinutes);
  },

  // Get token expiration time
  getTokenExpiration: (token) => {
    const decoded = TokenUtils.decodeToken(token);
    return decoded?.exp ? new Date(decoded.exp * 1000) : null;
  }
};

/**
 * Authentication Hook
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage (shared with main Data Pilot app)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
        const storedUser = localStorage.getItem(USER_INFO_KEY);

        if (storedToken && storedUser && storedExpiry) {
          // Check if token is still valid using expiry timestamp
          const expiryTime = parseInt(storedExpiry, 10);
          const currentTime = new Date().getTime();
          
          if (currentTime < expiryTime) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            
            // Set up automatic token refresh monitoring
            setupTokenRefresh(storedToken);
          } else {
            // Token expired, clear data
            clearAuthData();
          }
        } else {
          // No valid authentication data found
          clearAuthData();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for storage changes (when user logs in/out in main app)
    const handleStorageChange = (e) => {
      if (e.key === TOKEN_KEY || e.key === USER_INFO_KEY || e.key === TOKEN_EXPIRY_KEY) {
        // Re-initialize auth when storage changes
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Clear authentication data (shared with main Data Pilot app)
  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Store authentication data (shared with main Data Pilot app)
  const storeAuthData = useCallback((authData) => {
    const { token: newToken, expiry, user: userData } = authData;
    
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));
    
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    
    // Set up automatic token refresh monitoring
    setupTokenRefresh(newToken);
  }, []);

  // Redirect to main Data Pilot app for authentication
  const redirectToLogin = useCallback(() => {
    const currentUrl = window.location.href;
    const loginUrl = `${MAIN_API_URL.replace(':8081', ':3000')}/login?redirect=${encodeURIComponent(currentUrl)}`;
    window.location.href = loginUrl;
  }, []);

  // Login function - redirects to main app instead of handling locally
  const login = useCallback(async (credentials) => {
    // For pipeline dashboard, we redirect to main app for authentication
    // This ensures single sign-on experience
    redirectToLogin();
    
    return {
      success: false,
      message: 'Redirecting to main application for authentication...'
    };
  }, [redirectToLogin]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Call logout API if token exists
      if (token) {
        try {
          await ApiService.logout();
        } catch (error) {
          console.warn('Logout API call failed:', error);
        }
      }
      
      clearAuthData();
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Clear data anyway
      clearAuthData();
      return {
        success: false,
        message: error.message || 'Logout failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, [token, clearAuthData]);

  // Refresh token function - uses main Data Pilot API
  const refreshAuthToken = useCallback(async () => {
    try {
      const response = await fetch(`${MAIN_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.access_token) {
          // Parse token to get expiry
          const tokenData = TokenUtils.decodeToken(data.access_token);
          const expiryTime = tokenData.exp * 1000; // Convert to milliseconds
          
          storeAuthData({
            token: data.access_token,
            expiry: expiryTime,
            user: data.user || user
          });
          
          return {
            success: true,
            token: data.access_token
          };
        }
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      redirectToLogin();
      return {
        success: false,
        message: error.message || 'Token refresh failed'
      };
    }
  }, [token, user, storeAuthData, clearAuthData, redirectToLogin]);

  // Set up automatic token refresh monitoring
  const setupTokenRefresh = useCallback((currentToken) => {
    if (!currentToken) return;

    const checkAndRefreshToken = async () => {
      if (TokenUtils.isTokenExpiringSoon(currentToken)) {
        console.log('Token expiring soon, refreshing...');
        await refreshAuthToken();
      }
    };

    // Check immediately
    checkAndRefreshToken();

    // Set up periodic check (every 4 minutes)
    const interval = setInterval(checkAndRefreshToken, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshAuthToken]);

  // Get current user
  const getCurrentUser = useCallback(() => {
    return user;
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  }, [user]);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.updateProfile(profileData);
      
      if (response.success && response.user) {
        const updatedUser = { ...user, ...response.user };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        return {
          success: true,
          user: updatedUser,
          message: 'Profile updated successfully'
        };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        message: error.message || 'Profile update failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Change password
  const changePassword = useCallback(async (passwordData) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.changePassword(passwordData);
      
      if (response.success) {
        return {
          success: true,
          message: 'Password changed successfully'
        };
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        message: error.message || 'Password change failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get token info
  const getTokenInfo = useCallback(() => {
    if (!token) return null;
    
    const decoded = TokenUtils.decodeToken(token);
    const expiration = TokenUtils.getTokenExpiration(token);
    const isExpired = TokenUtils.isTokenExpired(token);
    const isExpiringSoon = TokenUtils.isTokenExpiringSoon(token);
    
    return {
      decoded,
      expiration,
      isExpired,
      isExpiringSoon,
      raw: token
    };
  }, [token]);

  return {
    // State
    user,
    token,
    isLoading,
    isAuthenticated,
    
    // Functions
    login,
    logout,
    refreshAuthToken,
    redirectToLogin,
    getCurrentUser,
    hasPermission,
    hasRole,
    updateProfile,
    changePassword,
    getTokenInfo,
    
    // Utils
    TokenUtils
  };
};

/**
 * Auth Provider Component
 */
export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;