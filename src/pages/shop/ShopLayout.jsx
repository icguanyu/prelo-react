import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Button } from 'antd';
import { useAuthStore } from '../../stores/authStore';

export default function ShopLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <nav style={{ display: 'flex', gap: 16 }}>
          <Link to="/shop">訂單</Link>
          <Link to="/shop/products">商品</Link>
          <Link to="/shop/order">排程</Link>
          <Link to="/shop/settings">設定</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{user?.name}</span>
          <Button onClick={handleLogout}>登出</Button>
        </div>
      </header>
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
