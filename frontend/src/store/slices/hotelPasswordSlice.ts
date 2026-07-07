// // store/slices/hotelPasswordSlice.ts (updated thunks)
// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { api, getApiError } from '@/services/apiService';
// import {
//   OTPState,
//   OTPRequestResponse,
//   OTPVerifyResponse,
//   PasswordChangeResponse,
//   OTPRequestPayload,
//   OTPVerifyPayload,
//   PasswordChangePayload,
//   ApiError,
// } from '@/types/hotelPassword';

// const initialState: OTPState = {
//   step: 'request',
//   otp: '',
//   tempToken: null,
//   newPassword: '',
//   confirmPassword: '',
//   isLoading: false,
//   error: null,
//   message: null,
//   countdown: 0,
//   expiresAt: null,
// };


// // Request OTP with hotel slug
// export const requestOTP = createAsyncThunk<
//   OTPRequestResponse,
//   OTPRequestPayload | undefined,
//   { rejectValue: ApiError }
// >('hotelPassword/requestOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/request-password-change-otp', payload);
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to request OTP'),
//       status: err?.response?.status,
//     });
//   }
// });

// // Resend OTP with hotel slug
// export const resendOTP = createAsyncThunk<
//   OTPRequestResponse,
//   OTPRequestPayload | undefined,
//   { rejectValue: ApiError }
// >('hotelPassword/resendOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/resend-password-change-otp', payload);
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to resend OTP'),
//       status: err?.response?.status,
//     });
//   }
// });

// // Verify OTP with hotel slug
// export const verifyOTP = createAsyncThunk<
//   OTPVerifyResponse,
//   OTPVerifyPayload,
//   { rejectValue: ApiError }
// >('hotelPassword/verifyOTP', async ({ otp }, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/verify-password-change-otp', { otp });
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to verify OTP'),
//       status: err?.response?.status,
//     });
//   }
// });

// // Change Password with OTP and hotel slug
// export const changePasswordWithOTP = createAsyncThunk<
//   PasswordChangeResponse,
//   PasswordChangePayload,
//   { rejectValue: ApiError }
// >('hotelPassword/changeWithOTP', async ({ new_password, tempToken }, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/change-password-with-otp', {
//       new_password,
//       tempToken,
//     });
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to change password'),
//       status: err?.response?.status,
//     });
//   }
// });

// // Change Password with Old Password
// export const changePasswordWithOld = createAsyncThunk<
//   PasswordChangeResponse,
//   { old_password: string; new_password: string },
//   { rejectValue: ApiError }
// >('hotelPassword/changeWithOld', async ({ old_password, new_password }, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/change-password', {
//       old_password,
//       new_password,
//     });
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to change password'),
//       status: err?.response?.status,
//     });
//   }
// });

// const hotelPasswordSlice = createSlice({
//   name: 'hotelPassword',
//   initialState,
//   reducers: {
//     setStep: (state, action: PayloadAction<OTPState['step']>) => {
//       state.step = action.payload;
//     },
//     setOtp: (state, action: PayloadAction<string>) => {
//       state.otp = action.payload;
//     },
//     setNewPassword: (state, action: PayloadAction<string>) => {
//       state.newPassword = action.payload;
//     },
//     setConfirmPassword: (state, action: PayloadAction<string>) => {
//       state.confirmPassword = action.payload;
//     },
//     setCountdown: (state, action: PayloadAction<number>) => {
//       state.countdown = action.payload;
//     },
//     setExpiresAt: (state, action: PayloadAction<number | null>) => {
//       state.expiresAt = action.payload;
//     },
//     clearMessages: (state) => {
//       state.error = null;
//       state.message = null;
//     },
//     resetState: () => initialState,
//   },
//   extraReducers: (builder) => {
//     builder
//       // Request OTP
//       .addCase(requestOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(requestOTP.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.step = 'verify';
//         state.message = action.payload.message;
//         state.countdown = action.payload.expiresIn;
//         state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
//       })
//       .addCase(requestOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to request OTP';
//       })

//       // Resend OTP
//       .addCase(resendOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(resendOTP.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.message = action.payload.message;
//         state.countdown = action.payload.expiresIn;
//         state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
//         state.otp = ''; // Clear OTP for new entry
//       })
//       .addCase(resendOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to resend OTP';
//       })

//       // Verify OTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.step = 'change';
//         state.tempToken = action.payload.tempToken;
//         state.message = action.payload.message;
//         state.countdown = action.payload.expiresIn;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to verify OTP';
//       })

//       // Change Password with OTP
//       .addCase(changePasswordWithOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(changePasswordWithOTP.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.step = 'success';
//         state.message = action.payload.message;
//         state.newPassword = '';
//         state.confirmPassword = '';
//         state.otp = '';
//         state.tempToken = null;
//       })
//       .addCase(changePasswordWithOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to change password';
//       })

//       // Change Password with Old
//       .addCase(changePasswordWithOld.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(changePasswordWithOld.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.step = 'success';
//         state.message = action.payload.message;
//         state.newPassword = '';
//         state.confirmPassword = '';
//       })
//       .addCase(changePasswordWithOld.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to change password';
//       });
//   },
// });

// export const {
//   setStep,
//   setOtp,
//   setNewPassword,
//   setConfirmPassword,
//   setCountdown,
//   setExpiresAt,
//   clearMessages,
//   resetState,
// } = hotelPasswordSlice.actions;

// export default hotelPasswordSlice.reducer;





// // store/slices/hotelPasswordSlice.ts
// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { api, getApiError } from '@/services/apiServiceForPasswordChange';
// import type {
//   OTPState,
//   OTPRequestResponse,
//   OTPVerifyResponse,
//   PasswordChangeResponse,
//   OTPRequestPayload,
//   OTPVerifyPayload,
//   PasswordChangePayload,
//   ApiError,
// } from '@/types/hotelPassword'; // <- make sure this path matches your actual file

// const initialState: OTPState = {
//   step: 'request',
//   otp: '',
//   tempToken: null,
//   newPassword: '',
//   confirmPassword: '',
//   isLoading: false,
//   error: null,
//   message: null,
//   countdown: 0,
//   expiresAt: null,
// };

// // Request OTP
// export const requestOTP = createAsyncThunk<
//   OTPRequestResponse,
//   OTPRequestPayload,
//   { rejectValue: ApiError }
// >('hotelPassword/requestOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/auth/request-password-change-otp', {
//       admin_email: payload.admin_email,
//     });
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to request OTP'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Resend OTP
// export const resendOTP = createAsyncThunk<
//   OTPRequestResponse,
//   OTPRequestPayload,
//   { rejectValue: ApiError }
// >('hotelPassword/resendOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/auth/resend-password-change-otp', {
//       admin_email: payload.admin_email,
//     });
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to resend OTP'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Verify OTP
// export const verifyOTP = createAsyncThunk<
//   OTPVerifyResponse,
//   OTPVerifyPayload,
//   { rejectValue: ApiError }
// >('hotelPassword/verifyOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/auth/verify-password-change-otp', {
//       otp: payload.otp,
//     });
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to verify OTP'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Change password with OTP
// export const changePasswordWithOTP = createAsyncThunk<
//   PasswordChangeResponse,
//   PasswordChangePayload,
//   { rejectValue: ApiError }
// >('hotelPassword/changeWithOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/auth/change-password-with-otp', {
//       new_password: payload.new_password,
//       tempToken: payload.tempToken,
//     });
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to change password'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Change password with old password
// export const changePasswordWithOld = createAsyncThunk<
//   PasswordChangeResponse,
//   { old_password: string; new_password: string },
//   { rejectValue: ApiError }
// >('hotelPassword/changeWithOld', async (payload, { rejectWithValue }) => {
//   try {
    
//     console.log('Changing password with old password:', payload);
//     const response = await api.post('/api/hotel/auth/change-password', payload);
//     console.log('Change password response:', response.data);
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to change password'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// const hotelPasswordSlice = createSlice({
//   name: 'hotelPassword',
//   initialState,
//   reducers: {
//     setStep: (state, action: PayloadAction<OTPState['step']>) => {
//       state.step = action.payload;
//     },
//     setOtp: (state, action: PayloadAction<string>) => {
//       state.otp = action.payload;
//     },
//     setNewPassword: (state, action: PayloadAction<string>) => {
//       state.newPassword = action.payload;
//     },
//     setConfirmPassword: (state, action: PayloadAction<string>) => {
//       state.confirmPassword = action.payload;
//     },
//     setCountdown: (state, action: PayloadAction<number>) => {
//       state.countdown = action.payload;
//     },
//     setExpiresAt: (state, action: PayloadAction<number | null>) => {
//       state.expiresAt = action.payload;
//     },
//     clearMessages: (state) => {
//       state.error = null;
//       state.message = null;
//     },
//     resetState: () => ({ ...initialState }),
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(requestOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(requestOTP.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.step = 'verify';
//         state.message = action.payload.message;
//         state.countdown = action.payload.expiresIn;
//         state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
//       })
//       .addCase(requestOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to request OTP';
//       })

//       .addCase(resendOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(resendOTP.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.message = action.payload.message;
//         state.countdown = action.payload.expiresIn;
//         state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
//         state.otp = '';
//       })
//       .addCase(resendOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to resend OTP';
//       })

//       .addCase(verifyOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.step = 'change';
//         state.tempToken = action.payload.tempToken;
//         state.message = action.payload.message;
//         state.countdown = action.payload.expiresIn;
//         state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to verify OTP';
//       })

//       .addCase(changePasswordWithOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(changePasswordWithOTP.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.step = 'success';
//         state.message = action.payload.message;
//         state.newPassword = '';
//         state.confirmPassword = '';
//         state.otp = '';
//         state.tempToken = null;
//         state.countdown = 0;
//         state.expiresAt = null;
//       })
//       .addCase(changePasswordWithOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to change password';
//       })

//       .addCase(changePasswordWithOld.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(changePasswordWithOld.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.step = 'success';
//         state.message = action.payload.message;
//         state.newPassword = '';
//         state.confirmPassword = '';
//       })
//       .addCase(changePasswordWithOld.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to change password';
//       });
//   },
// });

// export const {
//   setStep,
//   setOtp,
//   setNewPassword,
//   setConfirmPassword,
//   setCountdown,
//   setExpiresAt,
//   clearMessages,
//   resetState,
// } = hotelPasswordSlice.actions;

// export default hotelPasswordSlice.reducer;



// // store/slices/hotelPasswordSlice.ts
// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { api, getApiError } from '@/services/apiServiceForPasswordChange';
// import type {
//   OTPState,
//   OTPRequestResponse,
//   OTPVerifyResponse,
//   PasswordChangeResponse,
//   RecoveryEmailResponse,
//   OTPRequestPayload,
//   OTPVerifyPayload,
//   PasswordChangePayload,
//   RecoveryEmailPayload,
//   ApiError,
// } from '@/types/hotelPassword';

// const initialState: OTPState = {
//   step: 'request',
//   otp: '',
//   tempToken: null,
//   newPassword: '',
//   confirmPassword: '',
//   isLoading: false,
//   error: null,
//   message: null,
//   countdown: 0,
//   expiresAt: null,
//   emailType: null,
//   hasRecoveryEmail: false,
//   recoveryEmail: null,
// };

// // ===================== RECOVERY EMAIL ACTIONS =====================

// // Get recovery email
// export const getRecoveryEmail = createAsyncThunk<
//   RecoveryEmailResponse,
//   void,
//   { rejectValue: ApiError }
// >('hotelPassword/getRecoveryEmail', async (_, { rejectWithValue }) => {
//   try {
//     const response = await api.get('/api/hotel/me/recovery-email');
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to fetch recovery email'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Add or update recovery email
// export const updateRecoveryEmail = createAsyncThunk<
//   RecoveryEmailResponse,
//   RecoveryEmailPayload,
//   { rejectValue: ApiError }
// >('hotelPassword/updateRecoveryEmail', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/me/recovery-email', {
//       recovery_email: payload.recovery_email,
//     });
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to update recovery email'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Remove recovery email
// export const removeRecoveryEmail = createAsyncThunk<
//   RecoveryEmailResponse,
//   void,
//   { rejectValue: ApiError }
// >('hotelPassword/removeRecoveryEmail', async (_, { rejectWithValue }) => {
//   try {
//     const response = await api.delete('/api/hotel/me/recovery-email');
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to remove recovery email'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // ===================== OTP PASSWORD CHANGE ACTIONS =====================

// // Request OTP
// export const requestOTP = createAsyncThunk<
//   OTPRequestResponse,
//   OTPRequestPayload,
//   { rejectValue: ApiError }
// >('hotelPassword/requestOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/auth/request-password-change-otp', {
//       admin_email: payload.admin_email,
//     });
//     console.log('Request OTP response:', response.data);
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to request OTP'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Resend OTP
// export const resendOTP = createAsyncThunk<
//   OTPRequestResponse,
//   OTPRequestPayload,
//   { rejectValue: ApiError }
// >('hotelPassword/resendOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/auth/resend-password-change-otp', {
//       admin_email: payload.admin_email,
//     });
//     console.log('Resend OTP response:', response.data);
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to resend OTP'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Verify OTP
// export const verifyOTP = createAsyncThunk<
//   OTPVerifyResponse,
//   OTPVerifyPayload,
//   { rejectValue: ApiError }
// >('hotelPassword/verifyOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/auth/verify-password-change-otp', {
//       otp: payload.otp,
//       admin_email: payload.admin_email,
//     });
//     console.log('Verify OTP response:', response.data);
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to verify OTP'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Change password with OTP
// export const changePasswordWithOTP = createAsyncThunk<
//   PasswordChangeResponse,
//   PasswordChangePayload,
//   { rejectValue: ApiError }
// >('hotelPassword/changeWithOTP', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/api/hotel/auth/change-password-with-otp', {
//       new_password: payload.new_password,
//       tempToken: payload.tempToken,
//       admin_email: payload.admin_email,
//     });
//     console.log('Change password with OTP response:', response.data);
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to change password'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// // Change password with old password
// export const changePasswordWithOld = createAsyncThunk<
//   PasswordChangeResponse,
//   { old_password: string; new_password: string; confirm_password: string },
//   { rejectValue: ApiError }
// >('hotelPassword/changeWithOld', async (payload, { rejectWithValue }) => {
//   try {
//     const response = await api.patch('/api/hotel/me/password', {
//       old_password: payload.old_password,
//       new_password: payload.new_password,
//       confirm_password: payload.confirm_password,
//     });
//     console.log('Change password with old response:', response.data);
//     return response.data;
//   } catch (err: any) {
//     return rejectWithValue({
//       message: getApiError(err, 'Failed to change password'),
//       status: err?.response?.status,
//       errors: err?.response?.data?.errors,
//     });
//   }
// });

// const hotelPasswordSlice = createSlice({
//   name: 'hotelPassword',
//   initialState,
//   reducers: {
//     setStep: (state, action: PayloadAction<OTPState['step']>) => {
//       state.step = action.payload;
//       // Reset relevant state when changing steps
//       if (action.payload === 'request') {
//         state.otp = '';
//         state.tempToken = null;
//         state.error = null;
//         state.message = null;
//       }
//       if (action.payload === 'change') {
//         state.newPassword = '';
//         state.confirmPassword = '';
//       }
//     },
//     setOtp: (state, action: PayloadAction<string>) => {
//       state.otp = action.payload;
//     },
//     setNewPassword: (state, action: PayloadAction<string>) => {
//       state.newPassword = action.payload;
//     },
//     setConfirmPassword: (state, action: PayloadAction<string>) => {
//       state.confirmPassword = action.payload;
//     },
//     setCountdown: (state, action: PayloadAction<number>) => {
//       state.countdown = action.payload;
//     },
//     setExpiresAt: (state, action: PayloadAction<number | null>) => {
//       state.expiresAt = action.payload;
//     },
//     setEmailType: (state, action: PayloadAction<'primary' | 'recovery' | null>) => {
//       state.emailType = action.payload;
//     },
//     setHasRecoveryEmail: (state, action: PayloadAction<boolean>) => {
//       state.hasRecoveryEmail = action.payload;
//     },
//     setRecoveryEmail: (state, action: PayloadAction<string | null>) => {
//       state.recoveryEmail = action.payload;
//     },
//     clearMessages: (state) => {
//       state.error = null;
//       state.message = null;
//     },
//     resetState: () => ({ ...initialState }),
//   },
//   extraReducers: (builder) => {
//     builder
//       // ===================== GET RECOVERY EMAIL =====================
//       .addCase(getRecoveryEmail.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(getRecoveryEmail.fulfilled, (state, action) => {
//         console.log('Get recovery email response:', action.payload);
//         const responseData = action.payload.data || action.payload;
//         state.isLoading = false;
//         state.hasRecoveryEmail = responseData.has_recovery_email || false;
//         state.recoveryEmail = responseData.recovery_email || null;
//       })
//       .addCase(getRecoveryEmail.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to fetch recovery email';
//       })

//       // ===================== UPDATE RECOVERY EMAIL =====================
//       .addCase(updateRecoveryEmail.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(updateRecoveryEmail.fulfilled, (state, action) => {
//         console.log('Update recovery email response:', action.payload);
//         const responseData = action.payload.data || action.payload;
//         state.isLoading = false;
//         state.message = responseData.message || action.payload.message;
//         state.hasRecoveryEmail = true;
//         state.recoveryEmail = responseData.recovery_email || null;
//       })
//       .addCase(updateRecoveryEmail.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to update recovery email';
//       })

//       // ===================== REMOVE RECOVERY EMAIL =====================
//       .addCase(removeRecoveryEmail.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(removeRecoveryEmail.fulfilled, (state, action) => {
//         console.log('Remove recovery email response:', action.payload);
//         const responseData = action.payload.data || action.payload;
//         state.isLoading = false;
//         state.message = responseData.message || action.payload.message;
//         state.hasRecoveryEmail = false;
//         state.recoveryEmail = null;
//       })
//       .addCase(removeRecoveryEmail.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to remove recovery email';
//       })

//       // ===================== REQUEST OTP =====================
//       .addCase(requestOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(requestOTP.fulfilled, (state, action) => {
//         console.log('Request OTP fulfilled:', action.payload);
//         const responseData = action.payload.data || action.payload;
//         state.isLoading = false;
//         state.step = 'verify';
//         state.message = responseData.message || action.payload.message;
//         state.countdown = responseData.expiresIn;
//         state.expiresAt = Date.now() + (responseData.expiresIn * 1000);
//         state.emailType = responseData.emailType || 'primary';
//         state.hasRecoveryEmail = responseData.hasRecoveryEmail || false;
//       })
//       .addCase(requestOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to request OTP';
//       })

//       // ===================== RESEND OTP =====================
//       .addCase(resendOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(resendOTP.fulfilled, (state, action) => {
//         console.log('Resend OTP fulfilled:', action.payload);
//         const responseData = action.payload.data || action.payload;
//         state.isLoading = false;
//         state.message = responseData.message || action.payload.message;
//         state.countdown = responseData.expiresIn;
//         state.expiresAt = Date.now() + (responseData.expiresIn * 1000);
//         state.otp = '';
//         state.emailType = responseData.emailType || 'primary';
//         state.hasRecoveryEmail = responseData.hasRecoveryEmail || false;
//       })
//       .addCase(resendOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to resend OTP';
//       })

//       // ===================== VERIFY OTP =====================
//       .addCase(verifyOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         console.log('Verify OTP fulfilled:', action.payload);
//         const responseData = action.payload.data || action.payload;
//         const tempToken = responseData?.tempToken ?? action.payload?.tempToken ?? null;
//         const expiresIn = responseData?.expiresIn ?? action.payload?.expiresIn ?? 0;

//         state.isLoading = false;
//         state.step = 'change';
//         state.tempToken = tempToken;
//         state.message = responseData?.message || action.payload.message;
//         state.countdown = expiresIn;
//         state.expiresAt = expiresIn > 0 ? Date.now() + expiresIn * 1000 : null;
//         console.log('TempToken saved to Redux:', state.tempToken);
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to verify OTP';
//       })

//       // ===================== CHANGE PASSWORD WITH OTP =====================
//       .addCase(changePasswordWithOTP.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(changePasswordWithOTP.fulfilled, (state, action) => {
//         console.log('Change password with OTP fulfilled:', action.payload);
//         const responseData = action.payload.data || action.payload;
//         state.isLoading = false;
//         state.step = 'success';
//         state.message = responseData.message || action.payload.message;
//         state.newPassword = '';
//         state.confirmPassword = '';
//         state.otp = '';
//         state.tempToken = null;
//         state.countdown = 0;
//         state.expiresAt = null;
//         state.emailType = null;
//       })
//       .addCase(changePasswordWithOTP.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to change password';
//       })

//       // ===================== CHANGE PASSWORD WITH OLD =====================
//       .addCase(changePasswordWithOld.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//         state.message = null;
//       })
//       .addCase(changePasswordWithOld.fulfilled, (state, action) => {
//         console.log('Change password with old fulfilled:', action.payload);
//         const responseData = action.payload.data || action.payload;
//         state.isLoading = false;
//         state.step = 'success';
//         state.message = responseData.message || action.payload.message;
//         state.newPassword = '';
//         state.confirmPassword = '';
//       })
//       .addCase(changePasswordWithOld.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload?.message || 'Failed to change password';
//       });
//   },
// });

// export const {
//   setStep,
//   setOtp,
//   setNewPassword,
//   setConfirmPassword,
//   setCountdown,
//   setExpiresAt,
//   setEmailType,
//   setHasRecoveryEmail,
//   setRecoveryEmail,
//   clearMessages,
//   resetState,
// } = hotelPasswordSlice.actions;

// export default hotelPasswordSlice.reducer;


// store/slices/hotelPasswordSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api, getApiError } from "@/services/apiServiceForPasswordChange";
import type {
  OTPState,
  OTPRequestResponse,
  OTPVerifyResponse,
  PasswordChangeResponse,
  RecoveryEmailResponse,
  OTPRequestPayload,
  OTPVerifyPayload,
  PasswordChangePayload,
  RecoveryEmailPayload,
  ApiError,
} from "@/types/hotelPassword";

const initialState: OTPState = {
  step: "select",
  otp: "",
  tempToken: null,
  newPassword: "",
  confirmPassword: "",
  isLoading: false,
  error: null,
  message: null,
  countdown: 0,
  expiresAt: null,
  emailType: null,
  hasRecoveryEmail: false,
  recoveryEmail: null,
};

const getPayloadData = <T extends { data?: any }>(payload: T) => {
  return payload?.data ?? payload;
};

const getExpiresAt = (expiresIn?: number | null) => {
  if (!expiresIn || expiresIn <= 0) return null;
  return Date.now() + expiresIn * 1000;
};

// ===================== RECOVERY EMAIL ACTIONS =====================

export const getRecoveryEmail = createAsyncThunk<
  RecoveryEmailResponse,
  void,
  { rejectValue: ApiError }
>("hotelPassword/getRecoveryEmail", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/hotel/me/recovery-email");
    return response.data;
  } catch (err: any) {
    return rejectWithValue({
      message: getApiError(err, "Failed to fetch recovery email"),
      status: err?.response?.status,
      errors: err?.response?.data?.errors,
    });
  }
});

export const updateRecoveryEmail = createAsyncThunk<
  RecoveryEmailResponse,
  RecoveryEmailPayload,
  { rejectValue: ApiError }
>("hotelPassword/updateRecoveryEmail", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/hotel/me/recovery-email", {
      recovery_email: payload.recovery_email,
    });
    return response.data;
  } catch (err: any) {
    return rejectWithValue({
      message: getApiError(err, "Failed to update recovery email"),
      status: err?.response?.status,
      errors: err?.response?.data?.errors,
    });
  }
});

export const removeRecoveryEmail = createAsyncThunk<
  RecoveryEmailResponse,
  void,
  { rejectValue: ApiError }
>("hotelPassword/removeRecoveryEmail", async (_, { rejectWithValue }) => {
  try {
    const response = await api.delete("/api/hotel/me/recovery-email");
    return response.data;
  } catch (err: any) {
    return rejectWithValue({
      message: getApiError(err, "Failed to remove recovery email"),
      status: err?.response?.status,
      errors: err?.response?.data?.errors,
    });
  }
});

// ===================== OTP PASSWORD CHANGE ACTIONS =====================

export const requestOTP = createAsyncThunk<
  OTPRequestResponse,
  OTPRequestPayload,
  { rejectValue: ApiError }
>("hotelPassword/requestOTP", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/hotel/auth/request-password-change-otp", {
      email: payload.admin_email,
    });
    return response.data;
  } catch (err: any) {
    return rejectWithValue({
      message: getApiError(err, "Failed to request OTP"),
      status: err?.response?.status,
      errors: err?.response?.data?.errors,
    });
  }
});

export const resendOTP = createAsyncThunk<
  OTPRequestResponse,
  OTPRequestPayload,
  { rejectValue: ApiError }
>("hotelPassword/resendOTP", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/hotel/auth/resend-password-change-otp", {
      email: payload.admin_email,
    });
    return response.data;
  } catch (err: any) {
    return rejectWithValue({
      message: getApiError(err, "Failed to resend OTP"),
      status: err?.response?.status,
      errors: err?.response?.data?.errors,
    });
  }
});

export const verifyOTP = createAsyncThunk<
  OTPVerifyResponse,
  OTPVerifyPayload,
  { rejectValue: ApiError }
>("hotelPassword/verifyOTP", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/hotel/auth/verify-password-change-otp", {
      otp: payload.otp,
      email: payload.admin_email,
    });
    return response.data;
  } catch (err: any) {
    return rejectWithValue({
      message: getApiError(err, "Failed to verify OTP"),
      status: err?.response?.status,
      errors: err?.response?.data?.errors,
    });
  }
});

export const changePasswordWithOTP = createAsyncThunk<
  PasswordChangeResponse,
  PasswordChangePayload,
  { rejectValue: ApiError }
>("hotelPassword/changeWithOTP", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/hotel/auth/change-password-with-otp", {
      new_password: payload.new_password,
      tempToken: payload.tempToken,
      email: payload.admin_email,
    });
    return response.data;
  } catch (err: any) {
    return rejectWithValue({
      message: getApiError(err, "Failed to change password"),
      status: err?.response?.status,
      errors: err?.response?.data?.errors,
    });
  }
});

export const changePasswordWithOld = createAsyncThunk<
  PasswordChangeResponse,
  { old_password: string; new_password: string; confirm_password: string },
  { rejectValue: ApiError }
>("hotelPassword/changeWithOld", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.patch("/api/hotel/me/password", {
      old_password: payload.old_password,
      new_password: payload.new_password,
      confirm_password: payload.confirm_password,
    });
    return response.data;
  } catch (err: any) {
    return rejectWithValue({
      message: getApiError(err, "Failed to change password"),
      status: err?.response?.status,
      errors: err?.response?.data?.errors,
    });
  }
});

const hotelPasswordSlice = createSlice({
  name: "hotelPassword",
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<OTPState["step"]>) => {
      state.step = action.payload;
      state.error = null;
      state.message = null;

      if (action.payload === "select" || action.payload === "request") {
        state.otp = "";
        state.tempToken = null;
        state.newPassword = "";
        state.confirmPassword = "";
        state.countdown = 0;
        state.expiresAt = null;
      }

      if (action.payload === "verify") {
        state.newPassword = "";
        state.confirmPassword = "";
      }

      if (action.payload === "change") {
        state.error = null;
      }
    },

    setOtp: (state, action: PayloadAction<string>) => {
      state.otp = action.payload;
    },

    setNewPassword: (state, action: PayloadAction<string>) => {
      state.newPassword = action.payload;
    },

    setConfirmPassword: (state, action: PayloadAction<string>) => {
      state.confirmPassword = action.payload;
    },

    setCountdown: (state, action: PayloadAction<number>) => {
      state.countdown = action.payload;
    },

    setExpiresAt: (state, action: PayloadAction<number | null>) => {
      state.expiresAt = action.payload;
    },

    setEmailType: (
      state,
      action: PayloadAction<"primary" | "recovery" | null>
    ) => {
      state.emailType = action.payload;
    },

    setHasRecoveryEmail: (state, action: PayloadAction<boolean>) => {
      state.hasRecoveryEmail = action.payload;
    },

    setRecoveryEmail: (state, action: PayloadAction<string | null>) => {
      state.recoveryEmail = action.payload;
    },

    clearMessages: (state) => {
      state.error = null;
      state.message = null;
    },

    resetState: () => ({ ...initialState }),
  },

  extraReducers: (builder) => {
    builder
      // GET RECOVERY EMAIL
      .addCase(getRecoveryEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRecoveryEmail.fulfilled, (state, action) => {
        const data = getPayloadData(action.payload);
        state.isLoading = false;
        state.hasRecoveryEmail = data.has_recovery_email || false;
        state.recoveryEmail = data.recovery_email || null;
      })
      .addCase(getRecoveryEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to fetch recovery email";
      })

      // UPDATE RECOVERY EMAIL
      .addCase(updateRecoveryEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateRecoveryEmail.fulfilled, (state, action) => {
        const data = getPayloadData(action.payload);
        state.isLoading = false;
        state.message = data.message || action.payload.message;
        state.hasRecoveryEmail = true;
        state.recoveryEmail = data.recovery_email || null;
      })
      .addCase(updateRecoveryEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to update recovery email";
      })

      // REMOVE RECOVERY EMAIL
      .addCase(removeRecoveryEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(removeRecoveryEmail.fulfilled, (state, action) => {
        const data = getPayloadData(action.payload);
        state.isLoading = false;
        state.message = data.message || action.payload.message;
        state.hasRecoveryEmail = false;
        state.recoveryEmail = null;
      })
      .addCase(removeRecoveryEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to remove recovery email";
      })

      // REQUEST OTP
      .addCase(requestOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(requestOTP.fulfilled, (state, action) => {
        const data = getPayloadData(action.payload);
        const expiresIn = data.expiresIn || 0;

        state.isLoading = false;
        state.step = "verify";
        state.message = data.message || action.payload.message;
        state.countdown = expiresIn;
        state.expiresAt = getExpiresAt(expiresIn);
        state.emailType = data.emailType || "primary";
        state.hasRecoveryEmail = data.hasRecoveryEmail || false;
        state.otp = "";
        state.tempToken = null;
      })
      .addCase(requestOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to request OTP";
      })

      // RESEND OTP
      .addCase(resendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resendOTP.fulfilled, (state, action) => {
        const data = getPayloadData(action.payload);
        const expiresIn = data.expiresIn || 0;

        state.isLoading = false;
        state.message = data.message || action.payload.message;
        state.countdown = expiresIn;
        state.expiresAt = getExpiresAt(expiresIn);
        state.otp = "";
        state.emailType = data.emailType || "primary";
        state.hasRecoveryEmail = data.hasRecoveryEmail || false;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to resend OTP";
      })

      // VERIFY OTP
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        const data = getPayloadData(action.payload);
        const tempToken = data?.tempToken ?? null;
        const expiresIn = data?.expiresIn ?? 0;

        state.isLoading = false;
        state.step = "change";
        state.tempToken = tempToken;
        state.message = data?.message || action.payload.message;
        state.countdown = expiresIn;
        state.expiresAt = getExpiresAt(expiresIn);
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to verify OTP";
      })

      // CHANGE PASSWORD WITH OTP
      .addCase(changePasswordWithOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(changePasswordWithOTP.fulfilled, (state, action) => {
        const data = getPayloadData(action.payload);

        state.isLoading = false;
        state.step = "success";
        state.message = data.message || action.payload.message;
        state.otp = "";
        state.tempToken = null;
        state.newPassword = "";
        state.confirmPassword = "";
        state.countdown = 0;
        state.expiresAt = null;
        state.emailType = null;
      })
      .addCase(changePasswordWithOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to change password";
      })

      // CHANGE PASSWORD WITH OLD
      .addCase(changePasswordWithOld.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(changePasswordWithOld.fulfilled, (state, action) => {
        const data = getPayloadData(action.payload);

        state.isLoading = false;
        state.step = "success";
        state.message = data.message || action.payload.message;
        state.newPassword = "";
        state.confirmPassword = "";
      })
      .addCase(changePasswordWithOld.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to change password";
      });
  },
});

export const {
  setStep,
  setOtp,
  setNewPassword,
  setConfirmPassword,
  setCountdown,
  setExpiresAt,
  setEmailType,
  setHasRecoveryEmail,
  setRecoveryEmail,
  clearMessages,
  resetState,
} = hotelPasswordSlice.actions;

export default hotelPasswordSlice.reducer;