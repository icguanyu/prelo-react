import dayjs from 'dayjs';
import './ScheduleCalendar.scss';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const today = dayjs().format('YYYY-MM-DD');

export default function ScheduleCalendar({ scheduleList, selectedDate = null, isLoading = false, onSelect }) {
  return (
    <div className="schedule-calendar">
      <div className="week-header">
        {WEEK_LABELS.map((d) => (
          <span key={d} className="week-label">
            {d}
          </span>
        ))}
      </div>
      <div className="calendar-grid">
        {scheduleList.map((schedule) => {
          const classNames = [
            'cal-cell',
            selectedDate === schedule.date && 'is-selected',
            schedule.date === today && 'is-today',
            !schedule.isCurrentMonth && 'is-other-month',
            schedule.hasSchedule && 'has-schedule',
            schedule.status === 'ANNOUNCED' && 'is-announced',
            schedule.venueName && 'is-venue',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={schedule.date} className={classNames} onClick={() => onSelect?.(schedule.date)}>
              <div className="cell-date-row">
                <div
                  className={`cell-date${schedule.dateObj.day() === 6 ? ' saturday' : ''}${
                    schedule.dateObj.day() === 0 ? ' sunday' : ''
                  }`}
                >
                  {schedule.dateObj.format('D')}
                </div>
                {schedule.venueName && (
                  <span className="venue-icon" title={schedule.venueName}>
                    <i className="bx bxs-truck"></i>
                  </span>
                )}
              </div>
              <div className="cell-body">
                {isLoading && !schedule.hasSchedule ? (
                  <span className="cell-dot"></span>
                ) : schedule.hasSchedule ? (
                  <>
                    {schedule.orderCount > 0 && <span className="cell-badge orders">{schedule.orderCount}筆</span>}
                    <span className={`cell-badge status status--${schedule.status}`}>{schedule.statusLabel}</span>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
