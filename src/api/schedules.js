import request from './index';

export const Schedules = {
  Create: (data) => request.post('/schedules', data),
  GetByDate: (date) => request.get(`/schedules/${date}`),
  GetByMonth: (month) => request.get(`/schedules/month/${month}`),
  Update: (id, data) => request.put(`/schedules/${id}`, data),
  Delete: (id) => request.delete(`/schedules/${id}`),
};
