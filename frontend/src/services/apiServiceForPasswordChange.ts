import axios from "axios";
let url;
if (process.env.NEXT_PUBLIC_STATE === "production") {
  url = process.env.NEXT_PUBLIC_PRO_BASE_URL;
} else {
  url = process.env.NEXT_PUBLIC_BASE_URL;
}
export const api = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
      // baseURL: "https://cafe-management-system-b9fa.onrender.com",
          baseURL: url,


  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

export function getApiError(err: any, fallback = "Request failed") {
  return err?.response?.data?.message || err?.message || fallback;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log("Interceptor caught error:", {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    const shouldSkipRefresh =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/api/hotel/auth/');

    if (shouldSkipRefresh) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Refreshing session...");
        await api.post("api/hotel/refresh");

        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path.startsWith('/admin')) {
            window.location.href = '/admin/login?session=expired';
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);