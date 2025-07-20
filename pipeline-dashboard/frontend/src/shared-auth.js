/**
 * Shared Authentication Utilities
 * 
 * This module provides shared authentication utilities that can be used
 * by both the main Data Pilot application and the Pipeline Dashboard
 * to ensure consistent JWT token management and single sign-on experience.
 * 
 * Author: Kenan AY
 * Project: Data Pilot & Pipeline Dashboard Integration
 * Date: 2025
 * Copyright: © 2025 Kenan AY - All rights reserved
 * License: Proprietary - Unauthorized use prohibited
 */

// Shared token storage keys
export const TOKEN_KEY = "auth_token";
export const USER_INFO_KEY = "user_info";
export const TOKEN_EXPIRY_KEY = "token_expiry";

/**
 * Check if user is authenticated with valid token
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) {
    return false;
  }
  
  // Check if token has expired
  if (new Date().getTime() > parseInt(expiry, 10)) {
    // Token expired, clean up
    clearAuthData();
    return false;
  }
  
  return true;
}

/**
 * Store authentication data
 * @param {string} token - JWT token
 * @param {Object} userData - User information
 * @param {number} expiryTime - Token expiry timestamp
 */
export function login(token, userData = {}, expiryTime = null) {
  try {
    // If no expiry provided, decode token to get expiration
    let expiry = expiryTime;
    if (!expiry) {
      const tokenData = parseJwt(token);
      expiry = tokenData.exp * 1000; // Convert to milliseconds
    }
    
    // Store auth data
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
    
    // Store user info if available
    if (userData && Object.keys(userData).length > 0) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));
    }
    
    // Notify other tabs/windows about login
    window.dispatchEvent(new StorageEvent('storage', {
      key: TOKEN_KEY,
      newValue: token,
      storageArea: localStorage
    }));
    
  } catch (error) {
    console.error("Error storing authentication data:", error);
    // If we can't parse the token, store it anyway but without expiry
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Clear all authentication data
 */
export function logout() {
  clearAuthData();
  
  // Notify other tabs/windows about logout
  window.dispatchEvent(new StorageEvent('storage', {
    key: TOKEN_KEY,
    newValue: null,
    storageArea: localStorage
  }));
}

/**
 * Get the stored JWT token
 * @returns {string|null} The JWT token or null if not found
 */
export function getToken() {
  // Check expiration before returning
  if (isAuthenticated()) {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Get stored user information
 * @returns {Object|null} User data or null if not found
 */
export function getUserInfo() {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  if (userInfo) {
    try {
      return JSON.parse(userInfo);
    } catch (error) {
      console.error("Error parsing user info:", error);
      return null;
    }
  }
  return null;
}

/**
 * Update stored user information
 * @param {Object} userData - Updated user data
 */
export function updateUserInfo(userData) {
  if (userData && Object.keys(userData).length > 0) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));
  }
}

/**
 * Get token expiration time
 * @returns {number|null} Expiration timestamp or null
 */
export function getTokenExpiry() {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
}

/**
 * Check if token will expire soon (within next 5 minutes)
 * @returns {boolean} True if token expires soon
 */
export function isTokenExpiringSoon() {
  const expiry = getTokenExpiry();
  if (!expiry) return false;
  
  // Check if token expires in less than 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  return (expiry - new Date().getTime()) < fiveMinutes;
}

/**
 * Clear all authentication data from storage
 */
function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Parse JWT token to get payload data
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error parsing JWT token:", error);
    return {};
  }
}

/**
 * Handle redirect after login
 * @param {string} redirectUrl - URL to redirect to after login
 */
export function handlePostLoginRedirect(redirectUrl) {
  if (redirectUrl && redirectUrl !== window.location.href) {
    try {
      const url = new URL(redirectUrl);
      // Security check: only allow redirects to same origin or pipeline dashboard
      if (url.origin === window.location.origin || 
          url.hostname === 'localhost' || 
          url.hostname === '127.0.0.1') {
        window.location.href = redirectUrl;
        return;
      }
    } catch (error) {
      console.error('Invalid redirect URL:', error);
    }
  }
  
  // Default redirect to dashboard
  window.location.href = '/dashboard';
}

/**
 * Get redirect URL from query parameters
 * @returns {string|null} Redirect URL or null
 */
export function getRedirectUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('redirect');
}

/**
 * Create authentication event listener for cross-tab synchronization
 * @param {Function} callback - Callback function to handle auth changes
 * @returns {Function} Cleanup function
 */
export function createAuthListener(callback) {
  const handleStorageChange = (e) => {
    if (e.key === TOKEN_KEY || e.key === USER_INFO_KEY || e.key === TOKEN_EXPIRY_KEY) {
      callback({
        isAuthenticated: isAuthenticated(),
        user: getUserInfo(),
        token: getToken()
      });
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

export default {
  isAuthenticated,
  login,
  logout,
  getToken,
  getUserInfo,
  updateUserInfo,
  getTokenExpiry,
  isTokenExpiringSoon,
  handlePostLoginRedirect,
  getRedirectUrl,
  createAuthListener,
  TOKEN_KEY,
  USER_INFO_KEY,
  TOKEN_EXPIRY_KEY
};