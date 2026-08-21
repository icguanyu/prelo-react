import request from './index';

export const Auth = {
  Login: (data) => request.post('/auth/login', data),
  Register: (data) => request.post('/auth/register', data),
  Me: () => request.get('/auth/me'),
};

export const Users = {
  Me: () => request.get('/users/me'),
  Put: (data) => request.put('/users/me', data),
  UploadAvatar: (formData) => request.post('/UploadAvatar', formData),
  UploadCover: (formData) => request.post('/UploadCover', formData),
  BindLine: (lineUserId) => request.put('/users/me/line', { lineUserId }),
  UnbindLine: () => request.delete('/users/me/line'),
};
