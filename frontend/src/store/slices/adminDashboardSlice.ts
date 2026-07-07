
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {getApiError } from "@/services/apiService";
import { adminApi } from "@/services/adminApi";
import { 
  DashboardData, 
  DashboardFilters,
  DashboardResponse 
} from "@/types/dashboard";

interface DashboardState {
  data: DashboardData | null;
  filters: DashboardFilters;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetched: string | null;
  exportStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: DashboardState = {
  data: null,
  filters: {
    range: '30d'  // Make sure this is included
  },
  status: 'idle',
  error: null,
  lastFetched: null,
  exportStatus: 'idle'
};

// Fetch dashboard data
export const fetchDashboardData = createAsyncThunk<
  DashboardData,
  DashboardFilters | undefined,
  { rejectValue: string }
>(
  'adminDashboard/fetchData',
  async (filters, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      // Safely get current filters with fallback
      const currentFilters = filters || state.adminDashboard?.filters || { range: '30d' };
      
      const { data } = await adminApi.get<DashboardResponse>('/admin/dashboard/stats', {
        params: {
          range: currentFilters.range
        }
      });
      console.log('Dashboard API response:', data);

      if (!data?.success || !data?.data) {
        return rejectWithValue('Failed to fetch dashboard data');
      }

      return data.data;
    } catch (err: any) {
      return rejectWithValue(getApiError(err, 'Failed to load dashboard'));
    }
  }
);

// Export data
export const exportDashboardData = createAsyncThunk<
  void,
  { type: 'hotels' | 'transactions' },
  { rejectValue: string }
>(
  'adminDashboard/export',
  async ({ type }, { rejectWithValue }) => {
    try {
      const response = await adminApi.get('/admin/dashboard/export', {
        params: { type },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      return rejectWithValue(getApiError(err, 'Export failed'));
    }
  }
);

// Refresh dashboard data (silent)
export const refreshDashboardData = createAsyncThunk<
  DashboardData,
  void,
  { rejectValue: string }
>(
  'adminDashboard/refresh',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const currentFilters = state.adminDashboard?.filters || { range: '30d' };
      
      const { data } = await adminApi.get<DashboardResponse>('/admin/dashboard/stats', {
        params: {
          range: currentFilters.range
        }
      });

      if (!data?.success || !data?.data) {
        return rejectWithValue('Failed to refresh dashboard');
      }

      return data.data;
    } catch (err: any) {
      return rejectWithValue(getApiError(err, 'Failed to refresh'));
    }
  }
);

const adminDashboardSlice = createSlice({
  name: 'adminDashboard',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<DashboardFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearDashboard: (state) => {
      state.data = null;
      state.status = 'idle';
      state.error = null;
      state.lastFetched = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load dashboard';
      })

      // Refresh dashboard
      .addCase(refreshDashboardData.fulfilled, (state, action) => {
        state.data = action.payload;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(refreshDashboardData.rejected, (state, action) => {
        state.error = action.payload || 'Failed to refresh';
      })

      // Export
      .addCase(exportDashboardData.pending, (state) => {
        state.exportStatus = 'loading';
      })
      .addCase(exportDashboardData.fulfilled, (state) => {
        state.exportStatus = 'succeeded';
      })
      .addCase(exportDashboardData.rejected, (state) => {
        state.exportStatus = 'failed';
      });
  }
});

export const { setFilters, clearDashboard, clearError } = adminDashboardSlice.actions;
export default adminDashboardSlice.reducer;





// // store/slices/adminDashboardSlice.ts
// import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { api, getApiError } from "@/services/apiService";
// import { DashboardData, DashboardFilters, DashboardResponse } from "@/types/dashboard";

// interface DashboardState {
//   data: DashboardData | null;
//   filters: DashboardFilters;
//   status: 'idle' | 'loading' | 'succeeded' | 'failed';
//   error: string | null;
//   lastFetched: string | null;
//   exportStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
// }

// const initialState: DashboardState = {
//   data: null,
//   filters: {
//     range: '30d'
//   },
//   status: 'idle',
//   error: null,
//   lastFetched: null,
//   exportStatus: 'idle'
// };

// // Fetch dashboard data with reduced payload size
// export const fetchDashboardData = createAsyncThunk<
//   DashboardData,
//   DashboardFilters | undefined,
//   { rejectValue: string }
// >(
//   'adminDashboard/fetchData',
//   async (filters, { rejectWithValue, getState }) => {
//     try {
//       const state = getState() as any;
//       const currentFilters = filters || state.adminDashboard?.filters || { range: '30d' };
      
//       const { data } = await api.get<DashboardResponse>('/admin/dashboard/stats', {
//         params: {
//           range: currentFilters.range
//         }
//       });

//       if (!data?.success || !data?.data) {
//         return rejectWithValue('Failed to fetch dashboard data');
//       }

//       // Return only the data, not the full response with success flag
//       return data.data;
//     } catch (err: any) {
//       return rejectWithValue(getApiError(err, 'Failed to load dashboard'));
//     }
//   }
// );

// // Export data
// export const exportDashboardData = createAsyncThunk<
//   void,
//   { type: 'hotels' | 'transactions' },
//   { rejectValue: string }
// >(
//   'adminDashboard/export',
//   async ({ type }, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/admin/dashboard/export', {
//         params: { type },
//         responseType: 'blob'
//       });

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (err: any) {
//       return rejectWithValue(getApiError(err, 'Export failed'));
//     }
//   }
// );

// // Refresh dashboard data (silent)
// export const refreshDashboardData = createAsyncThunk<
//   DashboardData,
//   void,
//   { rejectValue: string }
// >(
//   'adminDashboard/refresh',
//   async (_, { rejectWithValue, getState }) => {
//     try {
//       const state = getState() as any;
//       const currentFilters = state.adminDashboard?.filters || { range: '30d' };
      
//       const { data } = await api.get<DashboardResponse>('/admin/dashboard/stats', {
//         params: {
//           range: currentFilters.range
//         }
//       });

//       if (!data?.success || !data?.data) {
//         return rejectWithValue('Failed to refresh dashboard');
//       }

//       return data.data;
//     } catch (err: any) {
//       return rejectWithValue(getApiError(err, 'Failed to refresh'));
//     }
//   }
// );

// const adminDashboardSlice = createSlice({
//   name: 'adminDashboard',
//   initialState,
//   reducers: {
//     setFilters: (state, action: PayloadAction<Partial<DashboardFilters>>) => {
//       state.filters = { ...state.filters, ...action.payload };
//     },
//     clearDashboard: (state) => {
//       state.data = null;
//       state.status = 'idle';
//       state.error = null;
//       state.lastFetched = null;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchDashboardData.pending, (state) => {
//         state.status = 'loading';
//         state.error = null;
//       })
//       .addCase(fetchDashboardData.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         state.data = action.payload;
//         state.lastFetched = new Date().toISOString();
//         state.error = null;
//       })
//       .addCase(fetchDashboardData.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload || 'Failed to load dashboard';
//       })
//       .addCase(refreshDashboardData.fulfilled, (state, action) => {
//         state.data = action.payload;
//         state.lastFetched = new Date().toISOString();
//         state.error = null;
//       })
//       .addCase(refreshDashboardData.rejected, (state, action) => {
//         state.error = action.payload || 'Failed to refresh';
//       })
//       .addCase(exportDashboardData.pending, (state) => {
//         state.exportStatus = 'loading';
//       })
//       .addCase(exportDashboardData.fulfilled, (state) => {
//         state.exportStatus = 'succeeded';
//       })
//       .addCase(exportDashboardData.rejected, (state) => {
//         state.exportStatus = 'failed';
//       });
//   }
// });

// export const { setFilters, clearDashboard, clearError } = adminDashboardSlice.actions;
// export default adminDashboardSlice.reducer;