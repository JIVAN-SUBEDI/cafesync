import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {getApiError} from "@/services/apiService";
import { adminApi } from "@/services/adminApi";

// ===== Types =====
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  is_active?: boolean;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

type Status = "idle" | "loading" | "succeeded" | "failed";

interface AdminAuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  status: Status;
  error: string | null;
  checking: boolean; // initial auth check
}

const initialState: AdminAuthState = {
  admin: null,
  isAuthenticated: false,
  status: "idle",
  error: null,
  checking: true,
};


export const loginAdmin = createAsyncThunk<
  AdminUser,
  AdminLoginPayload,
  { rejectValue: string }
>("adminAuth/login", async (payload, thunkApi) => {
  try {
    // Use /auth/login (not /api/auth/admin/login)
    const { data } = await adminApi.post("/api/auth/admin/login", {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    });

    if (!data?.success || !data?.user) {
      return thunkApi.rejectWithValue(data?.message || "Login failed");
    }

    return data.user;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getApiError(err, "Login failed"));
  }
});

export const fetchAdminProfile = createAsyncThunk<
  AdminUser,
  void,
  { rejectValue: string }
>("adminAuth/profile", async (_, thunkApi) => {
  try {
    // Use /auth/profile (not /api/auth/admin/profile)
    const { data } = await adminApi.get("/api/auth/admin/profile");

    if (!data?.success || !data?.admin) {
      return thunkApi.rejectWithValue("Not authenticated");
    }

    return data.admin;
  } catch (err: any) {
    if (err?.response?.status === 401) {
      return thunkApi.rejectWithValue("Not authenticated");
    }
    return thunkApi.rejectWithValue(getApiError(err, "Failed to load profile"));
  }
});

export const refreshAdminSession = createAsyncThunk<
  boolean,
  void,
  { rejectValue: string }
>("adminAuth/refresh", async (_, thunkApi) => {
  try {
    // Use /auth/refresh (not /api/auth/admin/refresh)
    const { data } = await adminApi.post("/api/auth/admin/refresh");
    
    if (!data?.success) {
      return thunkApi.rejectWithValue(data?.message || "Refresh failed");
    }
    return true;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getApiError(err, "Refresh failed"));
  }
});

export const logoutAdmin = createAsyncThunk<void, void, { rejectValue: string }>(
  "adminAuth/logout",
  async (_, thunkApi) => {
    try {
      // Use /auth/logout (not /api/auth/admin/logout)
      await adminApi.post("/api/auth/admin/logout");
    } catch (err: any) {
      return thunkApi.rejectWithValue(getApiError(err, "Logout failed"));
    }
  }
);

// ===== Slice =====
const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
    setChecking(state, action: PayloadAction<boolean>) {
      state.checking = action.payload;
    },
    clearAdminState(state) {
      state.admin = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
      state.checking = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ----- profile -----
      .addCase(fetchAdminProfile.pending, (state) => {
        state.checking = true;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.checking = false;
        state.admin = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchAdminProfile.rejected, (state) => {
        state.checking = false;
        state.admin = null;
        state.isAuthenticated = false;
      })

      // ----- login -----
      .addCase(loginAdmin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.admin = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = "failed";
        state.admin = null;
        state.isAuthenticated = false;
        state.error = action.payload || "Login failed";
      })

      // ----- refresh -----
      .addCase(refreshAdminSession.fulfilled, (state) => {
        // nothing else needed, cookies updated
        state.error = null;
      })
      .addCase(refreshAdminSession.rejected, (state) => {
        // refresh failed -> force logout state
        state.admin = null;
        state.isAuthenticated = false;
      })

      // ----- logout -----
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.admin = null;
        state.isAuthenticated = false;
        state.status = "idle";
        state.error = null;
      })
      .addCase(logoutAdmin.rejected, (state) => {
        state.admin = null;
        state.isAuthenticated = false;
        state.status = "idle";
      });
  },
});

export const { clearAdminError, setChecking, clearAdminState } =
  adminAuthSlice.actions;

export default adminAuthSlice.reducer;