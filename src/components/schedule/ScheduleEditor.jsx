import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { DatePicker, Select, Input, InputNumber, Switch, Button, Alert, App, Steps, Space } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Schedules } from '../../api/schedules';
import { scheduleStatusOptions } from '../../utils/constants';
import { generateTimeOptions } from '../../utils/time';
import SelectProduct from '../select/SelectProduct';
import './ScheduleEditor.scss';

const timeOptions = generateTimeOptions('00:00', '23:30', 30);
const venueTimeOptions = generateTimeOptions('06:00', '22:00', 30);

const defaultSchedule = {
  schedule_date: '',
  status: 'DRAFT',
  order_start_at: null,
  order_end_at: null,
  items: [],
  order_count: 0,
};

function buildFormFromSchedule(schedule) {
  return {
    id: schedule?.id || null,
    schedule_date: schedule?.schedule_date || '',
    status: schedule?.status || 'DRAFT',
    order_start_at: schedule?.order_start_at || null,
    order_end_at: schedule?.order_end_at || null,
    items: Array.isArray(schedule?.items)
      ? schedule.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          sales_limit: item.sales_limit,
        }))
      : [],
    venue_name: schedule?.venue_name || '',
    venue_address: schedule?.venue_address || '',
    venue_start: schedule?.venue_start || '',
    venue_end: schedule?.venue_end || '',
  };
}

function buildDateTimeFields(form) {
  let orderStartDate = '';
  let orderStartTime = '';
  if (form.order_start_at) {
    const start = dayjs(form.order_start_at);
    orderStartDate = start.format('YYYY-MM-DD');
    orderStartTime = start.format('HH:mm');
  } else if (form.status === 'OPEN') {
    orderStartDate = dayjs().format('YYYY-MM-DD');
    orderStartTime = '09:00';
  }

  let orderEndDate = '';
  let orderEndTime = '';
  if (form.order_end_at) {
    const end = dayjs(form.order_end_at);
    orderEndDate = end.format('YYYY-MM-DD');
    orderEndTime = end.format('HH:mm');
  } else {
    orderEndDate = form.schedule_date || '';
    orderEndTime = '00:00';
  }

  return { orderStartDate, orderStartTime, orderEndDate, orderEndTime };
}

export default function ScheduleEditor({ schedule = defaultSchedule, onClose, onUpdate }) {
  const { message, notification, modal } = App.useApp();
  const [form, setForm] = useState(() => buildFormFromSchedule(schedule));
  const [enableVenue, setEnableVenue] = useState(!!schedule?.venue_name);
  const [dateTime, setDateTime] = useState(() => buildDateTimeFields(buildFormFromSchedule(schedule)));
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const selectProductRef = useRef(null);

  useEffect(() => {
    const nextForm = buildFormFromSchedule(schedule);
    setForm(nextForm);
    setDateTime(buildDateTimeFields(nextForm));
    setEnableVenue(!!schedule?.venue_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule]);

  const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));
  const patchDateTime = (patch) => setDateTime((d) => ({ ...d, ...patch }));

  const hasOrders = (schedule?.order_count || 0) > 0;
  const needsStartTime = form.status === 'OPEN' || form.status === 'ANNOUNCED';
  const needsEndTime = form.status === 'OPEN';
  const canHaveEndTime = form.status === 'OPEN' || form.status === 'ANNOUNCED';
  const excludeProductIds = form.items.map((item) => item.product_id);
  const timelineActive = { ANNOUNCED: 0, OPEN: 1, CLOSED: 2 }[form.status] ?? -1;

  const setOrderStartNow = () => {
    const now = dayjs();
    const rounded = now.minute() < 30 ? now.minute(30).second(0) : now.add(1, 'hour').minute(0).second(0);
    patchDateTime({ orderStartDate: rounded.format('YYYY-MM-DD'), orderStartTime: rounded.format('HH:mm') });
  };

  const clearVenueFields = () => {
    patchForm({ venue_name: '', venue_address: '', venue_start: '', venue_end: '' });
  };

  const handleVenueToggle = (checked) => {
    if (checked) {
      setEnableVenue(true);
      return;
    }
    const hasFilled = form.venue_name || form.venue_address || form.venue_start || form.venue_end;
    if (!hasFilled) {
      clearVenueFields();
      setEnableVenue(false);
      return;
    }
    modal.confirm({
      title: '確認關閉',
      content: '關閉後將清除已填寫的場地資訊，確定要關閉嗎？',
      okText: '確定清除',
      cancelText: '取消',
      onOk: () => {
        clearVenueFields();
        setEnableVenue(false);
      },
    });
  };

  const handleSelectProduct = (productId) => {
    const product = selectProductRef.current?.getProductById(productId);
    if (!product) return;
    if (form.items.some((item) => item.product_id === product.id)) {
      message.warning('此產品已在列表中');
      setSelectedProductId(null);
      return;
    }
    patchForm({
      items: [...form.items, { product_id: product.id, product_name: product.name, sales_limit: null }],
    });
    setSelectedProductId(null);
  };

  const removeProduct = (id) => {
    patchForm({ items: form.items.filter((item) => item.product_id !== id) });
  };

  const updateItemLimit = (id, sales_limit) => {
    patchForm({ items: form.items.map((item) => (item.product_id === id ? { ...item, sales_limit } : item)) });
  };

  const resetForm = () => {
    const nextForm = buildFormFromSchedule(schedule);
    setForm(nextForm);
    setDateTime(buildDateTimeFields(nextForm));
    setEnableVenue(!!schedule?.venue_name);
    setSelectedProductId(null);
  };

  const closeEditor = () => {
    resetForm();
    onClose?.();
  };

  const saveEditor = async (payload) => {
    setIsLoading(true);
    try {
      if (payload.id) {
        await Schedules.Update(payload.id, payload);
      } else {
        await Schedules.Create(payload);
      }
      notification.success({ message: '成功', description: `排程已${payload.id ? '更新' : '建立'}成功` });
      if (!payload.id) {
        closeEditor();
      }
      onUpdate?.();
    } catch (error) {
      console.error('save schedule error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const beforeSave = () => {
    if (needsEndTime && (!dateTime.orderStartDate || !dateTime.orderStartTime)) {
      message.error('請填寫開單開始時間');
      return;
    }
    if (needsEndTime && (!dateTime.orderEndDate || !dateTime.orderEndTime)) {
      message.error('收單中狀態需填寫開單截止時間');
      return;
    }
    if (!form.schedule_date || form.items.length === 0) {
      message.error('請填寫完整的排程資訊，並至少新增一個產品');
      return;
    }

    const payload = { ...form };
    if (needsStartTime && dateTime.orderStartDate && dateTime.orderStartTime) {
      payload.order_start_at = `${dateTime.orderStartDate} ${dateTime.orderStartTime}:00`;
    }
    if (canHaveEndTime && dateTime.orderEndDate) {
      payload.order_end_at = `${dateTime.orderEndDate} ${dateTime.orderEndTime || '00:00'}:00`;
    }
    saveEditor(payload);
  };

  const deleteSchedule = () => {
    if (!form.id) {
      message.error('無法刪除尚未建立的排程');
      return;
    }
    modal.confirm({
      title: '警告',
      content: '確定要刪除這個排程嗎？',
      okText: '確定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setIsLoading(true);
        try {
          await Schedules.Delete(form.id);
          notification.success({ message: '成功', description: '排程已刪除' });
          closeEditor();
          onUpdate?.();
        } catch (error) {
          console.error('delete schedule error', error);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  return (
    <div className="schedule-editor">
      <div className="editor-header">
        <div className="editor-title">編輯 {dayjs(form.schedule_date).format('MM-DD')} 的排程</div>
        <div className="editor-actions">
          <Button className="editor-back" icon={<ArrowLeftOutlined />} shape="circle" onClick={closeEditor} />
          {form.id && (
            <Button danger ghost onClick={deleteSchedule}>
              刪除
            </Button>
          )}
          <Button className="editor-save" type="primary" loading={isLoading} onClick={beforeSave}>
            送出
          </Button>
        </div>
      </div>

      <div className="editor-body">
        {hasOrders && (
          <Alert
            title="此排程已有訂單，請確認調整內容是否會影響現有訂單。"
            type="warning"
            closable={false}
            showIcon
          />
        )}

        <div className="editor-section">
          <div className="section-title">排程資訊</div>

          <div className="field-row">
            <div className="field">
              <label>取貨日期</label>
              <div className="field-value">{form.schedule_date}</div>
            </div>
            <div className="field">
              <label>開單狀態</label>
              <Select
                value={form.status}
                onChange={(v) => patchForm({ status: v })}
                placeholder="選擇狀態"
                options={scheduleStatusOptions}
              />
            </div>
          </div>

          {form.status && (
            <div className={`status-hint status-hint--${form.status.toLowerCase()}`}>
              {form.status === 'ANNOUNCED' && (
                <span>
                  <b>預告模式</b>
                  ：行程對客人可見，但尚未開放下單。填寫「開單開始時間」後，客人可將提醒加入行事曆，到時間自動通知。
                </span>
              )}
              {form.status === 'OPEN' && (
                <span>
                  <b>接單中</b>：客人可立即下單。需設定開單區間（開始 → 截止），超過截止時間後請手動切換為「已結單」。
                </span>
              )}
              {form.status === 'CLOSED' && (
                <span>
                  <b>已結單</b>：停止接受新訂單，行程仍對客人可見但按鈕會顯示「已結單」。
                </span>
              )}
            </div>
          )}

          {needsStartTime && (
            <div className="field">
              <label>接單開始時間</label>
              <div className="field-content">
                <div className="datetime-inputs">
                  <DatePicker
                    value={dateTime.orderStartDate ? dayjs(dateTime.orderStartDate) : null}
                    onChange={(d) => patchDateTime({ orderStartDate: d ? d.format('YYYY-MM-DD') : '' })}
                    placeholder="選擇日期"
                  />
                  <Select
                    value={dateTime.orderStartTime || undefined}
                    onChange={(v) => patchDateTime({ orderStartTime: v })}
                    placeholder="選擇時間"
                    options={timeOptions}
                  />
                </div>
                <p className="field-hint">
                  請確認該日期的營業時間是否有開放・
                  <Button type="link" size="small" onClick={setOrderStartNow}>
                    設為現在
                  </Button>
                </p>
              </div>
            </div>
          )}
          {canHaveEndTime && (
            <div className="field">
              <label>接單截止時間</label>
              <div className="datetime-inputs">
                <DatePicker
                  value={dateTime.orderEndDate ? dayjs(dateTime.orderEndDate) : null}
                  onChange={(d) => patchDateTime({ orderEndDate: d ? d.format('YYYY-MM-DD') : '' })}
                  placeholder="選擇日期"
                />
                <Select
                  value={dateTime.orderEndTime || undefined}
                  onChange={(v) => patchDateTime({ orderEndTime: v })}
                  placeholder="選擇時間"
                  options={timeOptions}
                />
              </div>
            </div>
          )}

          {form.status !== 'DRAFT' && (
            <Steps
              size="small"
              style={{ marginTop: 14 }}
              current={form.status === 'CLOSED' ? 3 : timelineActive}
              items={[
                {
                  title: '接單',
                  description: dateTime.orderStartDate
                    ? `${dateTime.orderStartDate} ${dateTime.orderStartTime}`
                    : undefined,
                },
                {
                  title: '結單',
                  description: dateTime.orderEndDate
                    ? `${dateTime.orderEndDate} ${dateTime.orderEndTime}`
                    : undefined,
                },
                {
                  title: '取貨日',
                  description: form.schedule_date || undefined,
                },
              ]}
            />
          )}
        </div>

        <div className="editor-section">
          <div className="venue-header">
            <div>
              <div className="section-title">巡迴場地</div>
              <div className="section-note">走出工作室、到外地販售時填寫</div>
            </div>
            <Switch checked={enableVenue} onChange={handleVenueToggle} />
          </div>

          {enableVenue && (
            <>
              <div className="field-row venue-row">
                <div className="field">
                  <label>場次名稱</label>
                  <Input
                    value={form.venue_name}
                    onChange={(e) => patchForm({ venue_name: e.target.value })}
                    placeholder="例：嘉義場、員林場"
                  />
                </div>
                <div className="field">
                  <label>販售地址</label>
                  <Input
                    value={form.venue_address}
                    onChange={(e) => patchForm({ venue_address: e.target.value })}
                    placeholder="例：嘉義市某街某號"
                  />
                </div>
              </div>
              <div className="field">
                <label>販售時間區間</label>
                <div className="datetime-inputs">
                  <Select
                    value={form.venue_start || undefined}
                    onChange={(v) => patchForm({ venue_start: v })}
                    placeholder="開始時間"
                    options={venueTimeOptions}
                  />
                  <span className="time-sep">—</span>
                  <Select
                    value={form.venue_end || undefined}
                    onChange={(v) => patchForm({ venue_end: v })}
                    placeholder="結束時間"
                    options={venueTimeOptions.filter((o) => !form.venue_start || o.value >= form.venue_start)}
                  />
                </div>
              </div>

              {form.venue_name && (
                <div className="venue-preview">
                  <i className="bx bx-map-pin"></i>
                  <span>
                    <b>{form.venue_name}</b>
                    {form.venue_address && <> · {form.venue_address}</>}
                    {form.venue_start && form.venue_end && (
                      <>
                        {' '}
                        · {form.venue_start}–{form.venue_end}
                      </>
                    )}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="editor-section">
          <div className="section-title">今日出爐產品</div>
          <div className="section-note">不設上限則任意數量皆可下單</div>
          <div className="section-content">
            <div className="field-row add-row">
              <SelectProduct
                ref={selectProductRef}
                className="product-select"
                value={selectedProductId}
                onChange={handleSelectProduct}
                excludeIds={excludeProductIds}
              />
            </div>

            {form.items.length === 0 ? (
              <div className="empty-products">尚未新增產品</div>
            ) : (
              <div className="product-list">
                {form.items.map((item) => (
                  <div key={item.product_id} className="product-item">
                    <div className="product-name">{item.product_name}</div>
                    <div className="product-limit">
                      {item.sales_limit === null ? (
                        <>
                          <span className="limit-badge">不限量</span>
                          <Button size="small" onClick={() => updateItemLimit(item.product_id, 1)}>
                            設上限
                          </Button>
                        </>
                      ) : (
                        <>
                          <Space.Compact>
                            <Button
                              icon={<MinusOutlined />}
                              onClick={() =>
                                updateItemLimit(item.product_id, Math.max(1, (item.sales_limit || 1) - 1))
                              }
                            />
                            <InputNumber
                              value={item.sales_limit}
                              min={1}
                              controls={false}
                              style={{ width: 56 }}
                              onChange={(v) => updateItemLimit(item.product_id, v)}
                            />
                            <Button
                              icon={<PlusOutlined />}
                              onClick={() => updateItemLimit(item.product_id, (item.sales_limit || 0) + 1)}
                            />
                          </Space.Compact>
                          <Button size="small" onClick={() => updateItemLimit(item.product_id, null)}>
                            不限量
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      shape="circle"
                      size="small"
                      onClick={() => removeProduct(item.product_id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
