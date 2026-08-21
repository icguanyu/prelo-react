import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigate } from '../api';

// 讓 src/api/index.js 的攔截器可以在 401 時導頁（對應 Vue 版直接 import router 呼叫 router.push）
export default function NavSync() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return null;
}
