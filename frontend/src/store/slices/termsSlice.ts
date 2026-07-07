// // store/slices/termsSlice.ts
// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { api, getApiError } from '@/services/apiService';
// import {
//   TermsAndConditions,
//   TermsFilters,
//   TermsResponse,
//   TermsAcceptance,
//   TermsAcceptanceResponse,
//   ActiveTermsResponse,
// } from '@/types/terms';

// interface TermsState {
//   // Platform terms
//   platformTerms: TermsAndConditions | null;
//   privacyPolicy: TermsAndConditions | null;
//   cancellationPolicy: TermsAndConditions | null;
  
//   // Lists
//   terms: TermsAndConditions[];
//   acceptances: TermsAcceptance[];
  
//   // UI States
//   loading: boolean;
//   actionLoading: boolean;
//   error: string | null;
//   success: string | null;
  
//   // Pagination
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     pages: number;
//   } | null;
  
//   // Filters
//   filters: TermsFilters;
// }

// const initialState: TermsState = {
//   platformTerms: null,
//   privacyPolicy: null,
//   cancellationPolicy: null,
//   terms: [],
//   acceptances: [],
//   loading: false,
//   actionLoading: false,
//   error: null,
//   success: null,
//   pagination: null,
//   filters: {
//     page: 1,
//     limit: 10,
//     type: undefined,
//     is_active: true,
//     search: undefined,
//     sort_by: 'created_at',
//     sort_order: 'DESC',
//   },
// };

// // Fetch active terms (platform, privacy, cancellation)
// export const fetchActiveTerms = createAsyncThunk<
//   ActiveTermsResponse,
//   { type?: string; hotel_id?: string } | undefined,
//   { rejectValue: string }
// >('terms/fetchActive', async (params, { rejectWithValue }) => {
//   try {
//     const queryParams = new URLSearchParams();
//     if (params?.type) queryParams.append('type', params.type);
//     if (params?.hotel_id) queryParams.append('hotel_id', params.hotel_id);
    
//     const { data } = await api.get(`/terms/active?${queryParams.toString()}`);
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, 'Failed to fetch active terms'));
//   }
// });

// // Fetch all terms (admin only)
// export const fetchAllTerms = createAsyncThunk<
//   TermsResponse,
//   TermsFilters | undefined,
//   { rejectValue: string }
// >('terms/fetchAll', async (filters, { rejectWithValue }) => {
//   try {
//     const params = new URLSearchParams();
//     const filterData = filters || {};
    
//     if (filterData.page) params.append('page', filterData.page.toString());
//     if (filterData.limit) params.append('limit', filterData.limit.toString());
//     if (filterData.type) params.append('type', filterData.type);
//     if (filterData.is_active !== undefined) params.append('is_active', filterData.is_active.toString());
//     if (filterData.hotel_id) params.append('hotel_id', filterData.hotel_id);
//     if (filterData.search) params.append('search', filterData.search);
//     if (filterData.sort_by) params.append('sort_by', filterData.sort_by);
//     if (filterData.sort_order) params.append('sort_order', filterData.sort_order);
    
//     const { data } = await api.get(`/terms?${params.toString()}`);
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, 'Failed to fetch terms'));
//   }
// });

// // Fetch terms by ID
// export const fetchTermsById = createAsyncThunk<
//   { success: boolean; data: TermsAndConditions },
//   string,
//   { rejectValue: string }
// >('terms/fetchById', async (id, { rejectWithValue }) => {
//   try {
//     const { data } = await api.get(`/terms/${id}`);
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, 'Failed to fetch term'));
//   }
// });

// // Accept terms
// export const acceptTerms = createAsyncThunk<
//   { success: boolean; message: string; data: TermsAcceptance },
//   { termId: string; userType: 'hotel_admin' | 'staff' | 'customer' },
//   { rejectValue: string }
// >('terms/accept', async ({ termId, userType }, { rejectWithValue }) => {
//   try {
//     const { data } = await api.post(`/terms/${termId}/accept`, { user_type: userType });
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, 'Failed to accept terms'));
//   }
// });

// // Check if user has accepted terms
// export const checkTermsAcceptance = createAsyncThunk<
//   { success: boolean; data: { accepted: boolean; termsId: string } },
//   string,
//   { rejectValue: string }
// >('terms/checkAcceptance', async (termId, { rejectWithValue }) => {
//   try {
//     const { data } = await api.get(`/terms/${termId}/check`);
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, 'Failed to check acceptance'));
//   }
// });

// // Get acceptance history (admin only)
// export const fetchAcceptanceHistory = createAsyncThunk<
//   TermsAcceptanceResponse,
//   { termId: string; page?: number; limit?: number; user_type?: string },
//   { rejectValue: string }
// >('terms/fetchAcceptanceHistory', async ({ termId, page = 1, limit = 10, user_type }, { rejectWithValue }) => {
//   try {
//     const params = new URLSearchParams();
//     params.append('page', page.toString());
//     params.append('limit', limit.toString());
//     if (user_type) params.append('user_type', user_type);
    
//     const { data } = await api.get(`/terms/${termId}/acceptances?${params.toString()}`);
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, 'Failed to fetch acceptance history'));
//   }
// });

// // Create terms (admin only)
// export const createTerms = createAsyncThunk<
//   { success: boolean; data: TermsAndConditions },
//   Partial<TermsAndConditions>,
//   { rejectValue: string }
// >('terms/create', async (termsData, { rejectWithValue }) => {
//   try {
//     const { data } = await api.post('/terms', termsData);
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, 'Failed to create terms'));
//   }
// });

// // Update terms (admin only)
// export const updateTerms = createAsyncThunk<
//   { success: boolean; data: TermsAndConditions },
//   { id: string; data: Partial<TermsAndConditions> },
//   { rejectValue: string }
// >('terms/update', async ({ id, data }, { rejectWithValue }) => {
//   try {
//     const response = await api.put(`/terms/${id}`, data);
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, 'Failed to update terms'));
//   }
// });

// // Delete terms (admin only)
// export const deleteTerms = createAsyncThunk<
//   { success: boolean; message: string },
//   string,
//   { rejectValue: string }
// >('terms/delete', async (id, { rejectWithValue }) => {
//   try {
//     const { data } = await api.delete(`/terms/${id}`);
//     return data;
//   } catch (err: any) {
//     return rejectWithValue(getApiError(err, 'Failed to delete terms'));
//   }
// });

// const termsSlice = createSlice({
//   name: 'terms',
//   initialState,
//   reducers: {
//     clearTermsError: (state) => {
//       state.error = null;
//     },
//     clearTermsSuccess: (state) => {
//       state.success = null;
//     },
//     setTermsFilters: (state, action: PayloadAction<Partial<TermsFilters>>) => {
//       state.filters = { ...state.filters, ...action.payload };
//     },
//     resetTermsFilters: (state) => {
//       state.filters = initialState.filters;
//     },
//     resetTermsState: () => initialState,
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch Active Terms
//       .addCase(fetchActiveTerms.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchActiveTerms.fulfilled, (state, action) => {
//         state.loading = false;
//         if (action.payload.data) {
//           const term = action.payload.data;
//           if (term.type === 'platform') {
//             state.platformTerms = term;
//           } else if (term.type === 'privacy') {
//             state.privacyPolicy = term;
//           } else if (term.type === 'cancellation') {
//             state.cancellationPolicy = term;
//           }
//         }
//       })
//       .addCase(fetchActiveTerms.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to fetch active terms';
//       })

//       // Fetch All Terms
//       .addCase(fetchAllTerms.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchAllTerms.fulfilled, (state, action) => {
//         state.loading = false;
//         state.terms = action.payload.data;
//         state.pagination = action.payload.pagination;
//       })
//       .addCase(fetchAllTerms.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to fetch terms';
//       })

//       // Fetch Terms By ID
//       .addCase(fetchTermsById.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchTermsById.fulfilled, (state, action) => {
//         state.loading = false;
//         const term = action.payload.data;
//         if (term.type === 'platform') {
//           state.platformTerms = term;
//         } else if (term.type === 'privacy') {
//           state.privacyPolicy = term;
//         } else if (term.type === 'cancellation') {
//           state.cancellationPolicy = term;
//         }
//       })
//       .addCase(fetchTermsById.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to fetch term';
//       })

//       // Accept Terms
//       .addCase(acceptTerms.pending, (state) => {
//         state.actionLoading = true;
//         state.error = null;
//       })
//       .addCase(acceptTerms.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         state.success = action.payload.message;
//         state.acceptances = [...state.acceptances, action.payload.data];
//       })
//       .addCase(acceptTerms.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.error = action.payload || 'Failed to accept terms';
//       })

//       // Fetch Acceptance History
//       .addCase(fetchAcceptanceHistory.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchAcceptanceHistory.fulfilled, (state, action) => {
//         state.loading = false;
//         state.acceptances = action.payload.data;
//         state.pagination = action.payload.pagination;
//       })
//       .addCase(fetchAcceptanceHistory.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to fetch acceptance history';
//       })

//       // Create Terms
//       .addCase(createTerms.pending, (state) => {
//         state.actionLoading = true;
//         state.error = null;
//       })
//       .addCase(createTerms.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         state.success = 'Terms created successfully';
//         state.terms = [action.payload.data, ...state.terms];
//       })
//       .addCase(createTerms.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.error = action.payload || 'Failed to create terms';
//       })

//       // Update Terms
//       .addCase(updateTerms.pending, (state) => {
//         state.actionLoading = true;
//         state.error = null;
//       })
//       .addCase(updateTerms.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         state.success = 'Terms updated successfully';
//         const updatedTerm = action.payload.data;
//         state.terms = state.terms.map(term => 
//           term.id === updatedTerm.id ? updatedTerm : term
//         );
//         if (state.platformTerms?.id === updatedTerm.id) state.platformTerms = updatedTerm;
//         if (state.privacyPolicy?.id === updatedTerm.id) state.privacyPolicy = updatedTerm;
//         if (state.cancellationPolicy?.id === updatedTerm.id) state.cancellationPolicy = updatedTerm;
//       })
//       .addCase(updateTerms.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.error = action.payload || 'Failed to update terms';
//       })

//       // Delete Terms
//       .addCase(deleteTerms.pending, (state) => {
//         state.actionLoading = true;
//         state.error = null;
//       })
//       .addCase(deleteTerms.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         state.success = action.payload.message;
//         const deletedId = action.meta.arg;
//         state.terms = state.terms.filter(term => term.id !== deletedId);
//         if (state.platformTerms?.id === deletedId) state.platformTerms = null;
//         if (state.privacyPolicy?.id === deletedId) state.privacyPolicy = null;
//         if (state.cancellationPolicy?.id === deletedId) state.cancellationPolicy = null;
//       })
//       .addCase(deleteTerms.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.error = action.payload || 'Failed to delete terms';
//       });
//   },
// });

// export const {
//   clearTermsError,
//   clearTermsSuccess,
//   setTermsFilters,
//   resetTermsFilters,
//   resetTermsState,
// } = termsSlice.actions;

// export default termsSlice.reducer;










// store/slices/termsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, getApiError } from '@/services/apiService';
import {
  TermsAndConditions,
  TermsFilters,
  TermsResponse,
  TermsAcceptance,
  TermsAcceptanceResponse,
  ActiveTermsResponse,
} from '@/types/terms';

interface TermsState {
  // Platform terms
  platformTerms: TermsAndConditions | null;
  privacyPolicy: TermsAndConditions | null;
  cancellationPolicy: TermsAndConditions | null;

  // Lists
  terms: TermsAndConditions[];
  acceptances: TermsAcceptance[];

  // UI States
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: string | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;

  // Filters
  filters: TermsFilters;
  
  // Current term being viewed
  currentTerm: TermsAndConditions | null;
  
  // Acceptance check result
  acceptanceCheck: {
    accepted: boolean;
    termsId: string;
  } | null;
}

const initialState: TermsState = {
  platformTerms: null,
  privacyPolicy: null,
  cancellationPolicy: null,
  terms: [],
  acceptances: [],
  loading: false,
  actionLoading: false,
  error: null,
  success: null,
  pagination: null,
  currentTerm: null,
  acceptanceCheck: null,
  filters: {
    page: 1,
    limit: 10,
    type: undefined,
    is_active: true,
    search: undefined,
    sort_by: 'created_at',
    sort_order: 'DESC',
  },
};

// Public route: Fetch active terms (no auth required)
export const fetchActiveTerms = createAsyncThunk<
  ActiveTermsResponse,
  { type?: string; hotel_id?: string } | undefined,
  { rejectValue: string }
>('terms/fetchActive', async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.hotel_id) queryParams.append('hotel_id', params.hotel_id);

    const { data } = await api.get(`/api/terms/active?${queryParams.toString()}`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to fetch active terms'));
  }
});

// Admin route: Fetch all terms (paginated)
export const fetchAllTerms = createAsyncThunk<
  TermsResponse,
  TermsFilters | undefined,
  { rejectValue: string }
>('terms/fetchAll', async (filters, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    const filterData = filters || {};

    if (filterData.page) params.append('page', filterData.page.toString());
    if (filterData.limit) params.append('limit', filterData.limit.toString());
    if (filterData.type) params.append('type', filterData.type);
    if (filterData.is_active !== undefined) params.append('is_active', filterData.is_active.toString());
    if (filterData.hotel_id) params.append('hotel_id', filterData.hotel_id);
    if (filterData.search) params.append('search', filterData.search);
    if (filterData.sort_by) params.append('sort_by', filterData.sort_by);
    if (filterData.sort_order) params.append('sort_order', filterData.sort_order);

    const { data } = await api.get(`/api/terms?${params.toString()}`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to fetch terms'));
  }
});

// Admin route: Fetch terms by ID
export const fetchTermsById = createAsyncThunk<
  { success: boolean; data: TermsAndConditions },
  string,
  { rejectValue: string }
>('terms/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/api/terms/${id}`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to fetch term'));
  }
});

// Hotel-specific route: Fetch active hotel terms
export const fetchHotelActiveTerms = createAsyncThunk<
  ActiveTermsResponse,
  { type?: string; hotel_id?: string } | undefined,
  { rejectValue: string }
>('terms/fetchHotelActive', async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.hotel_id) queryParams.append('hotel_id', params.hotel_id);

    const { data } = await api.get(`/api/terms/hotel/active?${queryParams.toString()}`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to fetch hotel active terms'));
  }
});

// Hotel admin route: Create hotel-specific terms
export const createHotelTerms = createAsyncThunk<
  { success: boolean; data: TermsAndConditions },
  Partial<TermsAndConditions>,
  { rejectValue: string }
>('terms/createHotel', async (termsData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/terms/hotel', termsData);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to create hotel terms'));
  }
});

// Hotel admin route: Update hotel-specific terms
export const updateHotelTerms = createAsyncThunk<
  { success: boolean; data: TermsAndConditions },
  { id: string; data: Partial<TermsAndConditions> },
  { rejectValue: string }
>('terms/updateHotel', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/api/terms/hotel/${id}`, data);
    return response.data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to update hotel terms'));
  }
});

// Hotel admin route: Delete hotel-specific terms
export const deleteHotelTerms = createAsyncThunk<
  { success: boolean; message: string },
  string,
  { rejectValue: string }
>('terms/deleteHotel', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/api/terms/hotel/${id}`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to delete hotel terms'));
  }
});

// Admin route: Create platform terms
export const createTerms = createAsyncThunk<
  { success: boolean; data: TermsAndConditions },
  Partial<TermsAndConditions>,
  { rejectValue: string }
>('terms/create', async (termsData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/terms', termsData);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to create terms'));
  }
});

// Admin route: Update platform terms
export const updateTerms = createAsyncThunk<
  { success: boolean; data: TermsAndConditions },
  { id: string; data: Partial<TermsAndConditions> },
  { rejectValue: string }
>('terms/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/api/terms/${id}`, data);
    return response.data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to update terms'));
  }
});

// Admin route: Delete platform terms
export const deleteTerms = createAsyncThunk<
  { success: boolean; message: string },
  string,
  { rejectValue: string }
>('terms/delete', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/api/terms/${id}`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to delete terms'));
  }
});

// Hotel admin route: Accept terms
export const acceptTerms = createAsyncThunk<
  { success: boolean; message: string; data: TermsAcceptance },
  { termId: string; userType?: 'hotel_admin' | 'staff' | 'customer' },
  { rejectValue: string }
>('terms/accept', async ({ termId, userType }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/api/terms/${termId}/accept`, { user_type: userType });
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to accept terms'));
  }
});

// Staff route: Accept terms (staff specific)
export const acceptStaffTerms = createAsyncThunk<
  { success: boolean; message: string; data: TermsAcceptance },
  { termId: string; userType?: 'staff' },
  { rejectValue: string }
>('terms/acceptStaff', async ({ termId, userType = 'staff' }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/api/terms/staff/${termId}/accept`, { user_type: userType });
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to accept staff terms'));
  }
});

// Hotel admin route: Check acceptance
export const checkTermsAcceptance = createAsyncThunk<
  { success: boolean; data: { accepted: boolean; termsId: string } },
  string,
  { rejectValue: string }
>('terms/checkAcceptance', async (termId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/api/terms/${termId}/check`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to check acceptance'));
  }
});

// Staff route: Check acceptance (staff specific)
export const checkStaffTermsAcceptance = createAsyncThunk<
  { success: boolean; data: { accepted: boolean; termsId: string } },
  string,
  { rejectValue: string }
>('terms/checkStaffAcceptance', async (termId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/api/terms/staff/${termId}/check`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to check staff acceptance'));
  }
});

// Admin route: Get acceptance history
export const fetchAcceptanceHistory = createAsyncThunk<
  TermsAcceptanceResponse,
  { termId: string; page?: number; limit?: number; user_type?: string },
  { rejectValue: string }
>('terms/fetchAcceptanceHistory', async ({ termId, page = 1, limit = 10, user_type }, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (user_type) params.append('user_type', user_type);

    const { data } = await api.get(`/api/terms/${termId}/acceptances?${params.toString()}`);
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiError(err, 'Failed to fetch acceptance history'));
  }
});

const termsSlice = createSlice({
  name: 'terms',
  initialState,
  reducers: {
    clearTermsError: (state) => {
      state.error = null;
    },
    clearTermsSuccess: (state) => {
      state.success = null;
    },
    setTermsFilters: (state, action: PayloadAction<Partial<TermsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetTermsFilters: (state) => {
      state.filters = initialState.filters;
    },
    resetTermsState: () => initialState,
    clearCurrentTerm: (state) => {
      state.currentTerm = null;
    },
    clearAcceptanceCheck: (state) => {
      state.acceptanceCheck = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Active Terms (Public)
      .addCase(fetchActiveTerms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveTerms.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          // Handle both single term and array of terms
          const terms = Array.isArray(action.payload.data) 
            ? action.payload.data 
            : [action.payload.data];
          
          terms.forEach(term => {
            if (term.type === 'platform') {
              state.platformTerms = term;
            } else if (term.type === 'privacy') {
              state.privacyPolicy = term;
            } else if (term.type === 'cancellation') {
              state.cancellationPolicy = term;
            }
          });
        }
      })
      .addCase(fetchActiveTerms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch active terms';
      })

      // Fetch Hotel Active Terms
      .addCase(fetchHotelActiveTerms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelActiveTerms.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const terms = Array.isArray(action.payload.data) 
            ? action.payload.data 
            : [action.payload.data];
          state.terms = terms;
        }
      })
      .addCase(fetchHotelActiveTerms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch hotel active terms';
      })

      // Fetch All Terms (Admin)
      .addCase(fetchAllTerms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTerms.fulfilled, (state, action) => {
        state.loading = false;
        state.terms = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllTerms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch terms';
      })

      // Fetch Terms By ID
      .addCase(fetchTermsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTermsById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTerm = action.payload.data;
        const term = action.payload.data;
        if (term.type === 'platform') {
          state.platformTerms = term;
        } else if (term.type === 'privacy') {
          state.privacyPolicy = term;
        } else if (term.type === 'cancellation') {
          state.cancellationPolicy = term;
        }
      })
      .addCase(fetchTermsById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch term';
      })

      // Accept Terms (Hotel Admin)
      .addCase(acceptTerms.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(acceptTerms.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = action.payload.message;
        state.acceptances = [action.payload.data, ...state.acceptances];
      })
      .addCase(acceptTerms.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to accept terms';
      })

      // Accept Staff Terms
      .addCase(acceptStaffTerms.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(acceptStaffTerms.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = action.payload.message;
        state.acceptances = [action.payload.data, ...state.acceptances];
      })
      .addCase(acceptStaffTerms.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to accept staff terms';
      })

      // Check Terms Acceptance
      .addCase(checkTermsAcceptance.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(checkTermsAcceptance.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.acceptanceCheck = action.payload.data;
      })
      .addCase(checkTermsAcceptance.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to check acceptance';
      })

      // Check Staff Terms Acceptance
      .addCase(checkStaffTermsAcceptance.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(checkStaffTermsAcceptance.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.acceptanceCheck = action.payload.data;
      })
      .addCase(checkStaffTermsAcceptance.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to check staff acceptance';
      })

      // Fetch Acceptance History
      .addCase(fetchAcceptanceHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcceptanceHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.acceptances = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAcceptanceHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch acceptance history';
      })

      // Create Terms (Admin)
      .addCase(createTerms.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createTerms.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = 'Terms created successfully';
        state.terms = [action.payload.data, ...state.terms];
      })
      .addCase(createTerms.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to create terms';
      })

      // Create Hotel Terms (Hotel Admin)
      .addCase(createHotelTerms.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createHotelTerms.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = 'Hotel terms created successfully';
        state.terms = [action.payload.data, ...state.terms];
      })
      .addCase(createHotelTerms.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to create hotel terms';
      })

      // Update Terms (Admin)
      .addCase(updateTerms.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateTerms.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = 'Terms updated successfully';
        const updatedTerm = action.payload.data;
        state.terms = state.terms.map(term => 
          term.id === updatedTerm.id ? updatedTerm : term
        );
        if (state.currentTerm?.id === updatedTerm.id) state.currentTerm = updatedTerm;
        if (state.platformTerms?.id === updatedTerm.id) state.platformTerms = updatedTerm;
        if (state.privacyPolicy?.id === updatedTerm.id) state.privacyPolicy = updatedTerm;
        if (state.cancellationPolicy?.id === updatedTerm.id) state.cancellationPolicy = updatedTerm;
      })
      .addCase(updateTerms.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to update terms';
      })

      // Update Hotel Terms (Hotel Admin)
      .addCase(updateHotelTerms.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateHotelTerms.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = 'Hotel terms updated successfully';
        const updatedTerm = action.payload.data;
        state.terms = state.terms.map(term => 
          term.id === updatedTerm.id ? updatedTerm : term
        );
        if (state.currentTerm?.id === updatedTerm.id) state.currentTerm = updatedTerm;
      })
      .addCase(updateHotelTerms.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to update hotel terms';
      })

      // Delete Terms (Admin)
      .addCase(deleteTerms.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteTerms.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = action.payload.message;
        const deletedId = action.meta.arg;
        state.terms = state.terms.filter(term => term.id !== deletedId);
        if (state.currentTerm?.id === deletedId) state.currentTerm = null;
        if (state.platformTerms?.id === deletedId) state.platformTerms = null;
        if (state.privacyPolicy?.id === deletedId) state.privacyPolicy = null;
        if (state.cancellationPolicy?.id === deletedId) state.cancellationPolicy = null;
      })
      .addCase(deleteTerms.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to delete terms';
      })

      // Delete Hotel Terms (Hotel Admin)
      .addCase(deleteHotelTerms.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteHotelTerms.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = action.payload.message;
        const deletedId = action.meta.arg;
        state.terms = state.terms.filter(term => term.id !== deletedId);
        if (state.currentTerm?.id === deletedId) state.currentTerm = null;
      })
      .addCase(deleteHotelTerms.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to delete hotel terms';
      });
  },
});

export const {
  clearTermsError,
  clearTermsSuccess,
  setTermsFilters,
  resetTermsFilters,
  resetTermsState,
  clearCurrentTerm,
  clearAcceptanceCheck,
} = termsSlice.actions;

export default termsSlice.reducer;