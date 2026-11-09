import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { deleteAccount } from '../lib/api.js';

function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="badge-admin">admin</span>
  ) : (
    <span className="badge-user">user</span>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (!user) return null;

  const joined = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-ink-primary tracking-[-0.01em]">Profile</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Cross-application identity and session preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left column: Passport Credential Moment */}
        <div className="md:col-span-5 surface-card p-6">
          <div className="flex items-start gap-4">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name?.fullName || ''}
                className="w-14 h-14 rounded-xl ring-1 ring-[#eef0f5]/10 flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-ink-raised border border-[#eef0f5]/10 flex items-center justify-center text-xl font-medium text-ink-primary flex-shrink-0">
                {user.name?.firstName?.[0] || user.email?.[0]}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-medium text-ink-primary truncate">
                  {user.name?.fullName}
                </h2>
                <RoleBadge role={user.role} />
              </div>
              <p className="text-ink-secondary text-sm mt-1 truncate">{user.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="status-active">Active</span>
                <span className="text-ink-muted text-xs tabular-nums">Joined {joined}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#eef0f5]/[0.08] mt-5 pt-4">
            <p className="text-xs text-ink-muted mb-1">Credential ID</p>
            <p className="font-mono text-xs text-ink-secondary tabular-nums break-all">
              {user.uid}
            </p>
          </div>
        </div>

        {/* Right column: Account Details & Danger Zone */}
        <div className="md:col-span-7 space-y-4">
          {/* Account details & session control */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-ink-primary">Account</h2>
              <button onClick={logout} className="btn-secondary h-8 px-3 text-xs">
                Sign out
              </button>
            </div>

            <div className="divide-y divide-[#eef0f5]/[0.06]">
              <div className="h-10 flex items-center justify-between text-sm">
                <span className="text-ink-secondary">User ID</span>
                <span className="text-ink-primary font-mono text-xs tabular-nums">{user.uid}</span>
              </div>
              <div className="h-10 flex items-center justify-between text-sm">
                <span className="text-ink-secondary">Status</span>
                <span className="status-active">Active</span>
              </div>
              <div className="h-10 flex items-center justify-between text-sm">
                <span className="text-ink-secondary">Timezone</span>
                <span className="keycap-tag">{user.preferences?.timezone || 'UTC'}</span>
              </div>
              <div className="h-10 flex items-center justify-between text-sm">
                <span className="text-ink-secondary">Currency</span>
                <span className="keycap-tag">{user.preferences?.preferredCurrency || 'USD'}</span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="surface-card p-6">
            <h2 className="text-sm font-medium text-ink-primary mb-1">Danger zone</h2>
            <p className="text-xs text-ink-muted mb-4">
              Schedule your account for deletion with a 30-day recovery window
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger w-full"
              >
                Delete account
              </button>
            ) : (
              <div className="space-y-3 pt-2 border-t border-[#eef0f5]/[0.06]">
                <p className="text-sm text-ink-secondary">
                  Your account will be scheduled for deletion with a 30-day recovery window.
                  All active sessions will be invalidated immediately.
                </p>
                {deleteError && (
                  <p className="text-sm text-[#e5484d]" role="alert">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="btn-danger-solid flex-1"
                  >
                    {deleting ? 'Deleting…' : 'Confirm delete'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
