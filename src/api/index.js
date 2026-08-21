import axios from 'axios';
import { message, Modal } from 'antd';

// Vue 版：import router from '@/router' 然後 router.push('/login')
// React 版：把 navigate 函式存在這裡，由 App.jsx 呼叫 setNavigate 注入
let navigate = null;
export function setNavigate(fn) {
  navigate = fn;
}

const token = localStorage.getItem('prelo-token');
if (token) {
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
}
axios.defaults.baseURL = import.meta.env.VITE_APIURL;

let isShowAlert = false;

axios.interceptors.response.use(
  (response) => {
    isShowAlert = false;
    return response;
  },
  (err) => {
    if (err?.response) {
      if (err.response.status === 401) {
        localStorage.removeItem('prelo-token');
        delete axios.defaults.headers.common['Authorization'];
        navigate?.('/login');
        return Promise.reject(err);
      }
      const errorMessage = err.response.data?.message || '發生錯誤，請重試';
      const errorType = err.response.status >= 500 ? 'error' : 'warning';
      message[errorType](errorMessage);
    } else {
      if (!isShowAlert) {
        Modal.warning({
          title: '連線異常',
          content: '系統連線異常，若持續出現此訊息請先聯絡「網路管理員」或「後端工程師」',
          okText: '了解',
        });
        isShowAlert = true;
      }
    }
    return Promise.reject(err);
  },
);

const request = {
  get: (url, params) => axios.get(url, params),
  post: (url, data = {}, config) => axios.post(url, data, config),
  delete: (url, data = {}) => axios.delete(url, data),
  put: (url, data = {}) => axios.put(url, data),
  patch: (url, data = {}) => axios.patch(url, data),
};

export default request;
