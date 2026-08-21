import { create } from 'zustand';
import axios from 'axios';
import { Auth, Users } from '../api/auth';

const TOKEN_KEY = 'prelo-token';
const USER_KEY = 'prelo-user';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: readStoredUser(),
  isLoading: false,

  setToken: (value) => {
    localStorage.setItem(TOKEN_KEY, value);
    axios.defaults.headers.common['Authorization'] = `Bearer ${value}`;
    set({ token: value });
  },

  setUser: (userObj) => {
    if (userObj) {
      localStorage.setItem(USER_KEY, JSON.stringify(userObj));
    } else {
      localStorage.removeItem(USER_KEY);
    }
    set({ user: userObj });
  },

  fetchUser: async () => {
    try {
      const res = await Users.Me();
      get().setUser(res.data);
    } catch (error) {
      get().setUser(null);
      console.error('fetch user error:', error);
    }
  },

  register: async ({ name, email, password }) => {
    if (get().isLoading) return null;
    set({ isLoading: true });
    try {
      const res = await Auth.Register({ name, email, password });
      const newToken = res.data?.token;
      if (newToken) {
        get().setToken(newToken);
        await get().fetchUser();
      }
      return newToken || null;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    if (get().isLoading) return null;
    set({ isLoading: true });
    try {
      const res = await Auth.Login({ email, password });
      const newToken = res.data.token;
      if (!newToken) {
        throw new Error('登入失敗，未取得 token');
      }
      get().setToken(newToken);
      await get().fetchUser();
      return newToken;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common['Authorization'];
    get().setUser(null);
    set({ token: '' });
  },
}));
