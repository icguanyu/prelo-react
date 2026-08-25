import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, App } from 'antd';
import { useAuthStore } from '../stores/authStore';
import FooterBar from '../components/FooterBar';
import logo from '../assets/logo.png';
import './Login.scss';

const REMEMBER_KEY = 'prelo-remember-email';

export default function Login() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const savedEmail = localStorage.getItem(REMEMBER_KEY);
  const [rememberMe, setRememberMe] = useState(!!savedEmail);

  const handleFinish = async ({ email, password }) => {
    try {
      await login({ email, password });
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      navigate('/shop');
    } catch (err) {
      message.error(err.response?.data?.message ?? '登入失敗');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <img src={logo} alt="Prelo" />
        </div>
        <h2 className="login-title">商家入口</h2>
        <p className="login-subtitle">請輸入您的帳號與密碼</p>

        <Form
          className="login-form"
          layout="vertical"
          initialValues={{ email: savedEmail ?? '' }}
          onFinish={handleFinish}
          disabled={isLoading}
        >
          <Form.Item
            label="帳號"
            name="email"
            rules={[{ required: true, message: '請輸入帳號' }]}
          >
            <Input placeholder="輸入電子郵件" autoComplete="username" size="large" />
          </Form.Item>
          <Form.Item
            label="密碼"
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password
              placeholder="輸入密碼"
              autoComplete="current-password"
              size="large"
            />
          </Form.Item>
          <div className="login-remember">
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            >
              記住帳號
            </Checkbox>
          </div>
          <Button
            className="login-submit"
            type="primary"
            size="large"
            htmlType="submit"
            loading={isLoading}
          >
            {isLoading ? '登入中...' : '登入'}
          </Button>
        </Form>
      </div>
      <FooterBar />
    </div>
  );
}
