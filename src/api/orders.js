import request from './index';

export const Orders = {
  Create: (data) => request.post('/orders', data),
  List: (data) => request.post('/orders/list', data),
  GetById: (id) => request.get(`/orders/${id}`),
  Update: (id, data) => request.put(`/orders/${id}`, data),
  UpdateStatus: (id, data) => request.put(`/orders/${id}/status`, data),
  Delete: (id) => request.delete(`/orders/${id}`),
};
