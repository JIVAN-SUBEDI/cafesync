// import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
// import axios from "axios";

// type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled";

// export type TenantHotel = {
//   id: string;
//   name: string;
//   slug: string;
//   subscription_status?: SubscriptionStatus;
// };

// type TenantState = {
//   slugInput: string;
//   tenant: TenantHotel | null;
//   status: "idle" | "loading" | "succeeded" | "failed";
//   error: string | null;
// };

// const initialState: TenantState = {
//   slugInput: "",
//   tenant: null,
//   status: "idle",
//   error: null,
// };

// // Create axios instance (nice for baseURL)
// const api = axios.create({
//   baseURL: "http://localhost:4000",
//   headers: { "Content-Type": "application/json" },
//   withCredentials: false,
// });

// export const checkSlugExists = createAsyncThunk<
//   TenantHotel,
//   { slug: string },
//   { rejectValue: string }
// >("tenant/checkSlugExists", async ({ slug }, thunkApi) => {
//   const clean = slug.trim().toLowerCase();

//   // Optional (recommended) validation on frontend too:
//   // if (!clean) return thunkApi.rejectWithValue("Slug is required.");
//   // if (!/^[a-z0-9-]{2,100}$/.test(clean)) {
//   //   return thunkApi.rejectWithValue("Invalid slug format (use a-z, 0-9, hyphen).");
//   // }

//   try {
//     // ✅ IMPORTANT: use route param, not slug=...
//     // If your backend is: /api/hotel/exists/:slug
//     const { data } = await api.get(`/api/hotel/exists/${encodeURIComponent(clean)}`);

//     console.log("checkSlugExists response data:", data);

//     if (!data?.exists) {
//       return thunkApi.rejectWithValue(data?.message || "Slug not found.");
//     }

//     const hotel = data?.hotel;
//     if (!hotel?.id || !hotel?.slug) {
//       return thunkApi.rejectWithValue("Invalid server response.");
//     }

//     return {
//       id: hotel.id,
//       name: hotel.name ?? "",
//       slug: hotel.slug,
//       subscription_status: hotel.subscription_status,
//     };
//   } catch (err: any) {
//     // Axios error parsing
//     const message =
//       err?.response?.data?.message ||
//       err?.message ||
//       "Network error. Please try again.";

//     return thunkApi.rejectWithValue(message);
//   }
// });

// const tenantSlice = createSlice({
//   name: "tenant",
//   initialState,
//   reducers: {
//     setSlugInput(state, action: PayloadAction<string>) {
//       state.slugInput = action.payload;
//     },
//     clearTenant(state) {
//       state.tenant = null;
//       state.status = "idle";
//       state.error = null;
//     },
//     clearTenantError(state) {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(checkSlugExists.pending, (state) => {
//         state.status = "loading";
//         state.error = null;
//         state.tenant = null;
//       })
//       .addCase(checkSlugExists.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.tenant = action.payload;
//         state.error = null;
//       })
//       .addCase(checkSlugExists.rejected, (state, action) => {
//         state.status = "failed";
//         state.tenant = null;
//         state.error = action.payload || "Something went wrong.";
//       });
//   },
// });

// export const { setSlugInput, clearTenant, clearTenantError } = tenantSlice.actions;
// export default tenantSlice.reducer;




import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api, getApiError } from "@/services/api";

export type AnyObj = Record<string, any>;

type TenantState = {
  slugInput: string;
  tenant: AnyObj | null; // ✅ full hotel summary
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: TenantState = {
  slugInput: "",
  tenant: null,
  status: "idle",
  error: null,
};

export const checkSlugExists = createAsyncThunk<
  AnyObj,
  { slug: string },
  { rejectValue: string }
>("tenant/checkSlugExists", async ({ slug }, thunkApi) => {
  try {
    const clean = slug.trim().toLowerCase();
    const { data } = await api.get(`/api/hotel/exists/${encodeURIComponent(clean)}`);

    if (!data?.exists) {
      return thunkApi.rejectWithValue(data?.message || "Slug not found");
    }
    console.log('this is slice data:- ', data)
    // ✅ keep entire hotel object
    return data.hotel;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getApiError(err, "Slug check failed"));
  }
});

const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  reducers: {
    setSlugInput(state, action: PayloadAction<string>) {
      state.slugInput = action.payload;
    },
    clearTenant(state) {
      state.tenant = null;
      state.status = "idle";
      state.error = null;
    },
    clearTenantError(state) {
      state.error = null;
    },
    slugData(state, action){
      state.tenant= action.payload;
    }

  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSlugExists.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.tenant = null;
      })
      .addCase(checkSlugExists.fulfilled, (state, action: PayloadAction<AnyObj>) => {
        state.status = "succeeded";
        state.tenant = action.payload;
      })
      .addCase(checkSlugExists.rejected, (state, action) => {
        state.status = "failed";
        state.tenant = null;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { setSlugInput, clearTenant, clearTenantError, slugData } = tenantSlice.actions;
export default tenantSlice.reducer;
