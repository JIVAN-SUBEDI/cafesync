// store/slices/hotelAuthSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api, getApiError } from "@/services/api";
import Cookies from "js-cookie";

export type AnyObj = Record<string, any>;

export interface AuthStatusResponse {
  success: boolean;
  isAuthenticated: boolean;
  user?: {
    role: string;
    id: string;
    hotel_slug: string;
    hotel_name: string;
    admin_email: string;
    admin_name: string;
    subscription_status: string;
  };
  hotel?: AnyObj;
  message?: string;
}

export interface HotelAuthUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  hotel_id?: string;
  hotel_slug?: string;
}

export interface HotelRegistrationData {
  hotel_name: string;
  hotel_slug: string;
  admin_email: string;
  admin_password: string;
  admin_name: string;
  admin_phone?: string;
  hotel_phone?: string;
  hotel_address?: string;
  image?: File | null;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  tax_rate?: number;
  service_charge?: number;
  subscription_plan_id?: string;
}

export type RegisterHotelResponse = AnyObj & {
  success: boolean;
  hotel_slug?: string;
  hotel?: AnyObj;
  message?: string;
  session?: {
    id: string;
    expires_at: string;
    is_remembered: boolean;
  };
  redirect_to?: string;
};

export type LoginHotelResponse = {
  success: boolean;
  message?: string;
  data?: {
    user: HotelAuthUser;
    hotel: Hotel;
    hotel_slug?: string;
    redirect_to?: string;
    session?: {
      id: string;
      expires_at: string;
      is_remembered: boolean;
    };
    token?: string;
    refresh_token?: string | null;
  };
  error?: string;
  retryAfter?: number;
  lockoutExpires?: string;
};

export interface Hotel {
  id: string;
  hotel_name: string;
  hotel_slug: string;
  hotel_img?: string | null;
  hotel_phone?: string | null;
  hotel_address?: string | null;

  city?: string | null;
  country?: string | null;
  timezone: string;
  currency: string;

  tax_rate: string | number;
  service_charge: string | number;

  subscription_plan_id?: string | null;
  billing_cycle?: "monthly" | "yearly" | string;
  registration_type?: "trial" | "subscription" | string;
  payment_method?: string | null;
  subscription_status: "trial" | "active" | "suspended" | "cancelled" | string;
  payment_status?: "paid" | "unpaid" | "pending" | string;

  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  trial_starts_at?: string | null;
  trial_ends_at?: string | null;

  max_staff_allowed?: number;
  max_tables_allowed?: number;
  max_menu_items_allowed?: number;

  is_active: boolean;
  is_verified: boolean;
  accept_marketing?: boolean;

  created_at: string;
  updated_at: string;

  plan_name?: string | null;
  plan_code?: string | null;
  price_per_year?: string | number | null;
  price_per_month?: string | number | null;
  features?: Record<string, boolean>;

  plan_max_staff?: number;
  plan_max_tables?: number;
  plan_max_menu_items?: number;
}

type HotelAuthState = {
  user: HotelAuthUser | null;
  hotel: Hotel | null;
  hotelSlug: string | null;
  token: string | null;
  isAuthenticated: boolean;
  session: {
    id: string | null;
    expires_at: string | null;
    is_remembered: boolean;
  } | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastResponse: AnyObj | null;
  redirectTo: string | null;
  authCheckLoading: boolean;
  loading: boolean;
};

const initialState: HotelAuthState = {
  user: null,
  hotel: null,
  hotelSlug: null,
  token: null,
  isAuthenticated: false,
  session: null,
  status: "idle",
  error: null,
  lastResponse: null,
  redirectTo: null,
  authCheckLoading: true,
  loading: false,
};

const setHotelSlugCookie = (slug: string, remembered = false) => {
  Cookies.set("hotel_slug", slug, {
    expires: remembered ? 30 : 7,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};

const clearHotelSlugCookie = () => {
  Cookies.remove("hotel_slug");
};

export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, thunkApi) => {
    try {
      const res = await api.get("/api/hotel/auth/status", {
        withCredentials: true,
      });

      return res.data; // ✅ NOT res.data.data
    } catch (err) {
      return thunkApi.rejectWithValue("Auth failed");
    }
  }
);

export const registerHotel = createAsyncThunk<
  RegisterHotelResponse,
  HotelRegistrationData,
  { rejectValue: string }
>("hotelAuth/registerHotel", async (payload, thunkApi) => {
  try {
    const formData = new FormData();

    formData.append("hotel_name", payload.hotel_name);
    formData.append("hotel_slug", payload.hotel_slug);
    formData.append("admin_email", payload.admin_email);
    formData.append("admin_password", payload.admin_password);
    formData.append("admin_name", payload.admin_name);

    if (payload.admin_phone) formData.append("admin_phone", payload.admin_phone);
    if (payload.hotel_phone) formData.append("hotel_phone", payload.hotel_phone);
    if (payload.hotel_address) formData.append("hotel_address", payload.hotel_address);
    if (payload.city) formData.append("city", payload.city);
    if (payload.country) formData.append("country", payload.country);
    if (payload.timezone) formData.append("timezone", payload.timezone);
    if (payload.currency) formData.append("currency", payload.currency);
    if (payload.tax_rate !== undefined) formData.append("tax_rate", String(payload.tax_rate));
    if (payload.service_charge !== undefined) {
      formData.append("service_charge", String(payload.service_charge));
    }
    if (payload.subscription_plan_id) {
      formData.append("subscription_plan_id", payload.subscription_plan_id);
    }
    if (payload.image) {
      formData.append("image", payload.image);
    }

    const { data } = await api.post("/api/hotel/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });

    return data;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getApiError(err, "Registration failed"));
  }
});

export const loginHotel = createAsyncThunk<
  LoginHotelResponse,
  { email: string; password: string; rememberMe?: boolean; slug: string },
  {
    rejectValue: {
      message: string;
      error?: string;
      retryAfter?: number;
      lockoutExpires?: string;
    };
  }
>("hotelAuth/loginHotel", async (payload, thunkApi) => {
  try {
    const response = await api.post("/api/hotel/login", payload, {
      withCredentials: true,
    });

    const data = response.data;
    console.log(data)

    if (!data.success && data.error) {
      return thunkApi.rejectWithValue({
        message: data.message || "Login failed",
        error: data.error,
        retryAfter: data.retryAfter,
        lockoutExpires: data.lockoutExpires,
      });
    }

    return data;
  } catch (err: any) {
    const errorData = err.response?.data;

    if (errorData && errorData.error) {
      return thunkApi.rejectWithValue({
        message: errorData.message || "Login failed",
        error: errorData.error,
        retryAfter: errorData.retryAfter,
        lockoutExpires: errorData.lockoutExpires,
      });
    }

    return thunkApi.rejectWithValue({
      message: getApiError(err, "Login failed"),
    });
  }
});

export const fetchMyHotel = createAsyncThunk<
  Hotel,
  void,
  { rejectValue: string }
>("hotelAuth/fetchMyHotel", async (_, thunkApi) => {
  try {
    const { data } = await api.get("/api/hotel/me", {
      withCredentials: true,
    });
    return data.hotel ?? data;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getApiError(err, "Not logged in"));
  }
});

export const logoutHotel = createAsyncThunk<void, void, { rejectValue: string }>(
  "hotelAuth/logoutHotel",
  async (_, thunkApi) => {
    try {
      await api.post(
        "/api/hotel/logout",
        {},
        {
          withCredentials: true,
        }
      );
    } catch (err: any) {
      return thunkApi.rejectWithValue(getApiError(err, "Logout failed"));
    }
  }
);

export const refreshSession = createAsyncThunk<
  LoginHotelResponse,
  void,
  { rejectValue: string }
>("hotelAuth/refreshSession", async (_, thunkApi) => {
  try {
    const { data } = await api.post(
      "/api/hotel/auth/refresh",
      {},
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getApiError(err, "Session refresh failed"));
  }
});

export const updateHotelProfile = createAsyncThunk<
  Hotel,
  Partial<Hotel>,
  { rejectValue: string }
>("hotelAuth/updateHotelProfile", async (hotelData, thunkApi) => {
  try {
    const { data } = await api.put("/api/hotel/profile", hotelData, {
      withCredentials: true,
    });

    return data.hotel || data;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getApiError(err, "Failed to update profile"));
  }
});
export const updateMyProfile = createAsyncThunk(
  'dashboard/updateMyProfile',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await api.put('/api/hotel/accounts/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: 'Failed to update profile' }
      )
    }
  }
);
const hotelAuthSlice = createSlice({
  name: "hotelAuth",
  initialState,
  reducers: {
    clearHotelAuthError(state) {
      state.error = null;
    },

    setHotel(state, action: PayloadAction<Hotel | null>) {
      state.hotel = action.payload;
      state.isAuthenticated = !!action.payload;

      if (action.payload?.hotel_slug) {
        state.hotelSlug = action.payload.hotel_slug;
        setHotelSlugCookie(action.payload.hotel_slug);
      } else if (!action.payload) {
        state.hotelSlug = null;
        clearHotelSlugCookie();
      }
    },

    setHotelSlug(state, action: PayloadAction<string | null>) {
      state.hotelSlug = action.payload;

      if (action.payload) {
        setHotelSlugCookie(action.payload);
      } else {
        clearHotelSlugCookie();
      }
    },

    setRedirectTo(state, action: PayloadAction<string | null>) {
      state.redirectTo = action.payload;
    },

    clearRedirectTo(state) {
      state.redirectTo = null;
    },

    setAuthCheckComplete(state) {
      state.authCheckLoading = false;
    },

    clearAuthState(state) {
      state.user = null;
      state.hotel = null;
      state.hotelSlug = null;
      state.token = null;
      state.isAuthenticated = false;
      state.session = null;
      state.status = "idle";
      state.error = null;
      state.lastResponse = null;
      state.redirectTo = null;
      state.authCheckLoading = false;
      state.loading = false;
      clearHotelSlugCookie();
    },

    updateHotelInState(state, action: PayloadAction<Partial<Hotel>>) {
      if (state.hotel) {
        state.hotel = { ...state.hotel, ...action.payload };
        if (action.payload.hotel_slug) {
          state.hotelSlug = action.payload.hotel_slug;
          setHotelSlugCookie(action.payload.hotel_slug);
        }
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // CHECK AUTH STATUS
      .addCase(checkAuthStatus.pending, (state) => {
        state.authCheckLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        const data = action.payload.data;

        state.isAuthenticated = data.isAuthenticated;
        state.user = data.user;
        state.hotel = data.hotel;
        state.hotelSlug = data.hotel_slug;
        state.redirectTo = data.redirect_to;

        state.authCheckLoading = false;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.authCheckLoading = false;
        // state.error = action.payload || "Auth check failed";
        state.user = null;
        state.hotel = null;
        state.hotelSlug = null;
        state.token = null;
        state.isAuthenticated = false;
        state.session = null;
        clearHotelSlugCookie();
      })

      // REGISTER
      .addCase(registerHotel.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(registerHotel.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.lastResponse = action.payload;
        state.hotel = (action.payload.hotel as Hotel) ?? null;
        state.hotelSlug = action.payload.hotel_slug || action.payload.hotel?.hotel_slug || null;
        state.isAuthenticated = !!state.hotel;
        state.session = action.payload.session || null;
        state.redirectTo = action.payload.redirect_to || null;

        if (state.hotelSlug) {
          setHotelSlugCookie(
            state.hotelSlug,
            !!action.payload.session?.is_remembered
          );
        }
      })
      .addCase(registerHotel.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Registration failed";
        state.user = null;
        state.hotel = null;
        state.hotelSlug = null;
        state.token = null;
        state.isAuthenticated = false;
        state.session = null;
        clearHotelSlugCookie();
      })

      // LOGIN
      .addCase(loginHotel.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(loginHotel.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.lastResponse = action.payload;

        const payload = action.payload.data;

        state.user = payload?.user ?? null;
        state.hotel = payload?.hotel ?? null;
        state.hotelSlug = payload?.hotel_slug || payload?.hotel?.hotel_slug || null;
        state.token = payload?.token || null;
        state.isAuthenticated = !!payload?.user;
        state.session = payload?.session || null;
        state.redirectTo = payload?.redirect_to || null;

        if (state.hotelSlug) {
          setHotelSlugCookie(
            state.hotelSlug,
            !!payload?.session?.is_remembered
          );
        }
      })
      .addCase(loginHotel.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
        state.user = null;
        state.hotel = null;
        state.hotelSlug = null;
        state.token = null;
        state.isAuthenticated = false;
        state.session = null;
        state.redirectTo = null;
        clearHotelSlugCookie();
      })

      // FETCH MY HOTEL
      .addCase(fetchMyHotel.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.hotel = action.payload;
        state.hotelSlug = action.payload.hotel_slug || state.hotelSlug;
        state.isAuthenticated = true;

        // optional fallback user hydration if user is missing
        if (!state.user) {
          state.user = {
            id: action.payload.id,
            email: action.payload.admin_email,
            full_name: action.payload.admin_name,
            role: "hotel_admin",
            hotel_id: action.payload.id,
            hotel_slug: action.payload.hotel_slug,
          };
        }

        if (state.hotelSlug) {
          setHotelSlugCookie(state.hotelSlug, !!state.session?.is_remembered);
        }
      })
      .addCase(fetchMyHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Not logged in";
        state.user = null;
        state.hotel = null;
        state.hotelSlug = null;
        state.token = null;
        state.isAuthenticated = false;
        state.session = null;
        clearHotelSlugCookie();
      })

      // LOGOUT
      .addCase(logoutHotel.pending, (state) => {
        state.status = "loading";
        state.loading = true;
      })
      .addCase(logoutHotel.fulfilled, (state) => {
        state.user = null;
        state.hotel = null;
        state.hotelSlug = null;
        state.token = null;
        state.isAuthenticated = false;
        state.session = null;
        state.status = "idle";
        state.loading = false;
        state.error = null;
        state.lastResponse = null;
        state.redirectTo = null;
        clearHotelSlugCookie();
      })
      .addCase(logoutHotel.rejected, (state) => {
        state.user = null;
        state.hotel = null;
        state.hotelSlug = null;
        state.token = null;
        state.isAuthenticated = false;
        state.session = null;
        state.status = "idle";
        state.loading = false;
        state.error = null;
        state.lastResponse = null;
        state.redirectTo = null;
        clearHotelSlugCookie();
      })

      // REFRESH SESSION
      .addCase(refreshSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.loading = false;

        const payload = action.payload.data;

        state.user = payload?.user ?? null;
        state.hotel = payload?.hotel ?? null;
        state.hotelSlug = payload?.hotel_slug || payload?.hotel?.hotel_slug || null;
        state.token = payload?.token || null;
        state.isAuthenticated = !!payload?.user;
        state.session = payload?.session || null;
        state.redirectTo = payload?.redirect_to || null;

        if (state.hotelSlug) {
          setHotelSlugCookie(
            state.hotelSlug,
            !!payload?.session?.is_remembered
          );
        }
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Session refresh failed";
        state.user = null;
        state.hotel = null;
        state.hotelSlug = null;
        state.token = null;
        state.isAuthenticated = false;
        state.session = null;
        state.redirectTo = null;
        clearHotelSlugCookie();
      })

      // UPDATE HOTEL PROFILE
      .addCase(updateHotelProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHotelProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.hotel = action.payload;
        state.hotelSlug = action.payload.hotel_slug || state.hotelSlug;
        state.error = null;

        if (state.hotelSlug) {
          setHotelSlugCookie(state.hotelSlug, !!state.session?.is_remembered);
        }
      })
      .addCase(updateHotelProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update profile";
      });
  },
});

export const {
  clearHotelAuthError,
  setHotel,
  setHotelSlug,
  setRedirectTo,
  clearRedirectTo,
  setAuthCheckComplete,
  clearAuthState,
  updateHotelInState,
} = hotelAuthSlice.actions;

export default hotelAuthSlice.reducer;