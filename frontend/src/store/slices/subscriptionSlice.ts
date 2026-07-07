// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
// import axios from 'axios'

// interface SubscriptionPlan {
//   id: string
//   plan_name: string
//   plan_code: string
//   description: string
//   price_per_month: string
//   max_staff: number
//   max_tables: number
//   max_menu_items: number
//   features: {
//     [key: string]: boolean
//   }
//   display_order: number
//   is_active: boolean
//   created_at: string
// }

// interface SubscriptionState {
//   plans: SubscriptionPlan[]
//   loading: boolean
//   error: string | null
// }

// const initialState: SubscriptionState = {
//   plans: [],
//   loading: false,
//   error: null,
// }

// // Async thunk for fetching subscription plans
// export const fetchSubscriptionPlans = createAsyncThunk(
//   'subscription/fetchPlans',
//   async () => {
//     const response = await axios.get('http://localhost:4000/api/auth/subscriptions')
//     return response.data.plans
//   }
// )

// const subscriptionSlice = createSlice({
//   name: 'subscription',
//   initialState,
//   reducers: {
//     clearError: (state) => {
//       state.error = null
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchSubscriptionPlans.pending, (state) => {
//         state.loading = true
//         state.error = null
//       })
//       .addCase(
//         fetchSubscriptionPlans.fulfilled,
//         (state, action: PayloadAction<SubscriptionPlan[]>) => {
//           state.loading = false
//           state.plans = action.payload
//         }
//       )
//       .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.error.message || 'Failed to fetch subscription plans'
//       })
//   },
// })

// export const { clearError } = subscriptionSlice.actions
// export default subscriptionSlice.reducer



import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api, getApiError } from "@/services/api";

export type AnyObj = Record<string, any>;

type SubscriptionState = {
  plans: AnyObj[]; // ✅ full rows
  loading: boolean;
  error: string | null;
};

const initialState: SubscriptionState = {
  plans: [],
  loading: false,
  error: null,
};

export const fetchSubscriptionPlans = createAsyncThunk<
  AnyObj[],
  void,
  { rejectValue: string }
>("subscription/fetchPlans", async (_, thunkApi) => {
  try {
    // const { data } = await api.get("/api/subscription-plans?active=true");
        const { data } = await api.get("/api/auth/subscriptions");

    return data.plans ?? [];
  } catch (err: any) {
    return thunkApi.rejectWithValue(getApiError(err, "Failed to fetch plans"));
  }
});

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearSubscriptionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action: PayloadAction<AnyObj[]>) => {
        state.loading = false;
        state.plans = action.payload; // ✅ keep full rows
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch plans";
      });
  },
});

export const { clearSubscriptionError } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
