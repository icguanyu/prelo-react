import request from './index';

export const Shop = {
  GetInfo: (slug) => request.get(`/shop/${slug}`),
  GetSchedules: (slug, params) => request.get(`/shop/${slug}/schedules`, { params }),
  GetScheduleByDate: (slug, date) => request.get(`/shop/${slug}/schedules/${date}`),
  CreateOrder: (slug, data) => request.post(`/shop/${slug}/orders`, data),
  GetOrder: (slug, orderNo, phone) =>
    request.get(`/shop/${slug}/orders/${orderNo}`, { params: { phone } }),
  GetOrdersByPhone: (slug, phone) =>
    request.get(`/shop/${slug}/orders`, { params: { phone } }),
  GetCategories: (slug) => request.get(`/shop/${slug}/categories`),
  GetProducts: (slug, params) => request.get(`/shop/${slug}/products`, { params }),
};
