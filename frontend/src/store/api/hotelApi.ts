// store/api/hotelApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';



// Types
export interface HotelAdmin {
  name: string;
  email: string;
  phone: string;
}

export interface HotelContact {
  hotelPhone: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  tax_rate: number;
  service_charge: number
}

export interface HotelSubscription {
  planId: string | null;
  planName: string;
  planCode: string;
  pricePerMonth: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  trialEndsAt: string | null;
}

export interface HotelLimits {
  maxStaffAllowed: number;
  maxTablesAllowed: number;
  maxMenuItemsAllowed: number;
}

export interface HotelUsage {
  staffCount: number;
  tableCount: number;
  menuCount: number;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate: string | null;
}

export interface HotelStatus {
  isActive: boolean;
  isVerified: boolean;
}

export interface HotelActivity {
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Hotel {
  id: string;
  hotelName: string;
  hotelSlug: string;
  admin: HotelAdmin;
  contact: HotelContact;
  subscription: HotelSubscription;
  limits: HotelLimits;
  usage: HotelUsage;
  status: HotelStatus;
  activity: HotelActivity;
}

export interface HotelsResponse {
  success: boolean;
  data: Hotel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    search: string;
    status: string;
    subscription_status: string;
    plan_id: string;
    sort_by: string;
    sort_order: string;
  };
}

export interface HotelFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  subscription_status?: 'all' | 'trial' | 'active' | 'suspended' | 'cancelled';
  plan_id?: string;
  sort_by?: 'created_at' | 'hotel_name' | 'city' | 'country' | 'subscription_status' | 'is_active' | 'total_revenue' | 'total_orders' | 'staff_count';
  sort_order?: 'asc' | 'desc';
}

export interface SubscriptionPlanOption {
  id: string;
  plan_name: string;
  plan_code: string;
}

// Helper to get base URL
const getBaseUrl = () => {
  // if (typeof window !== 'undefined') {
  //   return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  // }
  // return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  // return "https://cafe-management-system-b9fa.onrender.com"


};


let url;
if (process.env.NEXT_PUBLIC_STATE === "production") {
  url = process.env.NEXT_PUBLIC_PRO_BASE_URL;
} else {
  url = process.env.NEXT_PUBLIC_BASE_URL;
}
export const hotelApi = createApi({
  reducerPath: 'hotelApi',
  baseQuery: baseQueryWithReauth, // Use the custom base query instead of fetchBaseQuery
  tagTypes: ['Hotels', 'Hotel', 'SubscriptionPlans'],
  endpoints: (builder) => ({
    // Get all hotels with filters
    getHotels: builder.query<HotelsResponse, HotelFilters>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.subscription_status && filters.subscription_status !== 'all') {
          params.append('subscription_status', filters.subscription_status);
        }
        if (filters.plan_id) params.append('plan_id', filters.plan_id);
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.sort_order) params.append('sort_order', filters.sort_order);
        
        return {
          url: `/admin/dashboard/hotels?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Hotel' as const, id })),
              { type: 'Hotels', id: 'LIST' },
            ]
          : [{ type: 'Hotels', id: 'LIST' }],
    }),

    // Get single hotel by ID
    getHotelById: builder.query<{ success: boolean; data: Hotel }, string>({
      query: (id) => ({
        url: `/admin/dashboard/hotels/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Hotel', id }],
    }),

    // Update hotel
    updateHotel: builder.mutation<
      { success: boolean; message: string; data: Hotel },
      { id: string; data: Partial<Hotel> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/dashboard/hotels/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Hotel', id },
        { type: 'Hotels', id: 'LIST' },
      ],
    }),

    // Toggle hotel status
    toggleHotelStatus: builder.mutation<
      { success: boolean; message: string; data: { id: string; is_active: boolean } },
      string
    >({
      query: (id) => ({
        url: `/admin/dashboard/hotels/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Hotel', id },
        { type: 'Hotels', id: 'LIST' },
      ],
    }),

    // Verify hotel
    verifyHotel: builder.mutation<
      { success: boolean; message: string; data: { id: string; is_verified: boolean } },
      string
    >({
      query: (id) => ({
        url: `/admin/dashboard/hotels/${id}/verify`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Hotel', id },
        { type: 'Hotels', id: 'LIST' },
      ],
    }),

    // Delete hotel
    deleteHotel: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/admin/dashboard/hotels/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Hotels', id: 'LIST' }],
    }),

    // Get subscription plans for filter dropdown
    getSubscriptionPlans: builder.query<{ success: boolean; data: SubscriptionPlanOption[] }, void>({
      query: () => ({
        url: '/admin/dashboard/subscriptions?limit=100',
        method: 'GET',
      }),
      transformResponse: (response: any) => ({
        success: response.success,
        data: response.data.map((plan: any) => ({
          id: plan.id,
          plan_name: plan.plan_name,
          plan_code: plan.plan_code,
        })),
      }),
      providesTags: [{ type: 'SubscriptionPlans', id: 'LIST' }],
    }),

    // Export hotels
    exportHotels: builder.mutation<Blob, HotelFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        params.append('type', 'hotels');
        if (filters.search) params.append('search', filters.search);
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.subscription_status && filters.subscription_status !== 'all') {
          params.append('subscription_status', filters.subscription_status);
        }
        
        return {
          url: `/admin/dashboard/export?${params.toString()}`,
          method: 'GET',
          responseHandler: (response) => response.blob(),
        };
      },
    }),
  }),
});

export const {
  useGetHotelsQuery,
  useGetHotelByIdQuery,
  useUpdateHotelMutation,
  useToggleHotelStatusMutation,
  useVerifyHotelMutation,
  useDeleteHotelMutation,
  useGetSubscriptionPlansQuery,
  useExportHotelsMutation,
} = hotelApi;