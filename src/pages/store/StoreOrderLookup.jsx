import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { App } from 'antd';
import { Shop } from '../../api/shop';
import StoreTopbar from '../../components/store/StoreTopbar';
import { getPaymentLabel, getPickupLabel, getOrderStatusLabel, getOrderStatusColor } from '../../utils/labels';
import './StoreOrderLookup.scss';

const STORAGE_KEY = 'prelo-lookup-phone';
const today = dayjs().startOf('day');
const fmt = (n) => `NT$ ${Number(n ?? 0).toLocaleString()}`;
const fmtDate = (d) => (d ? dayjs(d).format('YYYY/MM/DD') : '—');

function isPast(order) {
  return order.schedule_date && dayjs(order.schedule_date).isBefore(today);
}

export default function StoreOrderLookup() {
  const { slug } = useParams();
  const { message } = App.useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPhone(saved);
      setRememberMe(true);
    }
  }, []);

  const isExpanded = (order) => !isPast(order) || expandedIds.has(order.id ?? order.order_no);
  const toggleExpand = (order) => {
    const key = order.id ?? order.order_no;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const lookup = async () => {
    if (!phone.trim()) {
      message.warning('請輸入電話');
      return;
    }
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, phone.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    setIsLoading(true);
    setOrders(null);
    setExpandedIds(new Set());
    try {
      const res = await Shop.GetOrdersByPhone(slug, phone.trim());
      setOrders(res.data?.data ?? []);
    } catch {
      message.error('查詢失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lookup-page">
      <StoreTopbar title="查詢訂單" />

      <div className="lookup-body">
        <section className="card">
          <div className="card__title">
            <i className="bx bx-search"></i> 輸入訂購電話
          </div>
          <div className="form-row">
            <label className="form-label">手機號碼</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              type="tel"
              placeholder="訂購時填寫的手機號碼"
              onKeyUp={(e) => e.key === 'Enter' && lookup()}
            />
          </div>
          <label className="remember-me">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span className="remember-me__check"></span>
            <span className="remember-me__label">記住我的電話號碼</span>
          </label>
          <button className="query-btn" disabled={isLoading} onClick={lookup}>
            {isLoading ? <span>查詢中...</span> : (
              <span>
                <i className="bx bx-search-alt"></i> 查詢
              </span>
            )}
          </button>
        </section>

        {orders !== null && orders.length === 0 && (
          <div className="empty-result">
            <i className="bx bx-receipt"></i>
            <p>此電話尚無訂單記錄</p>
          </div>
        )}

        {orders?.length > 0 &&
          orders.map((order) => {
            const past = isPast(order);
            const expanded = isExpanded(order);
            return (
              <section
                key={order.id ?? order.order_no}
                className={`card card--result${past ? ' card--past' : ''}`}
              >
                <div
                  className={`order-header${past ? ' order-header--clickable' : ''}`}
                  onClick={() => past && toggleExpand(order)}
                >
                  <div className="order-header-left">
                    <div className="order-date">{fmtDate(order.schedule_date)}</div>
                    <div className="order-no">{order.order_no}</div>
                    {order.is_venue && (
                      <span className="venue-chip">
                        <i className="bx bxs-truck"></i> 巡迴
                      </span>
                    )}
                  </div>
                  <div className="order-header-right">
                    <span
                      className="status-badge"
                      style={{ background: getOrderStatusColor(order.status) + '20', color: getOrderStatusColor(order.status) }}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                    {past && (
                      <i className={`bx order-chevron ${expanded ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                    )}
                  </div>
                </div>

                {expanded && (
                  <>
                    <div className="divider" />

                    {order.is_venue && (
                      <a
                        className="venue-banner"
                        href={`https://maps.google.com/?q=${encodeURIComponent(order.venue_address || order.venue_name)}`}
                        target="_blank"
                        rel="noopener"
                      >
                        <div className="venue-banner__icon-wrap">
                          <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32" alt="Google Maps" />
                        </div>
                        <div className="venue-banner__body">
                          <span className="venue-banner__name">
                            {order.venue_name}
                            {order.venue_start && order.venue_end && (
                              <span className="venue-banner__time">
                                {order.venue_start}–{order.venue_end}
                              </span>
                            )}
                          </span>
                          {order.venue_address && <span className="venue-banner__address">{order.venue_address}</span>}
                        </div>
                        <i className="bx bx-chevron-right venue-banner__arrow"></i>
                      </a>
                    )}

                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">取貨時間</span>
                        <span className="info-val">{order.pickup_time ?? '—'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">取貨方式</span>
                        <span className="info-val">{getPickupLabel(order.pickup_method)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">付款方式</span>
                        <span className="info-val">{getPaymentLabel(order.payment_method)}</span>
                      </div>
                      {order.customer_address && (
                        <div className="info-item info-item--full">
                          <span className="info-label">收貨地址</span>
                          <span className="info-val">{order.customer_address}</span>
                        </div>
                      )}
                      {order.note && (
                        <div className="info-item info-item--full">
                          <span className="info-label">備註</span>
                          <span className="info-val">{order.note}</span>
                        </div>
                      )}
                    </div>

                    <div className="items-title">訂購品項</div>
                    <div className="item-list">
                      {order.items.map((item) => (
                        <div key={item.id} className="item-row">
                          <div className="item-name">
                            {item.product_name}
                            {item.is_sliced && <span className="slice-tag">切片</span>}
                          </div>
                          <div className="item-right">
                            <span className="item-qty">x{item.quantity}</span>
                            <span className="item-price">{fmt(item.unit_price * item.quantity)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="divider" />

                    <div className="total-row">
                      <span className="total-label">合計</span>
                      <span className="total-amount">{fmt(order.total_amount)}</span>
                    </div>
                  </>
                )}
              </section>
            );
          })}
      </div>
    </div>
  );
}
