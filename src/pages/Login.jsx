import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getGoogleLoginUrl } from '../lib/api.js';
import {
  getRedirectTarget,
  getRedirectDomain,
  buildLoginUrl as formatLoginUrl,
  buildAgentBypassUrl as formatAgentBypassUrl,
  isAgentBypassActive,
  isAutoBypassActive,
} from '../lib/login-helpers.js';

function buildLoginUrl() {
  const base = getGoogleLoginUrl();
  return formatLoginUrl(window.location.search, base);
}

function buildAgentBypassUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.rajchandra.me';
  return formatAgentBypassUrl(window.location.search, apiUrl);
}

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const isAgentBypass = isAgentBypassActive(window.location.search);
  const isAutoBypass = isAutoBypassActive(window.location.search);
  const redirectDomain = getRedirectDomain(window.location.search);

  useEffect(() => {
    if (isAutoBypass) {
      window.location.href = buildAgentBypassUrl();
      return;
    }

    if (!loading && user) {
      navigate(user.role === 'admin' ? '/admin/users' : '/profile', { replace: true });
    }
  }, [user, loading, navigate, isAutoBypass]);

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
        </div>
        <div className="spinner-ring" />
      </div>
    );
  }

  return (
    <div className="login-root">
      {/* Ambient background lighting */}
      <div className="login-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="login-card-wrap">
        <div className="login-card">
          <div className="login-card-inner">
            {/* Identity mark */}
            <div className="auth-brand-mark">
              <div className="auth-icon-badge" aria-hidden="true">
                <svg className="auth-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-1.5 1.5L16 7m-1.5 1.5L13 10m-2.5 2.5a5.5 5.5 0 1 0-7.78 7.78 5.5 5.5 0 0 0 7.78-7.78z" />
                  <circle cx="7.5" cy="16.5" r="1.5" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Header: informs where user is coming from and where they will be redirected back */}
            <div className="login-header">
              <h1 className="login-title">
                {redirectDomain ? `Sign in to ${redirectDomain}` : 'Sign in'}
              </h1>
              <p className="login-subtitle">
                {redirectDomain
                  ? `You came from ${redirectDomain} and will be redirected back after signing in.`
                  : 'Log in with your Google account to continue.'}
              </p>
            </div>

            {/* Divider */}
            <div className="login-divider" />

            {/* Error banner */}
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

            {/* Login methods for login CTA only */}
            <div className="login-actions">
              <a href={buildLoginUrl()} className="google-btn" id="google-login-btn">
                <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="google-btn-text">Continue with Google</span>
              </a>

              {/* Test Agent button — only shown if agent_bypass is true in url query param */}
              {isAgentBypass && (
                <a href={buildAgentBypassUrl()} className="agent-btn" id="agent-login-btn">
                  <svg className="agent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                  </svg>
                  <span>Continue as Test Agent</span>
                </a>
              )}
            </div>

            {/* Inform that they will be sharing basic profile details with domain of the URL only (not full path) */}
            {redirectDomain && (
              <p className="login-disclosure" id="login-disclosure">
                By signing in, you will be sharing basic profile details with{' '}
                <span className="domain-emphasis">{redirectDomain}</span>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
