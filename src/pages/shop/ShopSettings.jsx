import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import {
  Segmented,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Switch,
  Divider,
  Button,
  Spin,
  App,
} from 'antd';
import {
  WarningOutlined,
  LinkOutlined,
  ShareAltOutlined,
  EnvironmentOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { Users } from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';
import lineQr from '../../assets/logo.png';
import './ShopSettings.css';

const paymentOptions = [{ label: '現金', value: 'cash' }];
const pickupOptions = [{ label: '自取/面交', value: 'pickup' }];

const defaultBusinessHours = [
  { day: 0, enabled: false, time: ['10:00', '16:00'] },
  { day: 1, enabled: false, time: ['09:00', '18:00'] },
  { day: 2, enabled: false, time: ['09:00', '18:00'] },
  { day: 3, enabled: false, time: ['09:00', '18:00'] },
  { day: 4, enabled: false, time: ['09:00', '18:00'] },
  { day: 5, enabled: false, time: ['09:00', '18:00'] },
  { day: 6, enabled: false, time: ['10:00', '16:00'] },
];

const defaultForm = {
  avatar: '',
  cover: '',
  shopName: '',
  shopSlug: '',
  owner: '',
  phone: '',
  email: '',
  address: '',
  intro: '',
  orderPickupTime: '14:00',
  paymentMethods: ['cash'],
  pickupMethods: [],
  shipping: { freeThreshold: null, fee: null, note: '' },
  packaging: { defaultPack: '紙袋', packFee: 5, ecoDiscount: 10, note: '歡迎自備容器，享環保折扣。' },
  businessHours: [...defaultBusinessHours],
  lineUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  lineUserId: null,
};

const dayLabelMap = { 0: '日', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六' };
const dayNumberMap = { 日: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };

function normalizeBusinessHours(hours) {
  if (!Array.isArray(hours) || hours.length === 0) {
    return [...defaultBusinessHours];
  }
  return hours.map((row) => {
    const numericDay = typeof row.day === 'number' ? row.day : dayNumberMap[row.day];
    const normalizedDay =
      Number.isInteger(numericDay) && numericDay >= 0 && numericDay <= 6 ? numericDay : 0;
    return { ...row, day: normalizedDay };
  });
}

function generateTimeOptions(start, end, stepMinutes) {
  const options = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let minutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  while (minutes <= endMinutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    const value = `${h}:${m}`;
    options.push({ label: value, value });
    minutes += stepMinutes;
  }
  return options;
}

const pickupTimeOptions = generateTimeOptions('06:00', '22:00', 30);
const hoursTimeOptions = generateTimeOptions('00:00', '23:30', 30);

const lineBotUrl = import.meta.env.VITE_LINE_BOT_URL || 'https://line.me';

export default function ShopSettings() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const authStore = useAuthStore();

  const [form, setForm] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(false);
  const [segment, setSegment] = useState('basic');

  const [lineInputId, setLineInputId] = useState('');
  const [lineBinding, setLineBinding] = useState(false);

  const [coverLoading, setCoverLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const res = await Users.Me();
        if (res.data) {
          setForm((f) => ({
            ...f,
            ...res.data,
            businessHours: normalizeBusinessHours(res.data.businessHours),
          }));
        }
      } catch (error) {
        message.error('無法載入用戶資訊');
        console.error('fetch user error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slugError = useMemo(() => {
    const s = form.shopSlug;
    if (!s) return '前台入口網址為必填';
    if (s.length < 2) return '至少需要 2 個字元';
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s))
      return '只允許小寫英文、數字，可用連字號(-)，但不能開頭或結尾';
    return '';
  }, [form.shopSlug]);

  const slugUrl = useMemo(
    () => (form.shopSlug ? `${window.location.origin}/s/${form.shopSlug}` : ''),
    [form.shopSlug],
  );

  const onSlugInput = (e) => {
    patchForm({ shopSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
  };

  const copySlugUrl = () => {
    if (!slugUrl) return;
    navigator.clipboard.writeText(slugUrl).then(() => message.success('已複製入口網址'));
  };

  const openSlugUrl = () => {
    if (!slugUrl) return;
    window.open(slugUrl, '_blank');
  };

  const formatDayLabel = (day) => dayLabelMap[day] ?? day;

  const toggleAllWeekday = (enabled) => {
    patchForm({ businessHours: form.businessHours.map((row) => ({ ...row, enabled })) });
  };

  const updateBusinessHourRow = (idx, patch) => {
    patchForm({
      businessHours: form.businessHours.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    });
  };

  const compressAndUpload = async (file, uploadFn) => {
    const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920 });
    const fd = new FormData();
    fd.append('file', compressed);
    const res = await uploadFn(fd);
    return res.data.url;
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverLoading(true);
    try {
      patchForm({ cover: await compressAndUpload(file, Users.UploadCover) });
    } catch {
      message.error('封面上傳失敗');
    } finally {
      setCoverLoading(false);
      e.target.value = '';
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      patchForm({ avatar: await compressAndUpload(file, Users.UploadAvatar) });
    } catch {
      message.error('LOGO 上傳失敗');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (slugError) {
      setSegment('basic');
      message.error(slugError);
      return;
    }
    setIsLoading(true);
    try {
      const payload = { ...form, businessHours: normalizeBusinessHours(form.businessHours) };
      await Users.Put(payload);
      await authStore.fetchUser();
      message.success('設定已儲存');
    } catch (error) {
      message.error('儲存設定失敗');
      console.error('save user error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBindLine = async () => {
    setLineBinding(true);
    try {
      await Users.BindLine(lineInputId.trim());
      patchForm({ lineUserId: lineInputId.trim() });
      setLineInputId('');
      message.success('LINE 通知綁定成功');
    } catch {
      // 錯誤已由 axios interceptor 顯示
    } finally {
      setLineBinding(false);
    }
  };

  const handleUnbindLine = () => {
    modal.confirm({
      title: '解除 LINE 通知',
      content: '解除後將不再收到新訂單通知，確定嗎？',
      okText: '確定解除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setLineBinding(true);
        try {
          await Users.UnbindLine();
          patchForm({ lineUserId: null });
          message.success('已解除 LINE 通知綁定');
        } catch {
          // 錯誤已由 axios interceptor 顯示
        } finally {
          setLineBinding(false);
        }
      },
    });
  };

  const handleLogout = () => {
    modal.confirm({
      title: '登出確認',
      content: '確定要登出嗎？',
      okText: '確定',
      cancelText: '取消',
      onOk: () => {
        authStore.logout();
        message.success('已登出');
        navigate('/');
      },
    });
  };

  return (
    <div className="settings-manager">
      <div className="page-header">
        <div className="header-top">
          <div>
            <h2>設定</h2>
            <p className="subtitle">管理商店基本資訊、付款方式、營業時間與包裝設定</p>
          </div>
        </div>
      </div>

      <div className="segmented">
        <Segmented
          value={segment}
          onChange={setSegment}
          options={[
            { label: '01 基本', value: 'basic' },
            { label: '02 取貨付款', value: 'pay' },
            { label: '03 營業時間', value: 'hours' },
            { label: '04 包裝', value: 'pack' },
            { label: '05 通知', value: 'notify' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="card" style={{ display: segment === 'basic' ? 'block' : 'none' }}>
          <div className="panel">
            <div className="panel__header">
              <span className="badge">01</span>
              <div>
                <p className="label">品牌</p>
                <h3>商店設定</h3>
              </div>
            </div>
            <small className="hint">請填寫商家基本資料，使用者可於前台查看</small>
          </div>

          <div className="card__subtitle">店面預覽</div>
          <div className="store-preview">
            <Spin spinning={coverLoading}>
              <div className="sp-cover" onClick={() => coverInputRef.current?.click()}>
                {form.cover ? (
                  <img src={form.cover} className="sp-cover__img" alt="" />
                ) : (
                  <div className="sp-cover__empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>上傳封面照</span>
                  </div>
                )}
                {form.cover && (
                  <button
                    className="sp-cover__remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      patchForm({ cover: '' });
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </Spin>
            <div className="sp-identity">
              <Spin spinning={avatarLoading}>
                <div className="sp-avatar" onClick={() => avatarInputRef.current?.click()}>
                  {form.avatar ? (
                    <img src={form.avatar} alt="" />
                  ) : (
                    <span className="sp-avatar__fallback">{form.shopName?.[0] ?? '店'}</span>
                  )}
                  <div className="sp-avatar__overlay">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                </div>
              </Spin>
              <p className="sp-name">{form.shopName || '店名'}</p>
              {form.intro && <p className="sp-intro">{form.intro}</p>}
            </div>
          </div>
          <p className="seo-hint">封面與 LOGO 設定後將顯示於搜尋引擎（SEO）</p>
          <input
            ref={coverInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
            onChange={handleCoverUpload}
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />

          <div className="card__subtitle">基本資訊</div>
          <div className="field">
            <label>店名</label>
            <div className="field__content">
              <Input
                value={form.shopName}
                onChange={(e) => patchForm({ shopName: e.target.value })}
                placeholder="輸入店名"
                maxLength={20}
                showCount
              />
              <p className="seo-hint">作為 SEO 網頁標題（&lt;title&gt;）顯示於搜尋結果</p>
            </div>
          </div>
          <div className="field">
            <label>負責人</label>
            <div className="field__content">
              <Input
                value={form.owner}
                onChange={(e) => patchForm({ owner: e.target.value })}
                placeholder="負責人姓名"
                maxLength={20}
                showCount
              />
            </div>
          </div>
          <div className="field">
            <label>電話</label>
            <div className="field__content">
              <Input
                value={form.phone}
                onChange={(e) => patchForm({ phone: e.target.value })}
                placeholder="聯絡電話"
                maxLength={10}
                showCount
              />
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <div className="field__content">
              <Input value={form.email} placeholder="聯絡信箱" maxLength={50} showCount disabled />
            </div>
          </div>
          <div className="field">
            <label>地址</label>
            <div className="field__content">
              <Input
                value={form.address}
                onChange={(e) => patchForm({ address: e.target.value })}
                placeholder="門市地址"
                maxLength={100}
                showCount
              />
            </div>
          </div>
          <div className="field">
            <label>介紹</label>
            <div className="field__content">
              <Input.TextArea
                value={form.intro}
                onChange={(e) => patchForm({ intro: e.target.value })}
                rows={3}
                placeholder="品牌故事、主打品項"
                maxLength={200}
                showCount
              />
              <p className="seo-hint">
                作為 SEO 摘要（meta description）顯示於搜尋結果，建議 50–150 字
              </p>
            </div>
          </div>

          <Divider />
          <div className="card__subtitle">社群連結</div>
          <div className="field">
            <label>LINE</label>
            <div className="field__content">
              <Input
                value={form.lineUrl}
                onChange={(e) => patchForm({ lineUrl: e.target.value })}
                placeholder="https://line.me/..."
                maxLength={200}
              />
            </div>
          </div>
          <div className="field">
            <label>Facebook</label>
            <div className="field__content">
              <Input
                value={form.facebookUrl}
                onChange={(e) => patchForm({ facebookUrl: e.target.value })}
                placeholder="https://facebook.com/..."
                maxLength={200}
              />
            </div>
          </div>
          <div className="field">
            <label>Instagram</label>
            <div className="field__content">
              <Input
                value={form.instagramUrl}
                onChange={(e) => patchForm({ instagramUrl: e.target.value })}
                placeholder="https://instagram.com/..."
                maxLength={200}
              />
            </div>
          </div>

          <Divider />
          <div className="card__subtitle">前台入口</div>
          <div className="field">
            <label>專屬網址 *</label>
            <div className="field__content">
              <div className="slug-wrap">
                <div className="slug-input-row">
                  <span className="slug-prefix">/s/</span>
                  <Input value={form.shopSlug} onChange={onSlugInput} placeholder="your-bakery" maxLength={50} />
                </div>
              </div>
              {slugError ? (
                <div className="slug-msg error">
                  <WarningOutlined />
                  {slugError}
                </div>
              ) : form.shopSlug ? (
                <div className="slug-msg preview">
                  <LinkOutlined />
                  <span className="slug-url">{slugUrl}</span>
                  <Button icon={<ShareAltOutlined />} size="small" onClick={copySlugUrl} />
                  <Button icon={<EnvironmentOutlined />} size="small" onClick={openSlugUrl} />
                </div>
              ) : null}
            </div>
          </div>

          <Divider />
          <div className="field">
            <label>帳號管理</label>
            <div className="field__content">
              <Button type="text" danger size="small" onClick={handleLogout}>
                登出帳號
              </Button>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: segment === 'pay' ? 'block' : 'none' }}>
          <div className="panel">
            <div className="panel__header">
              <span className="badge">02</span>
              <div>
                <p className="label">取貨與付款</p>
                <h3>支付、取貨</h3>
              </div>
            </div>
            <small className="hint">設定取貨方式與接受的付款方式</small>
          </div>

          <div className="field">
            <label>取貨時間</label>
            <div className="field__content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Select
                    value={form.orderPickupTime}
                    onChange={(v) => patchForm({ orderPickupTime: v })}
                    placeholder="開始"
                    options={pickupTimeOptions}
                    style={{ width: 120 }}
                  />
                  <span style={{ whiteSpace: 'nowrap' }}>後，開放取貨</span>
                </div>
                <small className="hint">若未設定，則開放營業時間內均可取貨</small>
              </div>
            </div>
          </div>

          <div className="field">
            <label>付款方式</label>
            <div className="field__content">
              <Checkbox.Group
                value={form.paymentMethods}
                onChange={(v) => patchForm({ paymentMethods: v })}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {paymentOptions.map((item) => (
                    <Checkbox key={item.value} value={item.value} className="chip-checkbox">
                      {item.label}
                    </Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
            </div>
          </div>

          <div className="field">
            <label>取貨方式</label>
            <div className="field__content">
              <Checkbox.Group
                value={form.pickupMethods}
                onChange={(v) => patchForm({ pickupMethods: v })}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {pickupOptions.map((item) => (
                    <Checkbox key={item.value} value={item.value} className="chip-checkbox">
                      {item.label}
                    </Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
            </div>
          </div>

          {form.pickupMethods.includes('delivery') && (
            <div className="shipping-config">
              <div className="field">
                <label>運費</label>
                <div className="field__content">
                  <InputNumber
                    value={form.shipping.fee}
                    onChange={(v) => patchForm({ shipping: { ...form.shipping, fee: v } })}
                    min={0}
                    max={500}
                    precision={0}
                  />
                  <span className="suffix">元</span>
                </div>
              </div>
              <div className="field">
                <label>免運門檻</label>
                <div className="field__content">
                  <InputNumber
                    value={form.shipping.freeThreshold}
                    onChange={(v) => patchForm({ shipping: { ...form.shipping, freeThreshold: v } })}
                    min={0}
                    max={5000}
                    step={100}
                    precision={0}
                  />
                  <span className="suffix">元（設 0 = 不提供免運）</span>
                </div>
              </div>
              <div className="field">
                <label>備註</label>
                <div className="field__content">
                  <Input.TextArea
                    value={form.shipping.note}
                    onChange={(e) => patchForm({ shipping: { ...form.shipping, note: e.target.value } })}
                    rows={2}
                    placeholder="運費說明、配送範圍等"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ display: segment === 'hours' ? 'block' : 'none' }}>
          <div className="panel">
            <div className="panel__header">
              <span className="badge">03</span>
              <div>
                <p className="label">營業</p>
                <h3>營業時間</h3>
              </div>
            </div>
            <small className="hint">門市實際營業時間</small>
          </div>

          <div className="hours-head">
            <span>週一～週日</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="small" type="text" onClick={() => toggleAllWeekday(true)}>
                全開
              </Button>
              <Button size="small" type="text" onClick={() => toggleAllWeekday(false)}>
                全關
              </Button>
            </div>
          </div>
          <div className="hours">
            {form.businessHours.map((row, idx) => (
              <div key={row.day} className="hour-row">
                <Switch checked={row.enabled} onChange={(v) => updateBusinessHourRow(idx, { enabled: v })} />
                <span className="day">週{formatDayLabel(row.day)}</span>
                <Select
                  value={row.time[0]}
                  onChange={(v) => updateBusinessHourRow(idx, { time: [v, row.time[1]] })}
                  disabled={!row.enabled}
                  placeholder="開始"
                  options={hoursTimeOptions}
                />
                <Select
                  value={row.time[1]}
                  onChange={(v) => updateBusinessHourRow(idx, { time: [row.time[0], v] })}
                  disabled={!row.enabled}
                  placeholder="結束"
                  options={hoursTimeOptions}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ display: segment === 'pack' ? 'block' : 'none' }}>
          <div className="panel">
            <div className="panel__header">
              <span className="badge">04</span>
              <div>
                <p className="label">包裝</p>
                <h3>包裝設定</h3>
              </div>
            </div>
            <small className="hint">是否提供包裝選項</small>
          </div>

          <div className="field">
            <label>預設包裝</label>
            <div className="field__content">
              <Input
                value={form.packaging.defaultPack}
                onChange={(e) => patchForm({ packaging: { ...form.packaging, defaultPack: e.target.value } })}
                placeholder="紙袋/紙盒/裸裝"
              />
            </div>
          </div>
          <div className="field">
            <label>包裝費</label>
            <div className="field__content">
              <InputNumber
                value={form.packaging.packFee}
                onChange={(v) => patchForm({ packaging: { ...form.packaging, packFee: v } })}
                min={0}
                max={50}
                precision={0}
              />
              <span className="suffix">元/單</span>
            </div>
          </div>
          <div className="field">
            <label>環保折抵</label>
            <div className="field__content">
              <InputNumber
                value={form.packaging.ecoDiscount}
                onChange={(v) => patchForm({ packaging: { ...form.packaging, ecoDiscount: v } })}
                min={0}
                max={50}
                precision={0}
              />
              <span className="suffix">元/單</span>
            </div>
          </div>
          <div className="field">
            <label>備註</label>
            <div className="field__content">
              <Input.TextArea
                value={form.packaging.note}
                onChange={(e) => patchForm({ packaging: { ...form.packaging, note: e.target.value } })}
                rows={2}
                placeholder="自備餐具優惠、保冷袋租借等"
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ display: segment === 'notify' ? 'block' : 'none' }}>
          <div className="panel">
            <div className="panel__header">
              <span className="badge">05</span>
              <div>
                <p className="label">推播</p>
                <h3>LINE 訂單通知</h3>
              </div>
            </div>
            <small className="hint">新訂單成立時自動推播通知到您的 LINE</small>
          </div>

          {form.lineUserId ? (
            <div className="line-bound">
              <div className="line-bound__status">
                <CheckCircleFilled style={{ color: '#06C755', fontSize: 18 }} />
                <span>已連結 LINE 通知</span>
              </div>
              <div className="line-bound__id">User ID：{form.lineUserId}</div>
              <Button type="text" danger size="small" loading={lineBinding} onClick={handleUnbindLine}>
                解除綁定
              </Button>
            </div>
          ) : (
            <>
              <div className="line-steps">
                <div className="line-step line-step--col">
                  <span className="line-step__num">1</span>
                  <div className="line-step__content">
                    <span>掃描 QR Code 或點擊按鈕加入好友</span>
                    <div className="line-step__actions">
                      <a href={lineBotUrl} target="_blank" rel="noopener noreferrer" className="line-add-btn">
                        <img
                          src="https://scdn.line-apps.com/n/line_add_friends/btn/zh-Hant.png"
                          alt="加入好友"
                          height="36"
                        />
                      </a>
                      <a href={lineBotUrl} target="_blank" rel="noopener noreferrer">
                        <img src={lineQr} alt="LINE QR Code" className="line-qr" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="line-step">
                  <span className="line-step__num">2</span>
                  <span>
                    傳送「<strong>綁定</strong>」給 Bot，Bot 會回覆您的 LINE User ID
                  </span>
                </div>
                <div className="line-step">
                  <span className="line-step__num">3</span>
                  <span>複製 User ID，貼入下方完成綁定</span>
                </div>
              </div>
              <div className="field">
                <label>LINE User ID</label>
                <div className="field__content">
                  <div className="line-input-row">
                    <Input
                      value={lineInputId}
                      onChange={(e) => setLineInputId(e.target.value)}
                      placeholder="Ue1234567890abcdef1234567890abcd"
                      allowClear
                    />
                    <Button
                      type="primary"
                      loading={lineBinding}
                      disabled={!lineInputId.trim()}
                      onClick={handleBindLine}
                    >
                      綁定
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="actions">
        <Button onClick={() => navigate(-1)}>取消</Button>
        <Button type="primary" onClick={handleSave} loading={isLoading}>
          {isLoading ? '儲存中...' : '儲存設定'}
        </Button>
      </div>
    </div>
  );
}
