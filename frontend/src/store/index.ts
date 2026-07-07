import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import tenantReducer from "./slices/tenantSlice";
import subscriptionReducer from "./slices/subscriptionSlice";
import authHotelReducer from "./slices/hotelAuthSlice";
import dashboardReducer from "./slices/dashboardSlice";
import adminDashboardReducer from "./slices/adminDashboardSlice";
import adminSubscriptionReducer from "./slices/adminSubscription";
import { subscriptionApi } from "@/store/api/subscriptionApi";
import { hotelApi } from "./api/hotelApi";
import hotelPassword from "./slices/hotelPasswordSlice";
import terms from "./slices/termsSlice";
import { setupListeners } from "@reduxjs/toolkit/query/react";

// Filter out any non-serializable values for devtools
const devToolsOptions = {
  maxAge: 25,
  trace: true,
  traceLimit: 25,
  serialize: {
    options: {
      undefined: true,
      function: (fn: any) => `[Function: ${fn.name || 'anonymous'}]`,
      symbol: (symbol: any) => symbol.toString(),
    },
    replacer: (key: string, value: any) => {
      // Skip Promise objects and large data
      if (value && typeof value === 'object' && value.constructor === Promise) {
        return '[Promise]';
      }
      // Skip function objects
      if (typeof value === 'function') {
        return '[Function]';
      }
      // Skip Date objects (they're fine but can be large)
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    },
  },
  // Denylist actions that might contain large data
  actionsDenylist: [
    'dashboard/fetchData/fulfilled',
    'subscriptions/fetchAll/fulfilled',
    'adminDashboard/fetchData/fulfilled',
    'adminSubscription/fetchAll/fulfilled',
  ],
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    subscription: subscriptionReducer,
    authHotel: authHotelReducer,
    dashboard: dashboardReducer,
    adminDashboard: adminDashboardReducer,
    adminSubscription: adminSubscriptionReducer,
    [subscriptionApi.reducerPath]: subscriptionApi.reducer,
    [hotelApi.reducerPath]: hotelApi.reducer,
    hotelPassword: hotelPassword,
    terms: terms,
  },
  // devTools: process.env.NEXT_PUBLIC_STATE !== 'production' ? devToolsOptions : false,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'dashboard/fetchData/fulfilled',
          'subscriptions/fetchAll/fulfilled',
          'adminDashboard/fetchData/fulfilled',
          'adminSubscription/fetchAll/fulfilled',
        ],
        // Ignore these paths in state
        ignoredPaths: [
          'adminDashboard.data',
          'dashboard.data',
          'subscriptions.plans',
          'adminSubscription.plans',
        ],
        warnAfter: 100,
      },
      immutableCheck: { warnAfter: 100 },
    }).concat(
      subscriptionApi.middleware,
      hotelApi.middleware,
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;