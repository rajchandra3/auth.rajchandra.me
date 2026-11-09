import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  adminListUsers,
  adminBlockUser,
  adminUnblockUser,
  adminUpdateRole,
  adminRevokeSessions,
  adminDeleteUser,
} from '../../lib/api.js';

const STATUS_TABS = ['all', 'active', 'blocked', 'deleted'];

function Avatar({ user }) {
  if (user.picture) {
    return <img src={user.picture} alt="" className="w-8 h-8 rounded-lg ring-1 ring-[#eef0f5]/10 flex-shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-ink-raised border border-[#eef0f5]/10 flex items-center justify-center text-xs font-medium text-ink-secondary flex-shrink-0">
      {user.name?.firstName?.[0] || user.email?.[0] || '?'}
    </div>
  );
}

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

function ActionMenu({ user, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const action = (type) => { setOpen(false); onAction(type, user); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-ink-raised text-ink-muted hover:text-ink-primary transition-colors duration-150 ease-unslop"
        aria-label="User actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 surface-card p-1 z-20">
          <Link
            to={`/admin/users/${user._id}`}
            className="h-8 flex items-center px-3 rounded-lg text-sm text-ink-secondary hover:text-ink-primary hover:bg-ink-raised transition-colors duration-150 ease-unslop"
            onClick={() => setOpen(false)}
          >
            View details
          </Link>

          {!user.isDeleted && (
            <>
              <button
                onClick={() => action(user.role === 'admin' ? 'demote' : 'promote')}
                className="w-full h-8 flex items-center text-left px-3 rounded-lg text-sm text-ink-secondary hover:text-ink-primary hover:bg-ink-raised transition-colors duration-150 ease-unslop"
              >
                {user.role === 'admin' ? 'Remove admin' : 'Make admin'}
              </button>

              <button
                onClick={() => action(user.isBlocked ? 'unblock' : 'block')}
                className="w-full h-8 flex items-center text-left px-3 rounded-lg text-sm text-ink-secondary hover:text-ink-primary hover:bg-ink-raised transition-colors duration-150 ease-unslop"
              >
                {user.isBlocked ? 'Unblock' : 'Block'}
              </button>

              <button
                onClick={() => action('revoke')}
                className="w-full h-8 flex items-center text-left px-3 rounded-lg text-sm text-ink-secondary hover:text-ink-primary hover:bg-ink-raised transition-colors duration-150 ease-unslop"
              >
                Revoke sessions
              </button>
            </>
          )}

          <div className="border-t border-[#eef0f5]/[0.08] mt-1 pt-1">
            <button
              onClick={() => action('delete')}
              className="w-full h-8 flex items-center text-left px-3 rounded-lg text-sm text-[#e5484d] hover:bg-[#e5484d]/10 transition-colors duration-150 ease-unslop"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmModal({ action, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const messages = {
    block: { title: 'Block user', desc: 'This revokes all active sessions', confirm: 'Block', danger: true, showReason: true },
    delete: { title: 'Delete user', desc: 'This is permanent and cannot be undone', confirm: 'Delete', danger: true },
    revoke: { title: 'Revoke sessions', desc: 'All active sessions will be invalidated', confirm: 'Revoke', danger: false },
    promote: { title: 'Grant admin', desc: 'User will receive full admin access', confirm: 'Grant admin', danger: false },
    demote: { title: 'Remove admin', desc: 'User will lose admin access', confirm: 'Remove admin', danger: true },
  };

  const cfg = messages[action?.type] || {};

  const handle = async () => {
    setLoading(true);
    await onConfirm(action, reason);
    setLoading(false);
  };

  if (!action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="surface-card p-6 w-full max-w-sm relative z-10">
        <h3 className="text-base font-medium text-ink-primary mb-1">{cfg.title}</h3>
        <p className="text-sm text-ink-secondary mb-4">{cfg.desc}</p>
        <p className="text-xs text-ink-muted mb-4">
          Target: <span className="font-mono text-ink-primary">{action.user?.email}</span>
        </p>

        {cfg.showReason && (
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-9 bg-ink-raised border border-[#eef0f5]/[0.08] rounded-lg px-3 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-[#eef0f5]/25 mb-4"
          />
        )}

        <div className="flex gap-2">
          <button
            onClick={handle}
            disabled={loading}
            className={`flex-1 ${cfg.danger ? 'btn-danger-solid' : 'btn-primary'}`}
          >
            {loading ? 'Processing…' : cfg.confirm}
          </button>
          <button onClick={onCancel} className="btn-ghost flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const searchTimer = useRef(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 25 };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;

      const { data } = await adminListUsers(params);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearchChange = (e) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(e.target.value);
      setPage(1);
    }, 300);
  };

  const handleAction = (type, user) => {
    setActionError(null);
    if (type === 'unblock') {
      executeAction({ type, user }, '');
    } else {
      setPendingAction({ type, user });
    }
  };

  const executeAction = async ({ type, user }, reason) => {
    setActionError(null);
    try {
      if (type === 'block') await adminBlockUser(user._id, reason);
      else if (type === 'unblock') await adminUnblockUser(user._id);
      else if (type === 'promote') await adminUpdateRole(user._id, 'admin');
      else if (type === 'demote') await adminUpdateRole(user._id, 'user');
      else if (type === 'revoke') await adminRevokeSessions(user._id);
      else if (type === 'delete') await adminDeleteUser(user._id);

      setPendingAction(null);
      fetchUsers();
    } catch (err) {
      setPendingAction(null);
      setActionError(err.response?.data?.message || 'Action failed');
    }
  };

  const fmt = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-ink-primary tracking-[-0.01em]">Users</h1>
          {pagination && (
            <p className="text-ink-muted text-sm mt-1 tabular-nums">{pagination.total} total</p>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[#e5484d]/10 border border-[#e5484d]/25 text-sm text-[#e5484d] flex items-center justify-between" role="alert">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs text-ink-secondary hover:text-ink-primary">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name or email"
            onChange={handleSearchChange}
            className="w-full h-10 bg-ink-card border border-[#eef0f5]/[0.08] rounded-xl pl-9 pr-4 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-[#eef0f5]/25 transition-colors duration-150 ease-unslop"
          />
        </div>

        <div className="flex gap-1 p-1 bg-ink-card border border-[#eef0f5]/[0.08] rounded-xl">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setStatus(tab); setPage(1); }}
              className={`h-8 px-3 rounded-lg text-sm capitalize transition-colors duration-150 ease-unslop ${
                status === tab
                  ? 'bg-ink-raised text-ink-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-ink-muted hover:text-ink-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-ink-muted text-sm">{error}</div>
        ) : loading ? (
          <div className="p-8 flex justify-center">
            <div className="spinner-ring" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-ink-muted text-sm">No users found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eef0f5]/[0.08]">
                <th className="text-left px-4 py-3 text-xs text-ink-muted font-medium">User</th>
                <th className="text-left px-4 py-3 text-xs text-ink-muted font-medium hidden sm:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs text-ink-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-ink-muted font-medium hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef0f5]/[0.06]">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-ink-raised/40 transition-colors duration-150 ease-unslop">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-primary truncate max-w-[200px]">
                          {user.name?.fullName || '—'}
                        </p>
                        <p className="text-xs text-ink-muted truncate max-w-[200px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge user={user} />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-ink-muted tabular-nums hidden md:table-cell">
                    {fmt(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionMenu user={user} onAction={handleAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#eef0f5]/[0.08]">
            <p className="text-xs font-mono text-ink-muted tabular-nums">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost h-8 px-3 text-xs disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-ghost h-8 px-3 text-xs disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        action={pendingAction}
        onConfirm={executeAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
