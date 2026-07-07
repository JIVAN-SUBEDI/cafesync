import axios from "axios";

let url;
if (process.env.NEXT_PUBLIC_STATE === "production") {
  url = process.env.NEXT_PUBLIC_PRO_BASE_URL;
} else {
  url = process.env.NEXT_PUBLIC_BASE_URL;
}

export const hotelApi = axios.create({
  baseURL: url,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

let isRefreshingHotel = false;
let hotelQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processHotelQueue = (error: any = null) => {
  hotelQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve();
  });
  hotelQueue = [];
};

hotelApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    const skipRoutes = [
      "/api/hotel/login",
      "/api/hotel/register",
      "/api/hotel/refresh",
      "/api/hotel/logout",
    ];

    const shouldSkip = skipRoutes.some((route) => requestUrl.includes(route));
    if (shouldSkip) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshingHotel) {
        return new Promise((resolve, reject) => {
          hotelQueue.push({ resolve, reject });
        })
          .then(() => hotelApi(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshingHotel = true;

      try {
        await hotelApi.post("/api/hotel/refresh", {}, { withCredentials: true });
        processHotelQueue();
        return hotelApi(originalRequest);
      } catch (refreshError) {
        processHotelQueue(refreshError);

        if (typeof window !== "undefined") {
          // window.location.href = "/";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshingHotel = false;
      }
    }

    return Promise.reject(error);
  }
);