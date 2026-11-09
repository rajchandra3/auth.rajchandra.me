import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Callback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    getMe()
      .then(({ data }) => {
        const user = data.data.user;
        setUser(user);
        navigate(user.role === 'admin' ? '/admin/users' : '/profile', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=server', { replace: true });
      });
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-ink-bg flex flex-col items-center justify-center gap-3">
      <div className="spinner-ring" />
      <p className="text-ink-muted text-sm">Signing you in</p>
    </div>
  );
}
