import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-bg flex items-center justify-center">
        <div className="spinner-ring" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
