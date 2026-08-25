import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Badge } from 'antd';
import dayjs from 'dayjs';
import { Schedules } from '../api/schedules';
import { useAuthStore } from '../stores/authStore';
import logoCircle from '../assets/logo-circle.png';
import iconReceipt from '../assets/receipt.png';
import iconCalendar from '../assets/calendar.png';
import iconBaguette from '../assets/baguette.png';
import iconSetting from '../assets/setting.png';
import iconStore from '../assets/store.png';
import iconExpandLeft from '../assets/expand_left.svg';
import './Aside.scss';

export default function Aside({ isCollapsed, onToggle }) {
  const shopSlug = useAuthStore((s) => s.user?.shopSlug || '');
  const [todayOrderCount, setTodayOrderCount] = useState(0);

  useEffect(() => {
    const loadTodayOrderCount = async () => {
      const today = dayjs().format('YYYY-MM-DD');
      try {
        const res = await Schedules.GetByDate(today);
        if (!res?.data) {
          setTodayOrderCount(0);
          return;
        }
        const count =
          res.data.order_count ?? (Array.isArray(res.data.orders) ? res.data.orders.length : 0);
        setTodayOrderCount(Number.isFinite(count) ? count : 0);
      } catch (error) {
        console.error('load today order count error', error);
        setTodayOrderCount(0);
      }
    };
    loadTodayOrderCount();
  }, []);

  return (
    <aside className={`shop-aside${isCollapsed ? ' is-collapsed' : ''}`} aria-hidden={isCollapsed}>
      <div className="aside-logo">
        <img src={logoCircle} alt="" />
      </div>
      <NavLink className="link" to="/shop" end>
        <Badge count={todayOrderCount} overflowCount={99} offset={[-10, 4]}>
          <div className="icon">
            <img src={iconReceipt} alt="" />
          </div>
        </Badge>
        <div className="title">訂單</div>
      </NavLink>
      <NavLink className="link" to="/shop/order">
        <div className="icon">
          <img src={iconCalendar} alt="" />
        </div>
        <div className="title">接單</div>
      </NavLink>
      <NavLink className="link" to="/shop/products">
        <div className="icon">
          <img src={iconBaguette} alt="" />
        </div>
        <div className="title">商品</div>
      </NavLink>
      <NavLink className="link" to="/shop/settings">
        <div className="icon">
          <img src={iconSetting} alt="" />
        </div>
        <div className="title">設定</div>
      </NavLink>
      {shopSlug && (
        <a
          className="link store-front-link"
          href={`/s/${shopSlug}`}
          target="_blank"
          rel="noopener"
          title="前往前台"
        >
          <div className="icon">
            <img src={iconStore} alt="" />
          </div>
          <div className="title">前台</div>
        </a>
      )}
      <div className="aside-toggle" aria-label="Toggle aside menu" onClick={onToggle}>
        <div className="icon">
          <img src={iconExpandLeft} alt="" />
        </div>
      </div>
    </aside>
  );
}
