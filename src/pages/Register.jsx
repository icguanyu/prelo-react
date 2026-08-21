import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, App } from 'antd';
import { useAuthStore } from '../stores/authStore';
import FooterBar from '../components/FooterBar';
import logo from '../assets/logo.png';
import './Register.css';

const features = [
  {
    title: '預購排程管理',
    desc: '設定開放日期、每日數量上限，系統自動幫你管控',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="14" x2="8" y2="14" />
        <line x1="12" y1="14" x2="12" y2="14" />
        <line x1="8" y1="18" x2="8" y2="18" />
        <line x1="12" y1="18" x2="12" y2="18" />
      </svg>
    ),
  },
  {
    title: '商品菜單',
    desc: '上架品項、設定規格與價格，隨時調整',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3.5" cy="6" r="1" />
        <circle cx="3.5" cy="12" r="1" />
        <circle cx="3.5" cy="18" r="1" />
      </svg>
    ),
  },
  {
    title: '客人自助下單',
    desc: '專屬連結發出去，客人自己選日期、選商品、送出訂單',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleFinish = async ({ shopName, email, password }) => {
    try {
      const token = await register({ name: shopName, email, password });
      if (token) {
        message.success('開店成功，歡迎加入！');
        navigate('/shop');
      } else {
        message.success('註冊成功，請登入');
        navigate('/login');
      }
    } catch {
      // 錯誤訊息由 API 攔截器統一顯示
    }
  };

  return (
    <div className="register-page-wrap">
      <div className="register-page">
        <aside className="brand">
          <div className="brand__inner">
            <Link to="/" className="brand__logo">
              <img src={logo} alt="Prelo" />
            </Link>

            <div className="brand__eyebrow">鋪樂｜小店家最愛・預購訂單管理工具</div>
            <div className="brand__headline">
              客人自助下單
              <br />
              你輕鬆接單
            </div>
            <p className="brand__sub">
              不用再 LINE 來 LINE 去
              <br />5 分鐘建立你的專屬訂購頁
            </p>

            <ul className="features">
              {features.map((f) => (
                <li key={f.title} className="feature">
                  <span className="feature__icon">{f.icon}</span>
                  <div>
                    <div className="feature__title">{f.title}</div>
                    <div className="feature__desc">{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="brand__footer">免費使用，隨時可以取消</div>
          </div>
        </aside>

        <main className="form-col">
          <div className="form-wrap">
            <div className="form-header">
              <h1 className="form-title">建立店家帳號</h1>
              <p className="form-sub">
                已有帳號？
                <Link to="/login" className="form-sub__link">
                  登入
                </Link>
              </p>
            </div>

            <Form
              className="register-form"
              layout="vertical"
              onFinish={handleFinish}
              disabled={isLoading}
            >
              <Form.Item
                label="店名"
                name="shopName"
                rules={[
                  { required: true, message: '請輸入店名' },
                  { min: 2, message: '店名至少 2 個字元' },
                ]}
              >
                <Input placeholder="例：我家烘焙坊" size="large" autoComplete="organization" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: '請輸入 Email' },
                  { type: 'email', message: 'Email 格式不正確' },
                ]}
              >
                <Input placeholder="your@email.com" size="large" autoComplete="email" />
              </Form.Item>

              <div className="form-row">
                <Form.Item
                  label="密碼"
                  name="password"
                  rules={[
                    { required: true, message: '請輸入密碼' },
                    { min: 8, message: '密碼至少 8 個字元' },
                  ]}
                >
                  <Input.Password
                    placeholder="至少 8 個字元"
                    size="large"
                    autoComplete="new-password"
                  />
                </Form.Item>

                <Form.Item
                  label="確認密碼"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '請再次輸入密碼' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || value === getFieldValue('password')) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('兩次輸入的密碼不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder="再輸入一次"
                    size="large"
                    autoComplete="new-password"
                  />
                </Form.Item>
              </div>

              <Button
                className="submit-btn"
                type="primary"
                size="large"
                htmlType="submit"
                loading={isLoading}
              >
                免費開始使用
              </Button>

              <p className="form-terms">
                點擊「免費開始使用」即表示同意
                <Link to="/terms">服務條款</Link>與
                <Link to="/privacy">隱私權政策</Link>。
              </p>
              <p className="form-disclaimer">
                Prelo
                目前免費開放使用，功能持續更新中。服務內容或收費政策日後可能調整；因系統因素造成之損失，本平台恕不負責。
              </p>
            </Form>
          </div>
        </main>
      </div>
      <FooterBar />
    </div>
  );
}
