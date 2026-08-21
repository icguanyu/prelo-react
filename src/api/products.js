import request from './index';

export const UploadFile = {
  Upload: (formData) => request.post('/UploadFile', formData),
};

export const Products = {
  List: (data) => request.post('/products/list', data),
  GetById: (id) => request.get(`/products/${id}`),
  Create: (data) => request.post('/products', data),
  Update: (id, data) => request.put(`/products/${id}`, data),
  Delete: (id) => request.delete(`/products/${id}`),
};

export const ProductCategory = {
  List: (data) => request.post('/product-categories/list', data),
  GetById: (id) => request.get(`/product-categories/${id}`),
  Create: (data) => request.post('/product-categories', data),
  Update: (id, data) => request.put(`/product-categories/${id}`, data),
  Delete: (id) => request.delete(`/product-categories/${id}`),
};
