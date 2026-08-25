import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw';
import { Button, Badge } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  EditOutlined,
  AppstoreOutlined,
  MenuOutlined,
  HistoryOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Schedules } from '../../api/schedules';
import { scheduleStatusOptions } from '../../utils/constants';
import { formatPrice } from '../../utils/format';
import ScheduleCalendar from '../../components/schedule/ScheduleCalendar';
import ScheduleEditor from '../../components/schedule/ScheduleEditor';
import './ShopSchedule.scss';

const scheduleStatusLabelMap = scheduleStatusOptions.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});

const defaultSchedule = {
  id: null,
  schedule_date: '',
  status: 'DRAFT',
  order_start_at: null,
  order_end_at: null,
  items: [],
  orders: [],
  order_count: 0,
  item_count: 0,
};

function generateScheduleList(baseDate, scheduleMap) {
  const list = [];
  const monthStart = baseDate.startOf('month');
  const monthEnd = baseDate.endOf('month');
  const firstDayOfWeek = monthStart.day();
  const calendarStart = monthStart.subtract(firstDayOfWeek, 'day');
  const lastDayOfWeek = monthEnd.day();
  const daysToAdd = 6 - lastDayOfWeek;
  const calendarEnd = monthEnd.add(daysToAdd, 'day');
  const baseMonth = baseDate.format('YYYY-MM');

  let currentDate = calendarStart;
  while (currentDate.isBefore(calendarEnd) || currentDate.isSame(calendarEnd)) {
    const date = currentDate.format('YYYY-MM-DD');
    const isCurrentMonth = currentDate.format('YYYY-MM') === baseMonth;
    const scheduleData = scheduleMap[date] || null;
    const orderCount = scheduleData?.order_count ?? 0;
    const status = scheduleData?.status || 'DRAFT';

    list.push({
      date,
      dateObj: currentDate.clone(),
      orderCount,
      itemCount: scheduleData?.item_count ?? 0,
      status,
      statusLabel: scheduleStatusLabelMap[status] || status,
      hasSchedule: Boolean(scheduleData),
      hasOrders: orderCount > 0,
      isCurrentMonth,
      venueName: scheduleData?.venue_name || '',
    });

    currentDate = currentDate.add(1, 'day');
  }
  return list;
}

function getOrderAmount(orders) {
  if (!orders || orders.length === 0) return 0;
  return orders.reduce((total, order) => total + (order.total_amount || 0), 0);
}

const todayStr = dayjs().format('YYYY-MM-DD');

export default function ShopSchedule() {
  const [baseDate, setBaseDate] = useState(() => dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduleMap, setScheduleMap] = useState({});
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMonthLoading, setIsMonthLoading] = useState(false);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [calendarMode, setCalendarMode] = useState(
    () => localStorage.getItem('schedule-calendar-mode') || 'sidebar',
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const latestDateRequest = useRef(null);

  const scheduleList = useMemo(() => generateScheduleList(baseDate, scheduleMap), [baseDate, scheduleMap]);
  const currentMonthDays = useMemo(() => scheduleList.filter((d) => d.isCurrentMonth), [scheduleList]);
  const currentMonthLabel = baseDate.format('YYYY 年 M 月');

  // 依 scheduleList 變化（換月或資料更新）決定選取日期，邏輯對應 Vue 版 initScheduleList
  useEffect(() => {
    setSelectedDate((current) => {
      const currentSchedule = current ? scheduleList.find((s) => s.date === current) : null;
      if (currentSchedule?.isCurrentMonth) return current;

      const todaySchedule = scheduleList.find((s) => s.date === todayStr && s.isCurrentMonth);
      if (todaySchedule) return todayStr;

      const firstScheduleDay = scheduleList.find((s) => s.hasSchedule && s.isCurrentMonth);
      const firstDayOfMonth = scheduleList.find((s) => s.isCurrentMonth);
      return firstScheduleDay?.date || firstDayOfMonth?.date || null;
    });
  }, [scheduleList]);

  // 每次月份變化時重新抓取整月排程摘要
  useEffect(() => {
    const month = baseDate.format('YYYY-MM');
    setIsMonthLoading(true);
    Schedules.GetByMonth(month)
      .then((res) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const map = {};
        list.forEach((item) => {
          if (item.schedule_date) {
            map[dayjs(item.schedule_date).format('YYYY-MM-DD')] = item;
          }
        });
        setScheduleMap(map);
      })
      .catch(() => {})
      .finally(() => setIsMonthLoading(false));
  }, [baseDate, refreshKey]);

  // 選取日期變化時抓取當日排程明細
  useEffect(() => {
    if (!selectedDate) return;
    latestDateRequest.current = selectedDate;
    setIsDayLoading(true);
    Schedules.GetByDate(selectedDate)
      .then((res) => {
        if (selectedDate !== latestDateRequest.current) return;
        if (res.data === null) {
          setSchedule({ ...defaultSchedule, schedule_date: selectedDate });
        } else {
          setSchedule(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (selectedDate === latestDateRequest.current) setIsDayLoading(false);
      });
  }, [selectedDate, refreshKey]);

  useEffect(() => {
    localStorage.setItem('schedule-calendar-mode', calendarMode);
  }, [calendarMode]);

  const selectedDateStats = useMemo(() => {
    if (!selectedDate) return null;
    const list = Array.isArray(schedule.orders) ? schedule.orders : [];
    if (list.length === 0) return null;
    return {
      total: list.length,
      ordered: list.filter((o) => o.status === 'PLACED').length,
      completed: list.filter((o) => o.status === 'COMPLETED').length,
      cancelled: list.filter((o) => o.status === 'CANCELLED').length,
      total_amount: getOrderAmount(schedule.orders),
    };
  }, [selectedDate, schedule]);

  const goPreviousMonth = () => setBaseDate((d) => d.subtract(1, 'month'));
  const goNextMonth = () => setBaseDate((d) => d.add(1, 'month'));
  const goToday = () => {
    setBaseDate(dayjs());
    setSelectedDate(null);
  };

  const goPreviousDay = () => {
    if (!selectedDate) {
      setSelectedDate(dayjs().format('YYYY-MM-DD'));
      return;
    }
    const previousDate = dayjs(selectedDate).subtract(1, 'day');
    if (previousDate.format('YYYY-MM') !== baseDate.format('YYYY-MM')) {
      setBaseDate(previousDate);
    }
    setSelectedDate(previousDate.format('YYYY-MM-DD'));
  };

  const goNextDay = () => {
    if (!selectedDate) {
      setSelectedDate(dayjs().format('YYYY-MM-DD'));
      return;
    }
    const nextDate = dayjs(selectedDate).add(1, 'day');
    if (nextDate.format('YYYY-MM') !== baseDate.format('YYYY-MM')) {
      setBaseDate(nextDate);
    }
    setSelectedDate(nextDate.format('YYYY-MM-DD'));
  };

  // editor 儲存後呼叫：讓月份摘要與當日明細的 effect 重新抓取一次
  const refreshCurrentDate = () => setRefreshKey((k) => k + 1);

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <div className="header-top">
          <h2>接單排程</h2>
          <div className="header-actions">
            <div className="view-toggle">
              <button
                className={`view-btn${calendarMode === 'sidebar' ? ' active' : ''}`}
                title="月曆側欄"
                onClick={() => setCalendarMode('sidebar')}
              >
                <AppstoreOutlined />
              </button>
              <button
                className={`view-btn${calendarMode === 'strip' ? ' active' : ''}`}
                title="月份橫條"
                onClick={() => setCalendarMode('strip')}
              >
                <MenuOutlined />
              </button>
            </div>
            <Button type="primary" icon={<HistoryOutlined />} onClick={goToday}>
              今日
            </Button>
          </div>
        </div>
      </div>

      {calendarMode === 'strip' && (
        <div className="month-strip-bar">
          <div className="month-strip-header">
            <Button className="strip-nav-btn" icon={<LeftOutlined />} shape="circle" size="small" onClick={goPreviousMonth} />
            <span className="month-strip-label">{currentMonthLabel}</span>
            <Button className="strip-nav-btn" icon={<RightOutlined />} shape="circle" size="small" onClick={goNextMonth} />
          </div>
          <div className="month-strip-scroll">
            {currentMonthDays.map((day) => (
              <button
                key={day.date}
                className={`strip-cell${day.date === selectedDate ? ' active' : ''}${day.date === todayStr ? ' today' : ''}${day.hasSchedule ? ' has-schedule' : ''}`}
                onClick={() => setSelectedDate(day.date)}
              >
                <span className="strip-name">{dayjs(day.date).locale('zh-tw').format('dd')}</span>
                <span className="strip-num">{dayjs(day.date).format('D')}</span>
                {day.hasSchedule && <span className="strip-dot" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="schedule-main">
        {isEditorOpen ? (
          <ScheduleEditor
            schedule={schedule}
            onClose={() => setIsEditorOpen(false)}
            onUpdate={refreshCurrentDate}
          />
        ) : selectedDate ? (
          <div className="schedule-left">
            <div className="detail-header">
              <div className="detail-header-left">
                <Button className="day-nav-btn" icon={<LeftOutlined />} shape="circle" size="small" onClick={goPreviousDay} />
                <h3>{dayjs(selectedDate).locale('zh-tw').format('YYYY 年 M 月 DD 日 (dd)')}</h3>
                <Button className="day-nav-btn" icon={<RightOutlined />} shape="circle" size="small" onClick={goNextDay} />
              </div>
              <div className="detail-actions">
                <Button icon={<EditOutlined />} onClick={() => setIsEditorOpen(true)}>
                  編輯
                </Button>
              </div>
            </div>

            {selectedDateStats && (
              <div className="stats-row">
                <div className="stat-pill">
                  <span className="pill-num">{selectedDateStats.total}</span>
                  <span className="pill-label">訂單</span>
                </div>
                <div className="pill-divider"></div>
                <div className="stat-pill">
                  <span className="pill-num blue">{selectedDateStats.ordered}</span>
                  <span className="pill-label">已下單</span>
                </div>
                <div className="pill-divider"></div>
                <div className="stat-pill">
                  <span className="pill-num green">{selectedDateStats.completed}</span>
                  <span className="pill-label">已完成</span>
                </div>
                <div className="pill-divider"></div>
                <div className="stat-pill">
                  <span className="pill-num red">{selectedDateStats.cancelled}</span>
                  <span className="pill-label">已取消</span>
                </div>
                <div className="pill-divider"></div>
                <div className="stat-pill">
                  <span className="pill-num amber">{formatPrice(selectedDateStats.total_amount)}</span>
                  <span className="pill-label">總金額</span>
                </div>
              </div>
            )}

            {isDayLoading ? (
              <div className="detail-loading">資料載入中...</div>
            ) : (
              <div className="detail-content">
                <div className="products-section">
                  <div className="section-title">
                    <span>今日出爐</span>
                    <span className="count">{schedule.items.length} 項商品</span>
                  </div>
                  <div className="items-list">
                    {schedule.items.map((product) => (
                      <div key={product.id} className="item-card">
                        <Badge
                          count={product.ordered_quantity ?? 0}
                          className="item-demand-badge"
                          style={{ display: (product.ordered_quantity ?? 0) === 0 ? 'none' : undefined }}
                        >
                          <div className="item-thumb">
                            {product.image_url && <img src={product.image_url} alt={product.product_name} />}
                          </div>
                        </Badge>
                        <div className="item-info">
                          <div className="item-name">{product.product_name}</div>
                          <div className="item-price">{formatPrice(product.unit_price)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="order-note">※數字表示已下單數量</div>
                  </div>
                </div>
                {schedule.items.length === 0 && (
                  <div className="empty-orders">
                    <ShoppingCartOutlined />
                    <p>尚未開單</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {calendarMode === 'sidebar' && (
          <div className="schedule-right">
            <div className="month-navigation">
              <Button className="month-nav-btn" icon={<LeftOutlined />} shape="circle" size="small" onClick={goPreviousMonth} />
              <span className="month-label">{currentMonthLabel}</span>
              <Button className="month-nav-btn" icon={<RightOutlined />} shape="circle" size="small" onClick={goNextMonth} />
            </div>
            <ScheduleCalendar
              scheduleList={scheduleList}
              selectedDate={selectedDate}
              isLoading={isMonthLoading}
              onSelect={setSelectedDate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
