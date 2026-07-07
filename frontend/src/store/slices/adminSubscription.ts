// // store/slices/adminSubscription.ts
// import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { api, getApiError } from "@/services/apiService";
// import {
//   SubscriptionPlan,
//   SubscriptionFormData,
//   SubscriptionFilters,
//   SubscriptionsResponse,
//   SubscriptionResponse,
// } from "@/types/subscription";

// interface SubscriptionState {
//   plans: SubscriptionPlan[];
//   currentPlan: SubscriptionPlan | null;
//   filters: SubscriptionFilters;
//   status: "idle" | "loading" | "succeeded" | "failed";
//   actionStatus: "idle" | "loading" | "succeeded" | "failed";
//   error: string | null;
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     pages: number;
//   } | null;
// }

// const initialState: SubscriptionState = {
//   plans: [],
//   currentPlan: null,
//   filters: {
//     page: 1,
//     limit: 10,
//     search: "",
//     status: "all",
//   },
//   status: "idle",
//   actionStatus: "idle",
//   error: null,
//   pagination: null,
// };

// // Fetch all subscriptions
// // export const fetchSubscriptions = createAsyncThunk<
// //   SubscriptionsResponse,
// //   Partial<SubscriptionFilters> | undefined,
// //   { rejectValue: string }
// // >("subscriptions/fetchAll", async (filters, { rejectWithValue, getState }) => {
// //   try {
// //     console.log("1");
// //     const state = getState() as any;
// //     const currentFilters = { ...state.subscriptions.filters, ...filters };
// //     console.log("2");

// //     const { data } = await api.get("/admin/dashboard/subscriptions", {
// //       params: {
// //         page: currentFilters.page,
// //         limit: currentFilters.limit,
// //         search: currentFilters.search,
// //         status: currentFilters.status,
// //       },
// //     });
// //     console.log("fetched subscriptions from admin subscription slice:", data);

// //     return data;
// //   } catch (err: any) {
// //     return rejectWithValue(getApiError(err, "Failed to fetch subscriptions"));
// //   }
// // });

// export const fetchSubscriptions = createAsyncThunk<
//   SubscriptionsResponse,
//   Partial<SubscriptionFilters> | undefined,
//   { rejectValue: string }
// >(
//   'subscriptions/fetchAll',
//   async (filters, { rejectWithValue, getState }) => {
//     try {
//       const state = getState() as any;
      
//       // Safely get filters with fallback
//       let currentFilters = {
//         page: 1,
//         limit: 10,
//         search: '',
//         status: 'all'
//       };
      
//       // Try different possible state paths
//       if (state.subscription?.filters) {
//         currentFilters = { ...currentFilters, ...state.subscription.filters };
//       } else if (state.subscriptions?.filters) {
//         currentFilters = { ...currentFilters, ...state.subscriptions.filters };
//       }
      
//       // Override with any new filters passed
//       if (filters) {
//         currentFilters = { ...currentFilters, ...filters };
//       }
      
//       const { data } = await api.get('/admin/dashboard/subscriptions', {
//         params: {
//           page: currentFilters.page,
//           limit: currentFilters.limit,
//           search: currentFilters.search,
//           status: currentFilters.status
//         }
//       });

//       return data;
//     } catch (err: any) {
//       return rejectWithValue(getApiError(err, 'Failed to fetch subscriptions'));
//     }
//   }
// );

// // Fetch single subscription
// export const fetchSubscriptionById = createAsyncThunk<
//   SubscriptionResponse,
//   string,
//   { rejectValue: string }
// >("subscriptions/fetchById", async (id, { rejectWithValue }) => {
//   try {
//     console.log('this is the id from the slice:- ', id)
//     const { data } = await api.get(`/admin/dashboard/subscriptions/${id}`);
//     console.log('this is the response from the slicee:- ', data)
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, "Failed to fetch subscription"));
//   }
// });

// // Create subscription
// export const createSubscription = createAsyncThunk<
//   SubscriptionResponse,
//   SubscriptionFormData,
//   { rejectValue: string }
// >("subscriptions/create", async (formData, { rejectWithValue }) => {
//   try {
//     const { data } = await api.post("/admin/dashboard/subscriptions", {
//       ...formData,
//       price_per_year: parseFloat(formData.price_per_year as unknown as string),
//       max_staff: parseInt(formData.max_staff as string),
//       max_tables: parseInt(formData.max_tables as string),
//       max_menu_items: parseInt(formData.max_menu_items as string),
//       display_order: parseInt(formData.display_order as string) || 0,
//     });
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, "Failed to create subscription"));
//   }
// });

// // Update subscription
// export const updateSubscription = createAsyncThunk<
//   SubscriptionResponse,
//   { id: string; data: Partial<SubscriptionFormData> },
//   { rejectValue: string }
// >("subscriptions/update", async ({ id, data }, { rejectWithValue }) => {
//   try {
//     const payload: any = { ...data };

//     // Convert string numbers to actual numbers
//     if (data.price_per_year)
//       payload.price_per_year = parseFloat(data.price_per_year as unknown as string );
//     if (data.max_staff) payload.max_staff = parseInt(data.max_staff as string);
//     if (data.max_tables)
//       payload.max_tables = parseInt(data.max_tables as string);
//     if (data.max_menu_items)
//       payload.max_menu_items = parseInt(data.max_menu_items as string);
//     if (data.display_order)
//       payload.display_order = parseInt(data.display_order as string);

//     const response = await api.put(
//       `/admin/dashboard/subscriptions/${id}`,
//       payload,
//     );
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, "Failed to update subscription"));
//   }
// });

// // Delete subscription
// export const deleteSubscription = createAsyncThunk<
//   { success: boolean; message: string },
//   string,
//   { rejectValue: string }
// >("subscriptions/delete", async (id, { rejectWithValue }) => {
//   try {
//     const { data } = await api.delete(`/admin/dashboard/subscriptions/${id}`);
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, "Failed to delete subscription"));
//   }
// });

// // Toggle subscription status
// export const toggleSubscriptionStatus = createAsyncThunk<
//   SubscriptionResponse,
//   string,
//   { rejectValue: string }
// >("subscriptions/toggleStatus", async (id, { rejectWithValue }) => {
//   try {
//     const { data } = await api.patch(
//       `/admin/dashboard/subscriptions/${id}/toggle`,
//     );
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(
//       getApiError(err, "Failed to toggle subscription status"),
//     );
//   }
// });

// const subscriptionSlice = createSlice({
//   name: "subscriptions",
//   initialState,
//   reducers: {
//     setFilters: (
//       state,
//       action: PayloadAction<Partial<SubscriptionFilters>>,
//     ) => {
//       state.filters = { ...state.filters, ...action.payload };
//     },
//     resetFilters: (state) => {
//       state.filters = initialState.filters;
//     },
//     clearCurrentPlan: (state) => {
//       state.currentPlan = null;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//     resetActionStatus: (state) => {
//       state.actionStatus = "idle";
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch all
//       .addCase(fetchSubscriptions.pending, (state) => {
//         state.status = "loading";
//         state.error = null;
//       })
//       .addCase(fetchSubscriptions.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.plans = action.payload.data;
//         state.pagination = action.payload.pagination;
//         state.error = null;
//       })
//       .addCase(fetchSubscriptions.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || "Failed to fetch subscriptions";
//       })

//       // Fetch single
//       .addCase(fetchSubscriptionById.pending, (state) => {
//         state.status = "loading";
//         state.error = null;
//       })
//       .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.currentPlan = action.payload.data;
//         state.error = null;
//       })
//       .addCase(fetchSubscriptionById.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || "Failed to fetch subscription";
//       })

//       // Create
//       .addCase(createSubscription.pending, (state) => {
//         state.actionStatus = "loading";
//         state.error = null;
//       })
//       .addCase(createSubscription.fulfilled, (state, action) => {
//         state.actionStatus = "succeeded";
//         state.plans = [action.payload.data, ...state.plans];
//         if (state.pagination) {
//           state.pagination.total += 1;
//           state.pagination.pages = Math.ceil(
//             state.pagination.total / state.pagination.limit,
//           );
//         }
//       })
//       .addCase(createSubscription.rejected, (state, action) => {
//         state.actionStatus = "failed";
//         state.error = action.payload || "Failed to create subscription";
//       })

//       // Update
//       .addCase(updateSubscription.pending, (state) => {
//         state.actionStatus = "loading";
//         state.error = null;
//       })
//       .addCase(updateSubscription.fulfilled, (state, action) => {
//         state.actionStatus = "succeeded";
//         state.plans = state.plans.map((plan) =>
//           plan.id === action.payload.data.id ? action.payload.data : plan,
//         );
//         if (state.currentPlan?.id === action.payload.data.id) {
//           state.currentPlan = action.payload.data;
//         }
//       })
//       .addCase(updateSubscription.rejected, (state, action) => {
//         state.actionStatus = "failed";
//         state.error = action.payload || "Failed to update subscription";
//       })

//       // Delete
//       .addCase(deleteSubscription.pending, (state) => {
//         state.actionStatus = "loading";
//         state.error = null;
//       })
//       .addCase(deleteSubscription.fulfilled, (state, action) => {
//         state.actionStatus = "succeeded";
//         const deletedId = action.meta.arg;
//         state.plans = state.plans.filter((plan) => plan.id !== deletedId);
//         if (state.pagination) {
//           state.pagination.total -= 1;
//           state.pagination.pages = Math.ceil(
//             state.pagination.total / state.pagination.limit,
//           );
//         }
//         if (state.currentPlan?.id === deletedId) {
//           state.currentPlan = null;
//         }
//       })
//       .addCase(deleteSubscription.rejected, (state, action) => {
//         state.actionStatus = "failed";
//         state.error = action.payload || "Failed to delete subscription";
//       })

//       // Toggle status
//       .addCase(toggleSubscriptionStatus.fulfilled, (state, action) => {
//         state.plans = state.plans.map((plan) =>
//           plan.id === action.payload.data.id
//             ? { ...plan, is_active: action.payload.data.is_active }
//             : plan,
//         );
//         if (state.currentPlan?.id === action.payload.data.id) {
//           state.currentPlan = {
//             ...state.currentPlan,
//             is_active: action.payload.data.is_active,
//           };
//         }
//       });
//   },
// });

// export const {
//   setFilters,
//   resetFilters,
//   clearCurrentPlan,
//   clearError,
//   resetActionStatus,
// } = subscriptionSlice.actions;

// export default subscriptionSlice.reducer;






// store/slices/adminSubscription.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api, getApiError } from "@/services/apiService";
import {
  SubscriptionPlan,
  SubscriptionFormData,
  SubscriptionFilters,
  SubscriptionsResponse,
  SubscriptionResponse,
} from "@/types/subscription";

interface SubscriptionState {
  plans: SubscriptionPlan[];
  currentPlan: SubscriptionPlan | null;
  filters: SubscriptionFilters;
  status: "idle" | "loading" | "succeeded" | "failed";
  actionStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

const initialState: SubscriptionState = {
  plans: [],
  currentPlan: null,
  filters: {
    page: 1,
    limit: 10,
    search: "",
    status: "all",
  },
  status: "idle",
  actionStatus: "idle",
  error: null,
  pagination: null,
};

export const fetchSubscriptions = createAsyncThunk<
  SubscriptionsResponse,
  Partial<SubscriptionFilters> | undefined,
  { rejectValue: string }
>(
  'subscriptions/fetchAll',
  async (filters, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      
      // Safely get filters with fallback
      let currentFilters = {
        page: 1,
        limit: 10,
        search: '',
        status: 'all'
      };
      
      if (state.adminSubscription?.filters) {
        currentFilters = { ...currentFilters, ...state.adminSubscription.filters };
      }
      
      if (filters) {
        currentFilters = { ...currentFilters, ...filters };
      }
      
      const { data } = await api.get('/admin/dashboard/subscriptions', {
        params: {
          page: currentFilters.page,
          limit: currentFilters.limit,
          search: currentFilters.search,
          status: currentFilters.status
        }
      });

      return data;
    } catch (err: any) {
      return rejectWithValue(getApiError(err, 'Failed to fetch subscriptions'));
    }
  }
);

export const fetchSubscriptionById = createAsyncThunk<
  SubscriptionResponse,
  string,
  { rejectValue: string }
>("subscriptions/fetchById", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/admin/dashboard/subscriptions/${id}`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, "Failed to fetch subscription"));
  }
});

export const createSubscription = createAsyncThunk<
  SubscriptionResponse,
  SubscriptionFormData,
  { rejectValue: string }
>("subscriptions/create", async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/admin/dashboard/subscriptions", {
      ...formData,
      price_per_year: parseFloat(formData.price_per_year as unknown as string),
      max_staff: parseInt(formData.max_staff as string),
      max_tables: parseInt(formData.max_tables as string),
      max_menu_items: parseInt(formData.max_menu_items as string),
      display_order: parseInt(formData.display_order as string) || 0,
    });
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, "Failed to create subscription"));
  }
});

export const updateSubscription = createAsyncThunk<
  SubscriptionResponse,
  { id: string; data: Partial<SubscriptionFormData> },
  { rejectValue: string }
>("subscriptions/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const payload: any = { ...data };

    if (data.price_per_year)
      payload.price_per_year = parseFloat(data.price_per_year as unknown as string);
    if (data.max_staff) payload.max_staff = parseInt(data.max_staff as string);
    if (data.max_tables)
      payload.max_tables = parseInt(data.max_tables as string);
    if (data.max_menu_items)
      payload.max_menu_items = parseInt(data.max_menu_items as string);
    if (data.display_order)
      payload.display_order = parseInt(data.display_order as string);

    const response = await api.put(
      `/admin/dashboard/subscriptions/${id}`,
      payload,
    );
    return response.data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, "Failed to update subscription"));
  }
});

export const deleteSubscription = createAsyncThunk<
  { success: boolean; message: string },
  string,
  { rejectValue: string }
>("subscriptions/delete", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/admin/dashboard/subscriptions/${id}`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, "Failed to delete subscription"));
  }
});

export const toggleSubscriptionStatus = createAsyncThunk<
  SubscriptionResponse,
  string,
  { rejectValue: string }
>("subscriptions/toggleStatus", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(
      `/admin/dashboard/subscriptions/${id}/toggle`,
    );
    return data;
  } catch (err: any) {
    return rejectWithValue(
      getApiError(err, "Failed to toggle subscription status"),
    );
  }
});

const subscriptionSlice = createSlice({
  name: "adminSubscription",
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<Partial<SubscriptionFilters>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentPlan: (state) => {
      state.currentPlan = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetActionStatus: (state) => {
      state.actionStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.plans = action.payload.data || [];
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch subscriptions";
      })
      .addCase(fetchSubscriptionById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentPlan = action.payload.data;
        state.error = null;
      })
      .addCase(fetchSubscriptionById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch subscription";
      })
      .addCase(createSubscription.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.plans = [action.payload.data, ...(state.plans || [])];
        if (state.pagination) {
          state.pagination.total += 1;
          state.pagination.pages = Math.ceil(
            state.pagination.total / state.pagination.limit,
          );
        }
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload || "Failed to create subscription";
      })
      .addCase(updateSubscription.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.plans = (state.plans || []).map((plan) =>
          plan.id === action.payload.data.id ? action.payload.data : plan,
        );
        if (state.currentPlan?.id === action.payload.data.id) {
          state.currentPlan = action.payload.data;
        }
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload || "Failed to update subscription";
      })
      .addCase(deleteSubscription.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const deletedId = action.meta.arg;
        state.plans = (state.plans || []).filter((plan) => plan.id !== deletedId);
        if (state.pagination) {
          state.pagination.total -= 1;
          state.pagination.pages = Math.ceil(
            state.pagination.total / state.pagination.limit,
          );
        }
        if (state.currentPlan?.id === deletedId) {
          state.currentPlan = null;
        }
      })
      .addCase(deleteSubscription.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload || "Failed to delete subscription";
      })
      .addCase(toggleSubscriptionStatus.fulfilled, (state, action) => {
        state.plans = (state.plans || []).map((plan) =>
          plan.id === action.payload.data.id
            ? { ...plan, is_active: action.payload.data.is_active }
            : plan,
        );
        if (state.currentPlan?.id === action.payload.data.id) {
          state.currentPlan = {
            ...state.currentPlan,
            is_active: action.payload.data.is_active,
          };
        }
      });
  },
});

export const {
  setFilters,
  resetFilters,
  clearCurrentPlan,
  clearError,
  resetActionStatus,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;