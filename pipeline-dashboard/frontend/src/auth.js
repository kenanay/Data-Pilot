// src/auth.js
/**
 * Enhanced authentication utilities with proper session management
 * Integrated with Pipeline Dashboard for single sign-on experience
 * 
 * Author: Kenan AY
 * Project: Data Pilot
 * Date: 2025
 * Copyright: © 2025 Kenan AY - All rights reserved
 * License: Proprietary - Unauthorized use prohibited
 */

// Import shared authentication utilities
import SharedAuth from './shared-auth.js';

// Re-export shared constants and functions for backward compatibility
export const {
  TOKEN_KEY,
  USER_INFO_KEY,
  TOKEN_EXPIRY_KEY,
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
  createAuthListener
} = SharedAuth;

// All authentication functions are now imported from shared-auth.js
// This ensures consistency between the main app and pipeline dashboard