import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Shop } from '../../api/shop';
import StoreTopbar from '../../components/store/StoreTopbar';
import './StoreSchedules.scss';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const today = dayjs();

function getBadge(s) {
  if (s.status === 'OPEN') return { label: '接單中', className: 'badge--open' };
  if (s.status === 'ANNOUNCED') {
    const dt = s.order_start_at ? dayjs(s.order_start_at) : null;
    const label = dt ? `${dt.format('MM/DD HH:mm')} 開放預訂` : '即將開放';
    return { label, className: 'badge--announced' };
  }
  return { label: s.status, className: '' };
}

function isPastSchedule(s) {
  return s.status === 'CLOSED' || dayjs(s.schedule_date).isBefore(today, 'day');
}

function getFlowSteps(s) {
  return [
    { label: '接單中', time: null },
    { label: '結單', time: s.order_end_at ? dayjs(s.order_end_at).format('M/D HH:mm') : null },
    {
      label: s.is_venue ? '現場取貨' : '到店取貨',
      time:
        s.is_venue && s.venue_start
          ? `${dayjs(s.schedule_date).format('M/D')} ${s.venue_start}${s.venue_end ? '–' + s.venue_end : ''}`
          : s.schedule_date
            ? dayjs(s.schedule_date).format('M/D')
            : null,
    },
  ];
}

function getFlowStepIndex(s) {
  if (isPastSchedule(s)) return 2;
  if (s.status === 'OPEN') return 0;
  if (s.status === 'CLOSED') return 1;
  return -1;
}

function addToCalendar(s, slug) {
  const summary = `開放預訂通知`;
  const description = `${slug} 的接單行程即將開放，記得來下單！`;

  let dtStart, dtEnd;
  if (s.order_start_at) {
    const dt = dayjs(s.order_start_at);
    dtStart = `DTSTART:${dt.format('YYYYMMDDTHHmmss')}`;
    dtEnd = `DTEND:${dt.add(30, 'minute').format('YYYYMMDDTHHmmss')}`;
  } else {
    const dateStr = dayjs(s.schedule_date).format('YYYYMMDD');
    dtStart = `DTSTART;VALUE=DATE:${dateStr}`;
    dtEnd = `DTEND;VALUE=DATE:${dateStr}`;
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Prelo//Prelo//EN',
    'BEGIN:VEVENT',
    dtStart,
    dtEnd,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${slug} 現在開放預訂囉！`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prelo-${s.schedule_date}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StoreSchedules() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [currentMonth, setCurrentMonth] = useState(() => today.startOf('month'));
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [shopName, setShopName] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  useEffect(() => {
    setIsLoading(true);
    Shop.GetSchedules(slug, { month: currentMonth.format('YYYY-MM') })
      .then((res) => setSchedules(res.data?.data ?? []))
      .catch(() => setSchedules([]))
      .finally(() => setIsLoading(false));
  }, [slug, currentMonth]);

  useEffect(() => {
    Shop.GetInfo(slug)
      .then((res) => setShopName(res.data?.shopName ?? ''))
      .catch(() => {});
  }, [slug]);

  const monthLabel = currentMonth.format('YYYY 年 M 月');

  const scheduleMap = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      map[s.schedule_date] = s;
    });
    return map;
  }, [schedules]);

  const calendarCells = useMemo(() => {
    const start = currentMonth.startOf('month');
    const end = currentMonth.endOf('month');
    const cells = [];
    for (let i = 0; i < start.day(); i++) cells.push(null);
    for (let d = start; !d.isAfter(end); d = d.add(1, 'day')) cells.push(d);
    return cells;
  }, [currentMonth]);

  const monthSchedules = useMemo(
    () => [...schedules].sort((a, b) => a.schedule_date.localeCompare(b.schedule_date)),
    [schedules],
  );

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="schedules-page">
      <StoreTopbar title={shopName ? `${shopName} - 近期菜單` : '近期菜單'} />

      <div className="content">
        <div className="month-nav">
          <button className="month-nav__btn" onClick={() => setCurrentMonth((m) => m.subtract(1, 'month'))}>
            <i className="bx bx-chevron-left"></i>
          </button>
          <span className="month-nav__label">{monthLabel}</span>
          <button className="month-nav__btn" onClick={() => setCurrentMonth((m) => m.add(1, 'month'))}>
            <i className="bx bx-chevron-right"></i>
          </button>
        </div>

        <div className={`calendar${isLoading ? ' calendar--loading' : ''}`}>
          <div className="calendar__week-header">
            {WEEKDAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="calendar__grid">
            {calendarCells.map((cell, i) => {
              const key = cell ? cell.format('YYYY-MM-DD') : `empty-${i}`;
              const cellSchedule = cell ? scheduleMap[cell.format('YYYY-MM-DD')] : null;
              const classNames = [
                'cal-cell',
                !cell && 'cal-cell--empty',
                cell && cell.isSame(today, 'day') && 'cal-cell--today',
                cellSchedule?.status === 'OPEN' && 'cal-cell--open',
                cellSchedule?.status === 'ANNOUNCED' && 'cal-cell--announced',
                cellSchedule?.is_venue && 'cal-cell--venue',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div key={key} className={classNames}>
                  {cell && <span className="cal-cell__day">{cell.date()}</span>}
                  {cellSchedule?.is_venue ? (
                    <i className="bx bxs-truck cal-cell__venue-icon"></i>
                  ) : cellSchedule ? (
                    <span className="cal-cell__dot"></span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="legend">
          <span className="legend__item">
            <span className="legend__dot legend__dot--open"></span>接單中
          </span>
          <span className="legend__item">
            <span className="legend__dot legend__dot--announced"></span>即將開放
          </span>
          <span className="legend__item">
            <span className="legend__dot legend__dot--venue"></span>巡迴場
          </span>
        </div>

        <div className="section-title">本月行程</div>

        {isLoading ? (
          Array.from({ length: 2 }).map((_, n) => (
            <div key={n} className="schedule-card">
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div className="skeleton-block" style={{ width: 48, height: 52, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton-block" style={{ width: '60%', height: 14 }} />
                  <div className="skeleton-block" style={{ width: '40%', height: 14 }} />
                </div>
              </div>
              <div className="skeleton-block" style={{ width: '100%', height: 36, borderRadius: 8, marginTop: 4 }} />
            </div>
          ))
        ) : monthSchedules.length === 0 ? (
          <div className="empty">
            <i className="bx bx-calendar-x"></i>
            <p>本月尚無開放行程</p>
          </div>
        ) : (
          monthSchedules.map((s) => {
            const past = isPastSchedule(s);
            const expanded = !past || expandedIds.has(s.id);
            const flowStepIndex = getFlowStepIndex(s);

            return (
              <div
                key={s.id}
                className={`schedule-card${s.status === 'ANNOUNCED' ? ' schedule-card--announced' : ''}${past ? ' schedule-card--past' : ''}`}
              >
                {past ? (
                  <div className="schedule-card__collapsed" onClick={() => toggleExpand(s.id)}>
                    <div className="schedule-card__collapsed-left">
                      <span className="schedule-card__collapsed-date">
                        {dayjs(s.schedule_date).format('M/D')}（週{WEEKDAY_LABELS[dayjs(s.schedule_date).day()]}）
                      </span>
                      {s.is_venue && (
                        <span className="badge badge--venue badge--venue-sm">
                          <i className="bx bxs-truck"></i>
                        </span>
                      )}
                      <span className="badge badge--closed">已結單</span>
                    </div>
                    <i className={`bx schedule-card__collapsed-chevron ${expandedIds.has(s.id) ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                  </div>
                ) : (
                  <div className="schedule-card__head">
                    <div className="schedule-card__date-row">
                      <span className="schedule-card__day">{dayjs(s.schedule_date).format('M月D日')}</span>
                      <span className="schedule-card__weekday">週{WEEKDAY_LABELS[dayjs(s.schedule_date).day()]}</span>
                      {s.is_venue && (
                        <span className="badge badge--venue">
                          <i className="bx bxs-truck"></i> 巡迴場
                        </span>
                      )}
                      <span className={`badge ${getBadge(s).className}`}>{getBadge(s).label}</span>
                    </div>
                    {s.note && (
                      <div className="schedule-card__note">
                        <i className="bx bx-info-circle"></i> {s.note}
                      </div>
                    )}
                  </div>
                )}

                {s.is_venue && !past && (
                  <a
                    className="venue-info"
                    href={`https://maps.google.com/?q=${encodeURIComponent(s.venue_address || s.venue_name)}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <img
                      src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32"
                      className="venue-info__icon"
                      alt="Google Maps"
                    />
                    <div className="venue-info__body">
                      <span className="venue-info__name">
                        {s.venue_name}
                        {s.venue_start && s.venue_end && <>・{s.venue_start}–{s.venue_end}</>}
                      </span>
                      {s.venue_address && <span className="venue-info__address">{s.venue_address}</span>}
                    </div>
                    <i className="bx bx-chevron-right venue-info__arrow"></i>
                  </a>
                )}

                {expanded && (
                  <>
                    <div className="flow-steps">
                      {getFlowSteps(s).map((step, i, arr) => (
                        <div key={step.label} style={{ display: 'contents' }}>
                          <div
                            className={`flow-step${flowStepIndex === i ? ' flow-step--active' : ''}${flowStepIndex > i ? ' flow-step--done' : ''}`}
                          >
                            <span className="flow-dot"></span>
                            <span className="flow-label">{step.label}</span>
                            {step.time && <span className="flow-time">{step.time}</span>}
                          </div>
                          {i < arr.length - 1 && (
                            <div className={`flow-line${flowStepIndex > i ? ' flow-line--active' : ''}`}></div>
                          )}
                        </div>
                      ))}
                    </div>

                    {s.items?.length > 0 ? (
                      <div className="schedule-card__items">
                        {s.items.map((item) => (
                          <div key={item.id} className="item-chip">
                            <div className="item-chip__main">
                              <span className="item-chip__name">{item.product_name}</span>
                              <span className="item-chip__price">${item.unit_price}</span>
                            </div>
                            {item.sales_limit > 0 && !past && (
                              <span className={`item-chip__stock${item.remaining <= 5 ? ' item-chip__stock--low' : ''}`}>
                                {item.remaining ? `可訂 ${item.remaining} ` : '售完'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="schedule-card__items-empty">品項即將公告</div>
                    )}

                    {s.status === 'OPEN' && (
                      <button
                        className="schedule-card__btn"
                        onClick={() => navigate(`/s/${slug}/schedules/${s.schedule_date}`)}
                      >
                        我要訂購
                      </button>
                    )}
                    {s.status === 'ANNOUNCED' && s.order_start_at && (
                      <button
                        className="cal-btn cal-btn--full"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCalendar(s, slug);
                        }}
                      >
                        <i className="bx bx-calendar-plus"></i> 加入行事曆
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="page-footer">
        由{' '}
        <a href="/" target="_blank" rel="noopener">
          Prelo
        </a>{' '}
        提供服務
      </div>
    </div>
  );
}
