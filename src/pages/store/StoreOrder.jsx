import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { App } from 'antd';
import { Shop } from '../../api/shop';
import StoreTopbar from '../../components/store/StoreTopbar';
import { getPaymentLabel, getPickupLabel } from '../../utils/labels';
import './StoreOrder.scss';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const fmt = (n) => `NT$ ${Number(n).toLocaleString()}`;

export default function StoreOrder() {
  const navigate = useNavigate();
  const { slug, date } = useParams();
  const { message } = App.useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shop, setShop] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [cart, setCart] = useState({});
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    pickup_time: '',
    payment_method: '',
    pickup_method: 'PICKUP',
    bring_own_bag: false,
    note: '',
  });

  const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [shopRes, scheduleRes] = await Promise.all([Shop.GetInfo(slug), Shop.GetScheduleByDate(slug, date)]);
        setShop(shopRes.data);
        setSchedule(scheduleRes.data);
        patchForm({
          payment_method: shopRes.data?.paymentMethods?.length ? shopRes.data.paymentMethods[0] : '',
          pickup_method: shopRes.data?.pickupMethods?.length ? shopRes.data.pickupMethods[0].toUpperCase() : 'PICKUP',
        });
        const nextCart = {};
        scheduleRes.data?.items?.forEach((item) => {
          nextCart[item.id] = { quantity: 0, is_sliced: false };
        });
        setCart(nextCart);
      } catch (err) {
        if (err?.response?.status === 404) setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, date]);

  const cartItems = useMemo(() => {
    return (schedule?.items ?? [])
      .filter((item) => (cart[item.id]?.quantity ?? 0) > 0)
      .map((item) => ({
        schedule_item_id: item.id,
        quantity: cart[item.id].quantity,
        is_sliced: cart[item.id].is_sliced,
        unit_price: item.unit_price,
        slice_price: item.slice_price,
        name: item.product_name,
      }));
  }, [schedule, cart]);

  const totalAmount = useMemo(
    () =>
      cartItems.reduce((sum, i) => {
        const price = i.is_sliced && i.slice_price ? i.slice_price : i.unit_price;
        return sum + price * i.quantity;
      }, 0),
    [cartItems],
  );

  const isDelivery = form.pickup_method === 'DELIVERY';
  const hasMultiPickup = (shop?.pickupMethods?.length ?? 0) > 1;

  const increment = (itemId, remaining, salesLimit) => {
    if (salesLimit != null && remaining != null && remaining <= 0) return;
    const cur = cart[itemId]?.quantity ?? 0;
    if (remaining > 0 && cur >= remaining) return;
    setCart((c) => ({ ...c, [itemId]: { ...c[itemId], quantity: cur + 1 } }));
  };

  const decrement = (itemId) => {
    const cur = cart[itemId]?.quantity ?? 0;
    if (cur > 0) setCart((c) => ({ ...c, [itemId]: { ...c[itemId], quantity: cur - 1 } }));
  };

  const setItemSliced = (itemId, is_sliced) => {
    setCart((c) => ({ ...c, [itemId]: { ...c[itemId], is_sliced } }));
  };

  const pickupTimeOptions = useMemo(() => {
    let startStr, endStr;
    if (schedule?.is_venue && schedule.venue_start && schedule.venue_end) {
      startStr = schedule.venue_start;
      endStr = schedule.venue_end;
    } else {
      const dow = dayjs(date).day();
      const hours = shop?.businessHours?.find((h) => h.day === dow && h.enabled);
      if (!hours) return [];
      [startStr, endStr] = hours.time;
    }

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    const slots = [];
    for (let t = startTotal; t <= endTotal; t += 30) {
      const h = String(Math.floor(t / 60)).padStart(2, '0');
      const m = String(t % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    return slots;
  }, [schedule, shop, date]);

  const submitOrder = async () => {
    if (cartItems.length === 0) {
      message.warning('請至少選擇一項商品');
      return;
    }
    if (!form.customer_name.trim()) {
      message.warning('請填寫姓名');
      return;
    }
    if (!form.customer_phone.trim()) {
      message.warning('請填寫電話');
      return;
    }
    if (!form.pickup_time) {
      message.warning('請選擇取貨時間');
      return;
    }
    if (!form.payment_method) {
      message.warning('請選擇付款方式');
      return;
    }
    if (isDelivery && !form.customer_address.trim()) {
      message.warning('宅配需填寫地址');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await Shop.CreateOrder(slug, {
        schedule_id: schedule.id,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        pickup_time: form.pickup_time,
        payment_method: form.payment_method,
        pickup_method: form.pickup_method,
        bring_own_bag: form.bring_own_bag,
        note: form.note.trim() || null,
        customer_address: isDelivery ? form.customer_address.trim() : null,
        items: cartItems.map((i) => ({
          schedule_item_id: i.schedule_item_id,
          quantity: i.quantity,
          is_sliced: i.is_sliced,
        })),
      });
      setSuccessOrder(res.data);
    } catch (err) {
      if (err?.response?.status === 409) {
        message.error('部分商品已售完，請重新確認數量');
      } else {
        message.error('下單失敗，請稍後再試');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateLabel = date ? dayjs(date).format(`M月D日（週${WEEKDAY_LABELS[dayjs(date).day()]}）`) : '';

  return (
    <div className="order-page">
      <StoreTopbar title={dateLabel} subtitle={shop?.shopName ?? ''} />

      {isLoading ? (
        <div className="state-loading">
          <div className="skeleton-wrap">
            <div className="skeleton-block" style={{ width: '100%', height: 120, borderRadius: 8 }} />
            <div className="skeleton-block" style={{ width: '100%', height: 200, borderRadius: 8 }} />
            <div className="skeleton-block" style={{ width: '100%', height: 160, borderRadius: 8 }} />
          </div>
        </div>
      ) : notFound ? (
        <div className="state-empty">
          <i className="bx bx-calendar-x"></i>
          <p>找不到此行程</p>
        </div>
      ) : successOrder ? (
        <div className="success-screen">
          <div className="success-icon">
            <i className="bx bx-check-circle"></i>
          </div>
          <h2>下單成功！</h2>
          <p className="success-sub">訂單編號已發送，請保存以下資訊</p>
          <div className="success-card">
            <div className="success-row">
              <span className="success-label">訂單編號</span>
              <span className="success-val order-no-suffix">{successOrder.order_no}</span>
            </div>
            <div className="success-row">
              <span className="success-label">取貨日期</span>
              <span className="success-val">{dateLabel}</span>
            </div>
            <div className="success-row">
              <span className="success-label">取貨時間</span>
              <span className="success-val">{successOrder.pickup_time ?? form.pickup_time}</span>
            </div>
            <div className="success-row">
              <span className="success-label">訂單金額</span>
              <span className="success-val success-val--price">{fmt(successOrder.total_amount ?? totalAmount)}</span>
            </div>
          </div>

          {successOrder.items?.length > 0 && (
            <div className="success-items">
              <div className="success-items__title">訂購品項</div>
              {successOrder.items.map((item) => (
                <div key={item.product_name} className="success-item-row">
                  <div className="success-item-name">
                    {item.product_name}
                    {item.is_sliced && <span className="slice-tag">切片</span>}
                  </div>
                  <div className="success-item-right">
                    <span className="success-item-qty">x{item.quantity}</span>
                    <span className="success-item-price">{fmt(item.line_total ?? item.unit_price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {schedule?.is_venue && (
            <a
              className="venue-banner venue-banner--success"
              href={`https://maps.google.com/?q=${encodeURIComponent(schedule.venue_address || schedule.venue_name)}`}
              target="_blank"
              rel="noopener"
            >
              <div className="venue-banner__icon-wrap">
                <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32" alt="Google Maps" />
              </div>
              <div className="venue-banner__body">
                <span className="venue-banner__name">
                  {schedule.venue_name}
                  {schedule.venue_start && schedule.venue_end && (
                    <span className="venue-banner__time">
                      {schedule.venue_start}–{schedule.venue_end}
                    </span>
                  )}
                </span>
                {schedule.venue_address && <span className="venue-banner__address">{schedule.venue_address}</span>}
              </div>
              <i className="bx bx-chevron-right venue-banner__arrow"></i>
            </a>
          )}

          <p className="success-hint">{schedule?.is_venue ? '請前往指定地點，憑訂單編號取貨' : '請憑訂單編號到店取貨，或來電確認'}</p>
          <button className="cta-btn" onClick={() => navigate(`/s/${slug}/schedules`)}>
            回到行程頁
          </button>
        </div>
      ) : schedule ? (
        <>
          <div className="order-body">
            {schedule.is_venue && (
              <a
                className="venue-banner"
                href={`https://maps.google.com/?q=${encodeURIComponent(schedule.venue_address || schedule.venue_name)}`}
                target="_blank"
                rel="noopener"
              >
                <div className="venue-banner__icon-wrap">
                  <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32" alt="Google Maps" />
                </div>
                <div className="venue-banner__body">
                  <span className="venue-banner__name">
                    {schedule.venue_name}
                    {schedule.venue_start && schedule.venue_end && (
                      <span className="venue-banner__time">
                        {schedule.venue_start}–{schedule.venue_end}
                      </span>
                    )}
                  </span>
                  {schedule.venue_address && <span className="venue-banner__address">{schedule.venue_address}</span>}
                </div>
                <i className="bx bx-chevron-right venue-banner__arrow"></i>
              </a>
            )}

            <section className="card">
              <div className="card__title">
                <i className="bx bx-basket"></i> 選擇商品
              </div>
              {!schedule.items?.length ? (
                <div className="empty-hint">此行程尚無品項</div>
              ) : (
                <div className="item-list">
                  {schedule.items.map((item) => {
                    const sold = item.sales_limit != null && item.remaining != null && item.remaining <= 0;
                    const qty = cart[item.id]?.quantity ?? 0;
                    return (
                      <div key={item.id} className={`item-row${sold ? ' item-row--sold' : ''}`}>
                        <div className="item-img">
                          {item.image_url ? <img src={item.image_url} alt={item.product_name} /> : <i className="bx bx-baguette"></i>}
                        </div>
                        <div className="item-info">
                          <div className="item-name">{item.product_name}</div>
                          <div className="item-price">
                            {fmt(item.unit_price)}
                            {item.is_sliceable && item.slice_price && (
                              <span className="item-slice-price">切片 {fmt(item.slice_price)}</span>
                            )}
                          </div>
                          {sold ? (
                            <div className="item-remaining item-remaining--sold">售完</div>
                          ) : item.remaining > 0 ? (
                            <div className="item-remaining">剩餘 {item.remaining} 份</div>
                          ) : null}
                          {qty > 0 && item.is_sliceable && (
                            <label className="slice-toggle">
                              <input
                                type="checkbox"
                                checked={cart[item.id]?.is_sliced || false}
                                onChange={(e) => setItemSliced(item.id, e.target.checked)}
                              />
                              <span className="slice-check"></span>
                              <span className="slice-label">需要切片</span>
                            </label>
                          )}
                        </div>
                        <div className="item-qty">
                          <button className="qty-btn" disabled={qty === 0} onClick={() => decrement(item.id)}>
                            <i className="bx bx-minus"></i>
                          </button>
                          <span className="qty-num">{qty}</span>
                          <button
                            className="qty-btn qty-btn--add"
                            disabled={sold || (item.remaining > 0 && qty >= item.remaining)}
                            onClick={() => increment(item.id, item.remaining, item.sales_limit)}
                          >
                            <i className="bx bx-plus"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="card">
              <div className="card__title">
                <i className="bx bx-package"></i> 取貨資訊
              </div>

              {hasMultiPickup && (
                <div className="form-row">
                  <label className="form-label">取貨方式</label>
                  <div className="toggle-group">
                    {shop.pickupMethods.map((m) => (
                      <button
                        key={m}
                        className={`toggle-btn${form.pickup_method === m.toUpperCase() ? ' toggle-btn--active' : ''}`}
                        onClick={() => patchForm({ pickup_method: m.toUpperCase() })}
                      >
                        {getPickupLabel(m)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-row">
                <label className="form-label">取貨時間</label>
                <select
                  value={form.pickup_time}
                  onChange={(e) => patchForm({ pickup_time: e.target.value })}
                  className="form-select"
                  disabled={pickupTimeOptions.length === 0}
                >
                  <option value="" disabled>
                    {pickupTimeOptions.length ? '請選擇時間' : '當日無營業時間'}
                  </option>
                  {pickupTimeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label">付款方式</label>
                <div className="toggle-group">
                  {shop.paymentMethods?.map((m) => (
                    <button
                      key={m}
                      className={`toggle-btn${form.payment_method === m ? ' toggle-btn--active' : ''}`}
                      onClick={() => patchForm({ payment_method: m })}
                    >
                      {getPaymentLabel(m)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row form-row--inline">
                <label className="form-label">自備袋子</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={form.bring_own_bag}
                    onChange={(e) => patchForm({ bring_own_bag: e.target.checked })}
                  />
                  <span className="switch-track"></span>
                </label>
              </div>
            </section>

            <section className="card">
              <div className="card__title">
                <i className="bx bx-user"></i> 聯絡資訊
              </div>

              <div className="form-row">
                <label className="form-label">
                  姓名 <span className="required">*</span>
                </label>
                <input
                  value={form.customer_name}
                  onChange={(e) => patchForm({ customer_name: e.target.value })}
                  className="form-input"
                  placeholder="請輸入姓名"
                />
              </div>
              <div className="form-row">
                <label className="form-label">
                  電話 <span className="required">*</span>
                </label>
                <input
                  value={form.customer_phone}
                  onChange={(e) => patchForm({ customer_phone: e.target.value })}
                  className="form-input"
                  type="tel"
                  placeholder="請輸入手機號碼"
                />
              </div>
              {isDelivery && (
                <div className="form-row">
                  <label className="form-label">
                    地址 <span className="required">*</span>
                  </label>
                  <input
                    value={form.customer_address}
                    onChange={(e) => patchForm({ customer_address: e.target.value })}
                    className="form-input"
                    placeholder="請輸入收貨地址"
                  />
                </div>
              )}
              <div className="form-row">
                <label className="form-label">備註</label>
                <textarea
                  value={form.note}
                  onChange={(e) => patchForm({ note: e.target.value })}
                  className="form-textarea"
                  placeholder="特殊需求或備註（選填）"
                  rows={2}
                />
              </div>
            </section>

            <div style={{ height: 90 }} />
          </div>

          <div className="order-footer">
            <div className="footer-total">
              <span className="footer-total__label">小計</span>
              <span className="footer-total__amount">{fmt(totalAmount)}</span>
            </div>
            <button className="cta-btn" disabled={isSubmitting || cartItems.length === 0} onClick={submitOrder}>
              {isSubmitting ? (
                <span>送出中...</span>
              ) : (
                <>
                  <span>確認下單</span>
                  <i className="bx bx-right-arrow-alt"></i>
                </>
              )}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
