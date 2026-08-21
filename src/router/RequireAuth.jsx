import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { App } from 'antd';
import { useAuthStore } from '../stores/authStore';

// 對應 Vue 版 router.beforeEach 的 meta.requireAuth 守衛
export default function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  const { message } = App.useApp();

  useEffect(() => {
    if (!token) message.error('請重新登入');
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
