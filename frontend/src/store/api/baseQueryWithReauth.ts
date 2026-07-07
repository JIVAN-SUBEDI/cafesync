// store/api/baseQueryWithReauth.ts
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { adminApi } from '../../services/adminApi';

let url: string;
if (process.env.NEXT_PUBLIC_STATE === "production") {
  url = process.env.NEXT_PUBLIC_PRO_BASE_URL!;
} else {
  url = process.env.NEXT_PUBLIC_BASE_URL!;
}

// Create base query without authentication handling
const rawBaseQuery = fetchBaseQuery({
  baseUrl: url,
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Custom base query with reauthentication
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // If we get a 401, try to refresh the token
  if (result.error && result.error.status === 401) {
    console.log('Token expired, attempting to refresh...');
    
    try {
      // Use adminApi to refresh token (it has the interceptor logic)
      await adminApi.post('/api/auth/admin/refresh', {}, { withCredentials: true });
      
      // Retry the original request
      result = await rawBaseQuery(args, api, extraOptions);
      
      if (result.error) {
        console.error('Retry failed after refresh:', result.error);
      } else {
        console.log('Token refreshed successfully, request retried');
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      
      // Redirect to login on refresh failure
      if (typeof window !== 'undefined') {
        window.location.href = '/log/in';
      }
      
      return {
        error: {
          status: 401,
          data: { message: 'Session expired. Please login again.' },
        } as FetchBaseQueryError,
      };
    }
  }

  return result;
};