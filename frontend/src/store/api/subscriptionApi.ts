// store/api/subscriptionApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  SubscriptionPlan,
  SubscriptionFormData,
  SubscriptionFilters,
  SubscriptionsResponse,
  SubscriptionResponse,
} from '@/types/subscription';



let url;
if (process.env.NEXT_PUBLIC_STATE === "production") {
  url = process.env.NEXT_PUBLIC_PRO_BASE_URL;
} else {
  url = process.env.NEXT_PUBLIC_BASE_URL;
}

export const subscriptionApi = createApi({
  reducerPath: 'subscriptionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: url,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Subscription', 'SubscriptionsList'],
  endpoints: (builder) => ({
    // Get all subscriptions with pagination and filters
    getSubscriptions: builder.query<SubscriptionsResponse, Partial<SubscriptionFilters>>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        
        return {
          url: `/admin/dashboard/subscriptions?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Subscription' as const, id })),
              { type: 'SubscriptionsList', id: 'LIST' },
            ]
          : [{ type: 'SubscriptionsList', id: 'LIST' }],
    }),

    // Get single subscription by ID
    getSubscriptionById: builder.query<SubscriptionResponse, string>({
      query: (id) => ({
        url: `/admin/dashboard/subscriptions/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Subscription', id }],
    }),

    // Create new subscription
    createSubscription: builder.mutation<SubscriptionResponse, SubscriptionFormData>({
      query: (formData) => {
        // Convert string numbers to actual numbers
        const payload = {
          ...formData,
          price_per_month: parseFloat(formData.price_per_month as string),
          max_staff: parseInt(formData.max_staff as string),
          max_tables: parseInt(formData.max_tables as string),
          max_menu_items: parseInt(formData.max_menu_items as string),
          display_order: parseInt(formData.display_order as string) || 0,
        };
        
        return {
          url: '/admin/dashboard/subscriptions',
          method: 'POST',
          body: payload,
        };
      },
      invalidatesTags: [{ type: 'SubscriptionsList', id: 'LIST' }],
    }),

    // Update subscription
    updateSubscription: builder.mutation<
      SubscriptionResponse,
      { id: string; data: Partial<SubscriptionFormData> }
    >({
      query: ({ id, data }) => {
        const payload: any = { ...data };
        
        // Convert string numbers to actual numbers
        if (data.price_per_month)
          payload.price_per_month = parseFloat(data.price_per_month as string);
        if (data.max_staff) payload.max_staff = parseInt(data.max_staff as string);
        if (data.max_tables) payload.max_tables = parseInt(data.max_tables as string);
        if (data.max_menu_items) payload.max_menu_items = parseInt(data.max_menu_items as string);
        if (data.display_order) payload.display_order = parseInt(data.display_order as string);
        
        return {
          url: `/admin/dashboard/subscriptions/${id}`,
          method: 'PUT',
          body: payload,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Subscription', id },
        { type: 'SubscriptionsList', id: 'LIST' },
      ],
    }),

    // Delete subscription
    deleteSubscription: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/admin/dashboard/subscriptions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Subscription', id },
        { type: 'SubscriptionsList', id: 'LIST' },
      ],
    }),

    // Toggle subscription status
    toggleSubscriptionStatus: builder.mutation<SubscriptionResponse, string>({
      query: (id) => ({
        url: `/admin/dashboard/subscriptions/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Subscription', id },
        { type: 'SubscriptionsList', id: 'LIST' },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetSubscriptionsQuery,
  useGetSubscriptionByIdQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useToggleSubscriptionStatusMutation,
} = subscriptionApi;