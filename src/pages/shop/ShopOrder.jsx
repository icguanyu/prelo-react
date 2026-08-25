import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Input, Skeleton, App } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  BarChartOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Schedules } from '../../api/schedules';
import { Orders } from '../../api/orders';
import { Users } from '../../api/auth';
import { orderStatusOptions } from '../../utils/constants';
import { formatPrice } from '../../utils/format';
import OrderCard from '../../components/order/OrderCard';
import OrderCreate from '../../components/order/OrderCreate';
import './ShopOrder.scss';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

const defaultSchedule = {
  id: null,
  schedule_date: '',
  status: 'DRAFT',
  order_start_at: null,
  order_end_at: null,
  items: [],
  orders: [],
};

export default function ShopOrder() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const orderCreateRef = useRef(null);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('order-view-mode') || 'detailed');
  const [showStats, setShowStats] = useState(() => localStorage.getItem('order-show-stats') !== 'false');
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [shopData, setShopData] = useState(null);

  useEffect(() => {
    localStorage.setItem('order-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('order-show-stats', String(showStats));
  }, [showStats]);

  const fetchSchedule = useCallback(async (date) => {
    if (!date) return;
    setIsLoading(true);
    try {
      const res = await Schedules.GetByDate(date);
      setSchedule(res.data === null ? { ...defaultSchedule, schedule_date: date } : res.data);
    } catch {
      // 錯誤已由 axios interceptor 顯示
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate, fetchSchedule]);

  useEffect(() => {
    Users.Me()
      .then((res) => setShopData(res.data))
      .catch(() => {});
  }, []);

  const dateStats = useMemo(() => {
    const orders = schedule.orders || [];
    return {
      total: orders.length,
      placed: orders.filter((o) => o.status === 'PLACED').length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
      revenue: orders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total_amount, 0),
    };
  }, [schedule]);

  const weekDays = useMemo(() => {
    const start = dayjs(selectedDate).startOf('week');
    return Array.from({ length: 7 }, (_, i) => {
      const d = start.add(i, 'day');
      return {
        date: d.format('YYYY-MM-DD'),
        name: DAY_NAMES[d.day()],
        num: d.format('D'),
        isToday: d.isSame(dayjs(), 'day'),
      };
    });
  }, [selectedDate]);

  const dateLabel = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    if (selectedDate === today) return '今日';
    if (selectedDate === tomorrow) return '明日';
    if (selectedDate === yesterday) return '昨日';
    return dayjs(selectedDate).format('M/D');
  }, [selectedDate]);

  const filteredOrders = useMemo(() => {
    let result = schedule.orders || [];
    if (activeTab !== 'all') {
      result = result.filter((o) => o.status === activeTab);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(query) ||
          (o.order_no || '').toLowerCase().includes(query) ||
          o.customer_name.toLowerCase().includes(query) ||
          o.customer_phone.includes(query),
      );
    }
    return result;
  }, [schedule, activeTab, searchQuery]);

  const getStatusLabel = (status) => ({ PLACED: '已下單', COMPLETED: '已完成', CANCELLED: '已取消' }[status] || status);

  const updateStatus = async (order, newStatus) => {
    setIsLoading(true);
    try {
      await Orders.UpdateStatus(order.id, { status: newStatus });
      message.success(`顧客 ${order.customer_name} 的訂單已更新為${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      await fetchSchedule(selectedDate);
    }
  };

  const goPrevWeek = () => setSelectedDate((d) => dayjs(d).subtract(7, 'day').format('YYYY-MM-DD'));
  const goNextWeek = () => setSelectedDate((d) => dayjs(d).add(7, 'day').format('YYYY-MM-DD'));

  return (
    <div className="order-manager">
      <div className="order-header">
        <div className="header-top">
          <div>
            <h2>訂單管理</h2>
            <p className="subtitle">查看與管理每日訂單，追蹤訂單狀態</p>
          </div>
          <div className="header-actions">
            <div className="view-toggles">
              <button
                className={`toggle-btn${showStats ? ' active' : ''}`}
                onClick={() => setShowStats((s) => !s)}
                title={showStats ? '隱藏統計' : '顯示統計'}
              >
                <BarChartOutlined />
                <span>統計</span>
              </button>
              <button
                className={`toggle-btn${viewMode === 'detailed' ? ' active' : ''}`}
                onClick={() => setViewMode((v) => (v === 'detailed' ? 'simple' : 'detailed'))}
                title={viewMode === 'detailed' ? '卡片' : '清單'}
              >
                <FileTextOutlined />
                <span>{viewMode === 'detailed' ? '卡片' : '清單'}</span>
              </button>
            </div>
            <Button className="btn-refresh" loading={isLoading} icon={!isLoading && <ReloadOutlined />} onClick={() => fetchSchedule(selectedDate)}>
              刷新
            </Button>
            <Button onClick={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}>回今天</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!schedule.id}
              onClick={() => orderCreateRef.current?.open(schedule, shopData)}
            >
              {schedule.id ? '新增訂單' : '請先開單'}
            </Button>
          </div>
        </div>
      </div>

      {showStats && (
        <div className="stats-block">
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{dateStats.total}</div>
              <div className="stat-label">{dateLabel}訂單</div>
            </div>
            <div className="stat-card">
              <div className="stat-value placed">{dateStats.placed}</div>
              <div className="stat-label">已下單</div>
            </div>
            <div className="stat-card">
              <div className="stat-value completed">{dateStats.completed}</div>
              <div className="stat-label">已完成</div>
            </div>
            <div className="stat-card">
              <div className="stat-value cancelled">{dateStats.cancelled}</div>
              <div className="stat-label">已取消</div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-value">{formatPrice(dateStats.revenue)}</div>
              <div className="stat-label">{dateLabel}總金額</div>
            </div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="date-nav">
          <Button icon={<LeftOutlined />} shape="circle" size="small" loading={isLoading} onClick={goPrevWeek} />
          <div className="week-strip">
            {weekDays.map((day) => (
              <button
                key={day.date}
                className={`day-cell${day.date === selectedDate ? ' active' : ''}${day.isToday ? ' today' : ''}`}
                onClick={() => setSelectedDate(day.date)}
              >
                <span className="day-name">{day.name}</span>
                <span className="day-num">{day.num}</span>
              </button>
            ))}
          </div>
          <Button icon={<RightOutlined />} shape="circle" size="small" loading={isLoading} onClick={goNextWeek} />
        </div>
        <div className="toolbar-search">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋姓名、電話、編號"
            prefix={<SearchOutlined />}
            allowClear
          />
        </div>
      </div>

      <div className="status-tabs">
        {orderStatusOptions.map((tab) => (
          <div
            key={tab.value}
            className={`status-tab${activeTab === tab.value ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            <span className="tab-label">{tab.label}</span>
            {tab.value !== 'all' ? (
              <span className="tab-count" style={{ background: tab.color }}>
                {dateStats[tab.value.toLowerCase()]}
              </span>
            ) : (
              <span className="tab-count-all">{dateStats.total}</span>
            )}
          </div>
        ))}
      </div>

      <div className={`orders-grid${viewMode === 'simple' ? ' list-view' : ''}`}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="order-skeleton">
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          ))
        ) : (
          <>
            {filteredOrders.map((order) => (
              <div key={order.id} id={`order-${order.id}`} className="order-card-anchor">
                <OrderCard
                  order={order}
                  items={schedule.items}
                  viewMode={viewMode}
                  onStatusChange={updateStatus}
                  onUpdate={() => fetchSchedule(selectedDate)}
                />
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="empty-state">
                <FileTextOutlined className="empty-icon" />
                <p className="empty-text">
                  {schedule.id ? '當前日期沒有符合條件的訂單' : '尚未設定當前日期的排程，請先建立排程後再新增訂單'}
                </p>
                {!schedule.id && (
                  <Button type="primary" icon={<CalendarOutlined />} onClick={() => navigate('/shop/order')}>
                    前往開單
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <OrderCreate ref={orderCreateRef} onCreated={() => fetchSchedule(selectedDate)} />
    </div>
  );
}
