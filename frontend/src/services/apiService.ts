// import axios from 'axios';
// // import { store } from '@/store';

// export const api = axios.create({
// //   baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://cafe-management-system-b9fa.onrender.com',
//   baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",

//   withCredentials: true, // Critical for HTTP-only cookies
//   timeout: 30000,
//   headers: {
//     'Content-Type': 'application/json',
//     'X-Requested-With': 'XMLHttpRequest',
//   },
// });


// // ✅ Instead, add token dynamically in request interceptor
// api.interceptors.request.use(
//   (config) => {
//     // Get token from localStorage or cookie - NOT from Redux store
//     // This avoids circular dependency
//     if (typeof window !== 'undefined') {
//       // You can get CSRF token from cookie or localStorage
//       const csrfToken = document.cookie
//         .split('; ')
//         .find(row => row.startsWith('csrf_token='))
//         ?.split('=')[1];
      
//       if (csrfToken) {
//         config.headers['X-CSRF-Token'] = csrfToken;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor - DON'T dispatch Redux actions here
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     // Handle 401 errors
//     if (error.response?.status === 401) {
//       // Redirect to login - DON'T dispatch Redux actions
//       if (typeof window !== 'undefined') {
//         window.location.href = '/admin/login';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export function getApiError(err: any, fallback = 'Request failed') {
//   return err?.response?.data?.message || err?.message || fallback;
// }








// // services/api.ts (or apiService.ts)
// import axios from "axios";

// export const api = axios.create({
//   // //   baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://cafe-management-system-b9fa.onrender.com',

//   baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
//   withCredentials: true,
//   timeout: 30000,
//   headers: { "Content-Type": "application/json" },
// });

// export function getApiError(err: any, fallback = "Request failed") {
//   return err?.response?.data?.message || err?.message || fallback;
// }

// // ---- refresh queue (prevents multiple refresh calls at once) ----
// let refreshing = false;
// let waiters: Array<(ok: boolean) => void> = [];

// function resolveWaiters(ok: boolean) {
//   waiters.forEach((w) => w(ok));
//   waiters = [];
// }

// api.interceptors.response.use(
//   (res) => res,
//   async (err) => {
//     const original = err.config;

//     // only handle 401 once per request
//     if (err?.response?.status === 401 && !original?._retry) {
//       original._retry = true;

//       if (refreshing) {
//         const ok = await new Promise<boolean>((resolve) => {
//           waiters.push(resolve);
//         });
//         if (!ok) return Promise.reject(err);
//         return api(original);
//       }

//       refreshing = true;
//       try {
//         // ✅ must exist in backend
//         await api.post("/api/auth/admin/refresh", {});
//         resolveWaiters(true);
//         return api(original);
//       } catch (e) {
//         resolveWaiters(false);
//         // optional redirect
//         if (typeof window !== "undefined") {
//           window.location.href = "/admin/login?session=expired";
//         }
//         return Promise.reject(e);
//       } finally {
//         refreshing = false;
//       }
//     }

//     return Promise.reject(err);
//   },
// );


// services/apiService.ts
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

// Refresh handling
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
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
    const requestUrl = originalRequest?.url || "";

    const skipRedirectRoutes = [
      "/api/auth/admin/login",
      "/api/auth/admin/refresh",
      "/api/auth/admin/logout",
      "/api/hotel/login",
      "/api/hotel/register",
    ];

    const shouldSkip = skipRedirectRoutes.some((route) =>
      requestUrl.includes(route)
    );

    if (shouldSkip) {
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
        await api.post("/api/auth/admin/refresh", {}, { withCredentials: true });
        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        if (typeof window !== "undefined" && window.location.pathname !== "/log/in") {
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);



// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     console.log('1')

//     // Don't retry auth endpoints
//     if (originalRequest.url?.includes('/auth/login') || 
//         originalRequest.url?.includes('/auth/refresh')) {
//       return Promise.reject(error);
//     }

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         // Queue this request while token refreshes
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then(() => api(originalRequest))
//           .catch(err => Promise.reject(err));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;
//           console.log('1')


//       try {
//         // Call refresh endpoint (no /api prefix, just /auth/refresh)
//         await api.post("/auth/refresh");
//             console.log('1')

        
//         processQueue();
//         return api(originalRequest);
//       } catch (refreshError) {
//         processQueue(refreshError);
        
//         // Redirect to login
//         if (typeof window !== 'undefined') {
//           window.location.href = "/admin/login?session=expired";
//         }
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );


// // Request interceptor - Add CSRF token
// api.interceptors.request.use(
//   (config) => {
//     // Get CSRF token from Redux store
//     const state = store.getState();
//     const csrfToken = state.auth?.csrfToken;
    
//     if (csrfToken) {
//       config.headers['X-CSRF-Token'] = csrfToken;
//     }
    
//     // Add cache busting for GET requests
//     if (config.method?.toLowerCase() === 'get') {
//       config.params = {
//         ...config.params,
//         _t: Date.now(),
//       };
//     }
    
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor - Handle auth errors
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
    
//     // Prevent infinite loops
//     if (originalRequest._retry) {
//       return Promise.reject(error);
//     }
    
//     // Handle 401 Unauthorized - Token expired
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
      
//       try {
//         // Try to refresh the session
//         const state = store.getState();
//         const csrfToken = state.auth?.csrfToken;
        
//         await axios.post(
//           `${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/refresh`,
//           {},
//           {
//             withCredentials: true,
//             headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
//           }
//         );
        
//         // Retry the original request
//         return api(originalRequest);
//       } catch (refreshError) {
//         // Refresh failed - redirect to login
//         if (typeof window !== 'undefined') {
//           window.location.href = '/admin/login?session=expired';
//         }
//         return Promise.reject(refreshError);
//       }
//     }
    
//     // Handle 429 Too Many Requests (rate limiting)
//     if (error.response?.status === 429) {
//       console.error('Rate limited:', error.response.data);
//     }
    
//     // Handle 403 Forbidden (CSRF or permissions)
//     if (error.response?.status === 403) {
//       console.error('CSRF validation failed or insufficient permissions');
//     }
    
//     return Promise.reject(error);
//   }
// );