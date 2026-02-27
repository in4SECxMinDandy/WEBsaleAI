import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || 'http://localhost:8001';

// ─── Main API Client ──────────────────────────────────────
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── ML Service Client ────────────────────────────────────
export const mlApi = axios.create({
  baseURL: ML_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor (attach JWT) ─────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response Interceptor (auto refresh token) ────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/api/auth/refresh-token`, {
          refreshToken,
        });

        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── API Functions ────────────────────────────────────────

// Auth
export const authApi = {
  register: (data: { email: string; password: string; fullName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: Partial<{ fullName: string; phone: string; avatarUrl: string }>) =>
    api.put('/auth/me', data),
};

// Products
export const productsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/products', { params }),
  getBySlug: (slug: string) =>
    api.get(`/products/${slug}`),
  getReviews: (id: string, params?: Record<string, unknown>) =>
    api.get(`/products/${id}/reviews`, { params }),
};

// Categories
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getProducts: (slug: string, params?: Record<string, unknown>) =>
    api.get(`/categories/${slug}/products`, { params }),
};

// Cart
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (data: { productId: string; variantId?: string; quantity?: number }) =>
    api.post('/cart/items', data),
  updateItem: (id: string, quantity: number) =>
    api.put(`/cart/items/${id}`, { quantity }),
  removeItem: (id: string) =>
    api.delete(`/cart/items/${id}`),
  clear: () => api.delete('/cart'),
};

// Orders
export const ordersApi = {
  create: (data: Record<string, unknown>) =>
    api.post('/orders', data),
  getAll: (params?: Record<string, unknown>) =>
    api.get('/orders', { params }),
  getById: (id: string) =>
    api.get(`/orders/${id}`),
  cancel: (id: string) =>
    api.put(`/orders/${id}/cancel`),
};

// Recommendations
export const recommendationsApi = {
  forYou: (params?: { limit?: number; category?: string }) =>
    api.get('/recommendations/for-you', { params }),
  similar: (productId: string, limit?: number) =>
    api.get(`/recommendations/similar/${productId}`, { params: { limit } }),
  trending: (params?: { category?: string; limit?: number }) =>
    api.get('/recommendations/trending', { params }),
  trackClick: (data: { productId: string; strategy: string; sessionId: string }) =>
    api.post('/recommendations/click', data),
};

// Events
export const eventsApi = {
  track: (data: {
    sessionId: string;
    eventType: string;
    productId?: string;
    categoryId?: string;
    eventData?: Record<string, unknown>;
  }) => api.post('/events/track', data),
};

// Admin
export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getTopProducts: () => api.get('/admin/dashboard/top-products'),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getProducts: (params?: Record<string, unknown>) => api.get('/admin/products', { params }),
  createProduct: (data: Record<string, unknown>) => api.post('/admin/products', data),
  updateProduct: (id: string, data: Record<string, unknown>) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  getOrders: (params?: Record<string, unknown>) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, data: { status: string; trackingNumber?: string }) =>
    api.put(`/admin/orders/${id}/status`, data),
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  getMLModels: () => api.get('/admin/ml/models'),
  triggerRetrain: () => api.post('/admin/ml/retrain'),
  getMLMetrics: () => api.get('/admin/ml/metrics'),
  getRecommendationLogs: (days?: number) =>
    api.get('/admin/ml/recommendation-logs', { params: { days } }),
};
