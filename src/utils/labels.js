import { orderStatusOptions } from './constants';

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
export const getWeekdayLabel = (n) => WEEKDAY_LABELS[n] ?? n;

const PAYMENT_MAP = {
  cash: '現金',
  linepay: 'Line Pay',
  bank: '銀行轉帳',
  card: '信用卡',
};
export const getPaymentLabel = (v) =>
  PAYMENT_MAP[String(v ?? '').toLowerCase()] ?? v ?? '—';

const PICKUP_MAP = {
  pickup: '自取',
  delivery: '宅配',
};
export const getPickupLabel = (v) =>
  PICKUP_MAP[String(v ?? '').toLowerCase()] ?? v ?? '—';

export const getOrderStatusLabel = (v) =>
  orderStatusOptions.find((o) => o.value === v)?.label ?? v;
export const getOrderStatusColor = (v) =>
  orderStatusOptions.find((o) => o.value === v)?.color ?? '';
