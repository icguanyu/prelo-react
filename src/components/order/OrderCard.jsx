import { useState } from 'react';
import { Button, Tag } from 'antd';
import { EditOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { orderStatusOptions } from '../../utils/constants';
import { formatPrice } from '../../utils/format';
import OrderDetail from './OrderDetail';
import './OrderCard.scss';

const STATUS_LABELS = { PLACED: '已下單', COMPLETED: '已完成', CANCELLED: '已取消' };
const PAYMENT_LABELS = { cash: '現金', bank: '匯款', linepay: 'Line Pay', card: '信用卡' };

function getStatusColor(status) {
  return orderStatusOptions.find((o) => o.value === status)?.color || '#6b7280';
}

export default function OrderCard({ order, items, viewMode, onStatusChange, onUpdate }) {
  const [detailOpen, setDetailOpen] = useState(false);

  const itemsSummary = order.items.map((i) => `${i.product_name}×${i.quantity}`).join('、');

  const tags = (
    <>
      <Tag color="default">{PAYMENT_LABELS[order.payment_method] || order.payment_method}</Tag>
      {order.pickup_method === 'pickup' && <Tag color="success">自取</Tag>}
      {order.pickup_method === 'delivery' && <Tag color="warning">宅配</Tag>}
      {order.bring_own_bag && <Tag color="processing">自備袋</Tag>}
    </>
  );

  const statusChip = (
    <span className="status-chip" style={{ background: getStatusColor(order.status) }}>
      {STATUS_LABELS[order.status] || order.status}
    </span>
  );

  const actions =
    order.status === 'PLACED' ? (
      <>
        <Button size="small" onClick={() => onStatusChange?.(order, 'CANCELLED')} className="btn-cancel">
          取消
        </Button>
        <Button type="primary" size="small" onClick={() => onStatusChange?.(order, 'COMPLETED')} className="btn-complete" style={{ backgroundColor: '#2eaa62', borderColor: '#2eaa62' }}>
          ✓ 完成
        </Button>
      </>
    ) : order.status === 'COMPLETED' || order.status === 'CANCELLED' ? (
      <Button size="small" onClick={() => onStatusChange?.(order, 'PLACED')} style={{ flex: 1 }}>
        復原
      </Button>
    ) : null;

  return (
    <>
      {viewMode === 'simple' ? (
        <div className={`order-card order-row status-${order.status.toLowerCase()}`}>
          <div className="row-bar"></div>
          <div className="row-body">
            <div className="col-order">
              <div className="order-num">
                <span className="num-main">{order.order_no}</span>
              </div>
              {statusChip}
            </div>
            <div className="col-customer">
              <div className="customer-name">{order.customer_name}</div>
              <div className="customer-sub">
                {order.customer_phone} · {order.pickup_time}
              </div>
            </div>
            <div className="col-tags">{tags}</div>
            <div className="col-items">
              <span>{itemsSummary}</span>
              {order.note && <span className="row-note">｜{order.note}</span>}
            </div>
            <div className="col-total">{formatPrice(order.total_amount)}</div>
            <div className="col-actions" onClick={(e) => e.stopPropagation()}>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setDetailOpen(true)}>
                詳情
              </Button>
              {actions}
            </div>
          </div>
        </div>
      ) : (
        <div className={`order-card status-${order.status.toLowerCase()}`}>
          <div className="card-top-bar"></div>

          <div className="card-header">
            <div className="order-num">
              <span className="num-main">{order.order_no}</span>
            </div>
            {statusChip}
          </div>

          <div className="card-customer">
            <div className="customer-name">{order.customer_name}</div>
            <div className="customer-meta">
              <span className="meta-item">
                <PhoneOutlined />
                {order.customer_phone}
              </span>
              <span className="meta-item">
                <ClockCircleOutlined />
                {order.pickup_time}
              </span>
            </div>
            <div className="customer-tags">{tags}</div>
          </div>

          <div className="card-items">
            <div className="items-label">
              <span>訂購明細</span>
              <Button ghost type="primary" size="small" icon={<EditOutlined />} onClick={() => setDetailOpen(true)}>
                查看詳情
              </Button>
            </div>
            <div className="items-list">
              {order.items.map((item, idx) => (
                <div key={idx} className="item-row">
                  <span className="item-name">
                    {item.product_name}
                    {item.is_sliced && <Tag>切</Tag>}
                  </span>
                  <span className="item-qty">× {item.quantity}</span>
                  <span className="item-price">{formatPrice(item.line_total)}</span>
                </div>
              ))}
            </div>
          </div>

          {order.note && (
            <div className="card-note">
              <span className="note-label">備註</span>
              {order.note}
            </div>
          )}

          <div className="card-footer">
            <div className="order-total">
              <span className="total-label">合計</span>
              <span className="total-amount">{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          <div className="card-actions" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        </div>
      )}

      <OrderDetail
        open={detailOpen}
        order={order}
        availableItems={items}
        onClose={() => setDetailOpen(false)}
        onDeleted={() => onUpdate?.()}
        onUpdated={() => onUpdate?.()}
      />
    </>
  );
}
