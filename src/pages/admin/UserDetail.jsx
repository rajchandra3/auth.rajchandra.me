import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  adminGetUser,
  adminUpdateRole,
  adminBlockUser,
  adminUnblockUser,
  adminRevokeSessions,
  adminDeleteUser,
} from '../../lib/api.js';

function RoleBadge({ role }) {
  return role === 'admin'
    ? <span className="badge-admin">admin</span>
    : <span className="badge-user">user</span>;
}

function StatusBadge({ user }) {
  if (user.isDeleted) return <span className="status-deleted">Deleted</span>;
  if (user.isBlocked) return <span className="status-blocked">Blocked</span>;
  return <span className="status-active">Active</span>;
}

function Field({ label, value }) {
  return (
    <div className="min-h-[36px] flex justify-between items-center gap-4 py-2 border-b border-[#eef0f5]/[0.06] last:border-0">
      <span className="text-sm text-ink-secondary flex-shrink-0">{label}</span>
      <span className="text-sm text-ink-primary text-right tabular-nums">
        {value || <span className="text-ink-muted">—</span>}
      </span>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetUser(id);
      setData(res.data.data);
    } catch {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const act = async (type, fn) => {
    setActionLoading(type);
    setActionError(null);
    try {
      await fn();
      if (type === 'delete') {
        navigate('/admin/users');
      } else {
        await load();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner-ring" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-center py-20 text-ink-muted text-sm">{error || 'Not found'}</div>;
  }

  const { user, sessions } = data;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary text-sm mb-6 transition-colors duration-150 ease-unslop"
      >
        <svg className="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to users
      </Link>

      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[#e5484d]/10 border border-[#e5484d]/25 text-sm text-[#e5484d] flex items-center justify-between" role="alert">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs text-ink-secondary hover:text-ink-primary">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left column: Identity Passport Card */}
        <div className="md:col-span-5 surface-card p-6">
          <div className="flex items-start gap-4 mb-5">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-14 h-14 rounded-xl ring-1 ring-[#eef0f5]/10 flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-ink-raised border border-[#eef0f5]/10 flex items-center justify-center text-xl font-medium text-ink-primary flex-shrink-0">
                {user.name?.firstName?.[0] || user.email?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-medium text-ink-primary truncate">{user.name?.fullName}</h1>
                <RoleBadge role={user.role} />
              </div>
              <p className="text-ink-secondary text-sm mt-1 truncate">{user.email}</p>
              <div className="mt-2">
                <StatusBadge user={user} />
              </div>
            </div>
          </div>

          <div className="border-t border-[#eef0f5]/[0.08] pt-2">
            <Field label="User ID" value={<span className="font-mono text-xs text-ink-secondary tabular-nums">{user.uid}</span>} />
            <Field label="Record ID" value={<span className="font-mono text-xs text-ink-muted tabular-nums">{user._id}</span>} />
            <Field label="Joined" value={<span className="font-mono text-xs text-ink-secondary tabular-nums">{fmt(user.createdAt)}</span>} />
            <Field label="Updated" value={<span className="font-mono text-xs text-ink-secondary tabular-nums">{fmt(user.updatedAt)}</span>} />
            <Field label="Timezone" value={user.preferences?.timezone ? <span className="keycap-tag">{user.preferences.timezone}</span> : null} />
            <Field label="Currency" value={user.preferences?.preferredCurrency ? <span className="keycap-tag">{user.preferences.preferredCurrency}</span> : null} />

            {user.isBlocked && (
              <>
                <Field label="Blocked at" value={<span className="font-mono text-xs text-[#e5484d] tabular-nums">{fmt(user.blockedAt)}</span>} />
                <Field label="Block reason" value={user.blockedReason} />
              </>
            )}
            {user.isDeleted && (
              <>
                <Field label="Deleted at" value={<span className="font-mono text-xs text-ink-muted tabular-nums">{fmt(user.deletedAt)}</span>} />
                <Field label="Grace period ends" value={<span className="font-mono text-xs text-ink-muted tabular-nums">{fmt(user.deletionGracePeriodEnds)}</span>} />
              </>
            )}
          </div>
        </div>

        {/* Right column: Sessions, Admin Actions, Danger Zone */}
        <div className="md:col-span-7 space-y-4">
          {/* Active sessions */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-ink-primary">Active sessions</h2>
                <span className="keycap-tag">{sessions.length}</span>
              </div>
              {sessions.length > 0 && (
                <button
                  onClick={() => act('revoke', () => adminRevokeSessions(user._id))}
                  disabled={actionLoading === 'revoke'}
                  className="btn-secondary h-8 px-3 text-xs"
                >
                  {actionLoading === 'revoke' ? 'Revoking…' : 'Revoke all'}
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-ink-muted">No active sessions</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="bg-ink-raised/60 rounded-lg p-3 border border-[#eef0f5]/[0.06]">
                    <p className="text-xs text-ink-primary truncate">{s.userAgent || 'Unknown device'}</p>
                    <p className="text-xs font-mono text-ink-secondary tabular-nums mt-1">
                      IP {s.ipAddress || '—'} · Last used {fmt(s.lastUsedAt)}
                    </p>
                    <p className="text-xs font-mono text-ink-muted tabular-nums mt-0.5">
                      Expires {fmt(s.expiresAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin actions */}
          {!user.isDeleted && (
            <div className="surface-card p-6">
              <h2 className="text-sm font-medium text-ink-primary mb-3">Actions</h2>

              {/* Role toggle */}
              <div className="flex items-center justify-between py-3 border-b border-[#eef0f5]/[0.06]">
                <div>
                  <p className="text-sm font-medium text-ink-primary">Role</p>
                  <p className="text-xs text-ink-muted">
                    {user.role === 'admin' ? 'Remove admin privileges' : 'Grant admin privileges'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    act('role', () =>
                      adminUpdateRole(user._id, user.role === 'admin' ? 'user' : 'admin'),
                    )
                  }
                  disabled={actionLoading === 'role'}
                  className={user.role === 'admin' ? 'btn-danger' : 'btn-secondary'}
                >
                  {actionLoading === 'role'
                    ? 'Processing…'
                    : user.role === 'admin'
                      ? 'Remove admin'
                      : 'Grant admin'}
                </button>
              </div>

              {/* Block/unblock */}
              <div className="pt-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink-primary">
                      {user.isBlocked ? 'Unblock' : 'Block'} user
                    </p>
                    <p className="text-xs text-ink-muted">
                      {user.isBlocked ? 'Restore account access' : 'Revoke access and invalidate sessions'}
                    </p>
                  </div>
                  {user.isBlocked && (
                    <button
                      onClick={() => act('block', () => adminUnblockUser(user._id))}
                      disabled={actionLoading === 'block'}
                      className="btn-secondary"
                    >
                      {actionLoading === 'block' ? 'Processing…' : 'Unblock'}
                    </button>
                  )}
                </div>

                {!user.isBlocked && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Block reason (optional)"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="flex-1 h-9 bg-ink-raised border border-[#eef0f5]/[0.08] rounded-lg px-3 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-[#eef0f5]/25"
                    />
                    <button
                      onClick={() => act('block', () => adminBlockUser(user._id, blockReason))}
                      disabled={actionLoading === 'block'}
                      className="btn-danger flex-shrink-0"
                    >
                      {actionLoading === 'block' ? 'Processing…' : 'Block'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div className="surface-card p-6">
            <h2 className="text-sm font-medium text-ink-primary mb-1">Danger zone</h2>
            <p className="text-xs text-ink-muted mb-4">
              Permanently remove this user record with no recovery window
            </p>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn-danger w-full"
              >
                Permanently delete user
              </button>
            ) : (
              <div className="space-y-3 pt-2 border-t border-[#eef0f5]/[0.06]">
                <p className="text-sm text-ink-secondary">
                  This will hard-delete <span className="text-ink-primary font-mono text-xs">{user.email}</span>.
                  No grace period. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => act('delete', () => adminDeleteUser(user._id))}
                    disabled={actionLoading === 'delete'}
                    className="btn-danger-solid flex-1"
                  >
                    {actionLoading === 'delete' ? 'Processing…' : 'Confirm delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
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
