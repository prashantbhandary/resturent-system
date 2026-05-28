import axios from 'axios';
import { storage } from './storage.js';

const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err.response?.status === 401) {
      storage.setToken(null);
      storage.setUser(null);
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const menuApi = {
  getMenu: () => api.get('/menu'),
};

export const orderApi = {
  create: (data) => api.post('/orders', data),
  getForTable: (table_id) => api.get(`/orders/table/${table_id}`),
  getOrder: (id) => api.get(`/orders/${id}`),
};

export const kitchenApi = {
  list: () => api.get('/kitchen/orders'),
  setOrderStatus: (order_id, status) =>
    api.patch(`/kitchen/orders/${order_id}/status`, { status }),
  setItemStatus: (order_id, item_id, status) =>
    api.patch(`/kitchen/orders/${order_id}/items/${item_id}/status`, { status }),
};

export const billingApi = {
  requestBill: (order_id) => api.post(`/billing/request-bill/${order_id}`),
  pending: () => api.get('/billing/pending'),
  getBill: (bill_id) => api.get(`/billing/${bill_id}`),
  pay: (bill_id, method) => api.post(`/billing/${bill_id}/payment`, { method }),
  receipt: (bill_id) => api.get(`/billing/${bill_id}/receipt`),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  // menu items
  listItems: () => api.get('/admin/menu/items'),
  createItem: (data) => api.post('/admin/menu/items', data),
  updateItem: (id, data) => api.put(`/admin/menu/items/${id}`, data),
  deleteItem: (id) => api.delete(`/admin/menu/items/${id}`),
  listCategories: () => api.get('/admin/menu/categories'),
  createCategory: (data) => api.post('/admin/menu/categories', data),
  updateCategory: (id, data) => api.put(`/admin/menu/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/menu/categories/${id}`),
  // tables
  listTables: () => api.get('/admin/tables'),
  createTable: (data) => api.post('/admin/tables', data),
  updateTable: (id, data) => api.put(`/admin/tables/${id}`, data),
  deleteTable: (id) => api.delete(`/admin/tables/${id}`),
  qrCode: (id, origin) =>
    api.get(`/admin/tables/${id}/qr-code`, { params: { origin } }),
  // sales
  dailySales: () => api.get('/admin/sales/daily'),
  weeklySales: () => api.get('/admin/sales/weekly'),
  // staff
  listStaff: () => api.get('/admin/staff'),
  createStaff: (data) => api.post('/admin/staff', data),
  updateStaff: (id, data) => api.put(`/admin/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),
};
