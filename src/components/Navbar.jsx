import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="border-b border-[#eef0f5]/[0.08] bg-ink-bg sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="shell-brand">
          <div className="shell-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <span className="shell-brand-title">rajchandra.me</span>
          <span className="shell-brand-sep">/</span>
          <span className="shell-brand-sub">identity</span>
        </Link>

        {user && (
          <div className="flex items-center gap-1">
            <Link
              to="/profile"
              className={`h-8 px-3 rounded-lg text-sm font-medium inline-flex items-center transition-colors duration-150 ease-unslop ${
                isActive('/profile')
                  ? 'bg-ink-raised text-ink-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-ink-raised/60'
              }`}
            >
              Profile
            </Link>

            {user.role === 'admin' && (
              <Link
                to="/admin/users"
                className={`h-8 px-3 rounded-lg text-sm font-medium inline-flex items-center transition-colors duration-150 ease-unslop ${
                  isActive('/admin')
                    ? 'bg-ink-raised text-ink-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-ink-raised/60'
                }`}
              >
                Users
              </Link>
            )}

            <div className="relative ml-2">
              <button
                onClick={() => setOpen((v) => !v)}
                className="h-8 px-2 rounded-lg flex items-center gap-2 hover:bg-ink-raised transition-colors duration-150 ease-unslop"
                aria-label="Account menu"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name?.fullName || ''}
                    className="w-6 h-6 rounded-md ring-1 ring-[#eef0f5]/10"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-ink-raised border border-[#eef0f5]/10 flex items-center justify-center text-xs font-medium text-ink-primary">
                    {user.name?.firstName?.[0] || user.email?.[0]}
                  </div>
                )}
              </button>

              {open && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 surface-card p-1 z-50">
                    <div className="px-3 py-2 border-b border-[#eef0f5]/[0.08] mb-1">
                      <p className="text-sm font-medium text-ink-primary truncate">{user.name?.fullName}</p>
                      <p className="text-xs text-ink-muted truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setOpen(false); logout(); }}
                      className="w-full h-8 text-left px-3 rounded-lg text-sm text-[#e5484d] hover:bg-[#e5484d]/10 transition-colors duration-150 ease-unslop flex items-center"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
