import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getGoogleLoginUrl } from '../lib/api.js';

// Forward ?returnTo from the current URL to the API's OAuth start endpoint
function buildLoginUrl() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');
  const base = getGoogleLoginUrl();
  return returnTo ? `${base}?returnTo=${encodeURIComponent(returnTo)}` : base;
}

function buildAgentBypassUrl() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.rajchandra.me';
  const url = new URL(`${apiUrl}/identity/auth/agent-bypass`);
  if (returnTo) {
    url.searchParams.set('returnTo', returnTo);
  }
  return url.toString();
}

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isAgentBypass = params.get('agent_bypass') === 'true';
    const returnTo = params.get('returnTo');
    const email = params.get('email');

    if (isAgentBypass) {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.rajchandra.me';
      const bypassUrl = new URL(`${apiUrl}/identity/auth/agent-bypass`);
      if (returnTo) {
        bypassUrl.searchParams.set('returnTo', returnTo);
      }
      if (email) {
        bypassUrl.searchParams.set('email', email);
      }
      window.location.href = bypassUrl.toString();
      return;
    }

    if (!loading && user) {
      navigate(user.role === 'admin' ? '/admin/users' : '/profile', { replace: true });
    }
  }, [user, loading, navigate]);

  const params = new URLSearchParams(window.location.search);
  const errorCode = params.get('error');

  const errorMessages = {
    google: 'Google sign-in failed. Please try again.',
    state: 'Session validation failed. Please try again.',
    inactive: 'Your account is inactive. Contact support.',
    blocked: 'Your account has been blocked. Contact support.',
    server: 'Server error during sign-in. Please try again.',
    unauthorized_email: 'Unauthorized test user email.',
  };

  if (loading) {
    return (
      <div className="login-root">
        <div className="login-bg">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="spinner-ring" />
      </div>
    );
  }

  return (
    <div className="login-root">
      {/* Animated background orbs */}
      <div className="login-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />
      </div>

      <div className="login-card-wrap">
        {/* Passport seal */}
        <div className="seal-wrap">
          <div className="seal">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="seal-svg">
              <defs>
                <linearGradient id="sealGrad" x1="10" y1="4" x2="54" y2="60" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              {/* Hexagonal border */}
              <path
                d="M32 4 L54 17 L54 47 L32 60 L10 47 L10 17 Z"
                stroke="url(#sealGrad)"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
              />
              {/* Inner hex ring */}
              <path
                d="M32 10 L50 20.5 L50 43.5 L32 54 L14 43.5 L14 20.5 Z"
                stroke="url(#sealGrad)"
                strokeWidth="0.75"
                strokeOpacity="0.3"
                fill="none"
                strokeLinejoin="round"
              />
              {/* Abstract key icon */}
              <circle cx="27" cy="26" r="7" stroke="url(#sealGrad)" strokeWidth="2" fill="none" />
              <line x1="32" y1="30" x2="44" y2="42" stroke="url(#sealGrad)" strokeWidth="2" strokeLinecap="round" />
              <line x1="40" y1="38" x2="40" y2="44" stroke="url(#sealGrad)" strokeWidth="2" strokeLinecap="round" />
              <line x1="44" y1="38" x2="44" y2="42" stroke="url(#sealGrad)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="seal-glow" />
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-inner">
            {/* Header */}
            <div className="login-header">
              <h1 className="login-title">Welcome back</h1>
              <div className="login-domain">
                <span className="domain-dot" />
                rajchandra.me
              </div>
            </div>

            {/* Divider */}
            <div className="login-divider" />

            {/* Error */}
            {errorCode && (
              <div className="login-error" role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errorMessages[errorCode] || 'Sign-in failed. Please try again.'}
              </div>
            )}

            {/* Google button */}
            <a href={buildLoginUrl()} className="google-btn" id="google-login-btn">
              <span className="google-btn-bg" />
              <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="google-btn-text">Continue with Google</span>
            </a>

            {/* Test Agent button */}
            <a href={buildAgentBypassUrl()} className="agent-btn" id="agent-login-btn">
              <svg className="agent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8" y2="16" />
                <line x1="16" y1="16" x2="16" y2="16" />
              </svg>
              <span>Continue as Test Agent</span>
            </a>

            {/* Footer text */}
            <p className="login-footer">
              Your unified identity for all connected services
            </p>
          </div>
        </div>

        {/* Bottom badge */}
        <div className="login-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Protected by Identity Platform v2
        </div>
      </div>
    </div>
  );
}
