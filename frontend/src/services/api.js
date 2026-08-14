import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fh_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("fh_token");
      localStorage.removeItem("fh_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:                (data)         => api.post("/auth/register", data),
  login:                   (data)         => api.post("/auth/login", data),
  googleAuth:              (data)         => api.post("/auth/google", data),   // ← new
  getMe:                   ()             => api.get("/auth/me"),
  updateProfile:           (data)         => api.put("/auth/profile", data),
  changePassword:          (data)         => api.put("/auth/change-password", data),
  forgotPassword:          (data)         => api.post("/auth/forgot-password", data),
  resetPassword:           (token, data)  => api.put(`/auth/reset-password/${token}`, data),
  getNotifications:        ()             => api.get("/auth/notifications"),
  markNotificationRead:    (id)           => api.put(`/auth/notifications/${id}/read`),
  markAllNotificationsRead: ()            => api.put("/auth/notifications/read-all"),
  deleteNotification:      (id)           => api.delete(`/auth/notifications/${id}`),
  deleteAllNotifications:  ()             => api.delete("/auth/notifications/all"),
};

export const restaurantAPI = {
  getAll:          (params)     => api.get("/restaurants", { params }),
  getOne:          (id)         => api.get(`/restaurants/${id}`),
  getMyRestaurant: ()           => api.get("/restaurants/my-restaurant"),
  create:          (data)       => api.post("/restaurants", data),
  update:          (id, data)   => api.put(`/restaurants/${id}`, data),
  getAllAdmin:      ()           => api.get("/restaurants/admin/all"),
  approve:         (id, data)   => api.put(`/restaurants/${id}/approve`, data),
};

export const menuAPI = {
  getItems: (restaurantId, params) => api.get(`/menu/${restaurantId}`, { params }),
  create:   (restaurantId, data)   => api.post(`/menu/${restaurantId}`, data),
  update:   (id, data)             => api.put(`/menu/item/${id}`, data),
  delete:   (id)                   => api.delete(`/menu/item/${id}`),
  toggle:   (id)                   => api.put(`/menu/item/${id}/toggle`),
};

export const orderAPI = {
  place:               (data)             => api.post("/orders", data),
  getMyOrders:         (params)           => api.get("/orders/my-orders", { params }),
  getOne:              (id)               => api.get(`/orders/${id}`),
  updateStatus:        (id, data)         => api.put(`/orders/${id}/status`, data),
  getRestaurantOrders: (restaurantId, params) => api.get(`/orders/restaurant/${restaurantId}`, { params }),
  cancel:              (id)               => api.put(`/orders/${id}/cancel`),
  confirmDelivery:     (id)               => api.put(`/orders/${id}/confirm-delivery`),
  rate:                (id, data)         => api.put(`/orders/${id}/rate`, data),
  getAllAdmin:          (params)           => api.get("/orders/admin/all", { params }),
  hide:                (id)               => api.delete(`/orders/${id}/hide`),
};

export const paymentAPI = {
  createIntent: (data) => api.post("/payments/create-intent", data),
  confirm:      (data) => api.post("/payments/confirm", data),
  refund:       (data) => api.post("/payments/refund", data),
};

export const uploadAPI = {
  // formData must be a FormData object with the file appended as "image"
  image: (formData) => api.post("/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

export const adminAPI = {
  getStats:         ()       => api.get("/admin/stats"),
  getPublicStats:   ()       => api.get("/admin/public-stats"),
  getUsers:         (params) => api.get("/admin/users", { params }),
  toggleUser:       (id)     => api.put(`/admin/users/${id}/toggle`),
  sendNotification: (data)   => api.post("/admin/notifications/send", data),
};

export const driverAPI = {
  getAvailable:    ()                  => api.get("/driver/available"),
  getMyDeliveries: ()                  => api.get("/driver/my-deliveries"),
  getHistory:      (params)            => api.get("/driver/history", { params }),
  hideHistory:     (orderId)           => api.post(`/driver/history/${orderId}/hide`),
  acceptDelivery:  (orderId)           => api.put(`/driver/accept/${orderId}`),
  markDelivered:   (orderId)           => api.put(`/driver/deliver/${orderId}`),
  getStats:        ()                  => api.get("/driver/stats"),
  listDrivers:     ()                  => api.get("/driver/list"),
  notifyDriver:    (orderId, driverId) => api.post(`/driver/notify/${orderId}`, { driverId }),
};



export const analyticsAPI = {
  getRestaurant: () => api.get("/analytics/restaurant"),
};

export const tableAPI = {
  getAvailable: (restaurantId) => api.get(`/tables/${restaurantId}/available`),
  getAll:       (restaurantId) => api.get(`/tables/${restaurantId}`),
};

export const collectionAPI = {
  getAll:  (restaurantId)      => api.get(`/collections/${restaurantId}`),
  create:  (restaurantId, data)=> api.post(`/collections/${restaurantId}`, data),
  update:  (id, data)          => api.put(`/collections/${id}`, data),
  delete:  (id)                => api.delete(`/collections/${id}`),
  getPublic: (restaurantId)    => api.get(`/collections/${restaurantId}`),
};

export default api;