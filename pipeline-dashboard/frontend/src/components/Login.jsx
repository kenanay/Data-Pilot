/*
Data Pipeline Dashboard - Integrated Login Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Integrated with Data Pilot main application authentication.
Redirects users to main app for single sign-on experience.
*/

import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Login = ({ onSuccess }) => {
  const { redirectToLogin, isAuthenticated, user } = useAuth();

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      onSuccess?.(user);
    }
  }, [isAuthenticated, user, onSuccess]);

  // Handle redirect to main app
  const handleLoginRedirect = () => {
    redirectToLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-3xl">🔄</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pipeline Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Integrated with Data Pilot Authentication
          </p>
        </div>

        {/* Authentication Required Card */}
        <div className="bg-white shadow-lg rounded-lg p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Authentication Required
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to your Data Pilot account to access the Pipeline Dashboard.
            </p>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <button
              onClick={handleLoginRedirect}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <span className="mr-2">🚀</span>
              Sign in with Data Pilot
            </button>
            
            <p className="text-xs text-center text-gray-500">
              You will be redirected to the main Data Pilot application for authentication
            </p>
          </div>

          {/* Features List */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              What you'll get access to:
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="mr-2">✅</span>
                Data processing pipeline management
              </li>
              <li className="flex items-center">
                <span className="mr-2">✅</span>
                Real-time progress tracking
              </li>
              <li className="flex items-center">
                <span className="mr-2">✅</span>
                AI-powered data analysis
              </li>
              <li className="flex items-center">
                <span className="mr-2">✅</span>
                Advanced visualization tools
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure single sign-on powered by Data Pilot
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;