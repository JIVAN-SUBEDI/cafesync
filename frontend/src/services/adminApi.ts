import axios from "axios";

let url;
if (process.env.NEXT_PUBLIC_STATE === "production") {
  url = process.env.NEXT_PUBLIC_PRO_BASE_URL;
} else {
  url = process.env.NEXT_PUBLIC_BASE_URL;
}

export const adminApi = axios.create({
  baseURL: url,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

let isRefreshingAdmin = false;
let adminQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processAdminQueue = (error: any = null) => {
  adminQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve();
  });
  adminQueue = [];
};

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    const skipRoutes = [
      "/api/auth/admin/login",
      "/api/auth/admin/refresh",
      "/api/auth/admin/logout",
    ];

    const shouldSkip = skipRoutes.some((route) => requestUrl.includes(route));
    if (shouldSkip) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshingAdmin) {
        return new Promise((resolve, reject) => {
          adminQueue.push({ resolve, reject });
        })
          .then(() => adminApi(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshingAdmin = true;

      try {
        await adminApi.post("/api/auth/admin/refresh", {}, { withCredentials: true });
        processAdminQueue();
        return adminApi(originalRequest);
      } catch (refreshError) {
        processAdminQueue(refreshError);

        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshingAdmin = false;
      }
    }

    return Promise.reject(error);
  }
);