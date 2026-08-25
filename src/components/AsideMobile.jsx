import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import iconReceipt from '../assets/receipt.png';
import iconCalendar from '../assets/calendar.png';
import iconBaguette from '../assets/baguette.png';
import iconSetting from '../assets/setting.png';
import iconStore from '../assets/store.png';
import './AsideMobile.css';

export default function AsideMobile() {
  const shopSlug = useAuthStore((s) => s.user?.shopSlug || '');

  return (
    <nav className="aside-mobile">
      <NavLink className="nav-item" to="/shop" end title="訂單">
        <div className="icon">
          <img src={iconReceipt} alt="訂單" />
        </div>
        <span className="label">訂單</span>
      </NavLink>

      <NavLink className="nav-item" to="/shop/order" title="接單">
        <div className="icon">
          <img src={iconCalendar} alt="接單" />
        </div>
        <span className="label">接單</span>
      </NavLink>

      <NavLink className="nav-item" to="/shop/products" title="商品">
        <div className="icon">
          <img src={iconBaguette} alt="商品" />
        </div>
        <span className="label">商品</span>
      </NavLink>

      <NavLink className="nav-item" to="/shop/settings" title="設定">
        <div className="icon">
          <img src={iconSetting} alt="設定" />
        </div>
        <span className="label">設定</span>
      </NavLink>

      {shopSlug && (
        <a className="nav-item" href={`/s/${shopSlug}`} target="_blank" rel="noopener" title="前台">
          <div className="icon">
            <img src={iconStore} alt="前台" />
          </div>
          <span className="label">前台</span>
        </a>
      )}
    </nav>
  );
}
