/*
Data Pipeline Dashboard - Protected Route Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Integrated with Data Pilot main application authentication.
Protects routes that require authentication.
*/

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">
            Checking Authentication...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Verifying your Data Pilot session
          </p>
        </div>
      </div>
    );
  }

  // Show login component if not authenticated
  if (!isAuthenticated || !user) {
    return <Login onSuccess={() => window.location.reload()} />;
  }

  // User is authenticated, render protected content
  return children;
};

export default ProtectedRoute;