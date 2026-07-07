// // types/hotelAuth.ts
// export interface HotelAdmin {
//   id: string;
//   email: string;
//   name: string;
//   hotelId: string;
//   hotelName: string;
//   role: string;
// }

// export interface OTPRequestResponse {
//   success: boolean;
//   message: string;
//   expiresIn: number;
// }

// export interface OTPVerifyResponse {
//   success: boolean;
//   message: string;
//   tempToken: string;
//   expiresIn: number;
// }

// export interface PasswordChangeResponse {
//   success: boolean;
//   message: string;
// }

// export interface OTPState {
//   step: 'request' | 'verify' | 'change' | 'success';
//   otp: string;
//   tempToken: string | null;
//   newPassword: string;
//   confirmPassword: string;
//   isLoading: boolean;
//   error: string | null;
//   message: string | null;
//   countdown: number;
//   expiresAt: number | null;
// }

// export interface OTPRequestPayload {
//   hotelSlug?: string;
//   admin_email?: string;
// }

// export interface OTPVerifyPayload {
//   otp: string;
//   hotelSlug?: string;
// }

// export interface PasswordChangePayload {
//   new_password: string;
//   tempToken: string;
//     hotelSlug?: string;
// }

// export interface ApiError {
//   message: string;
//   status?: number;
//   errors?: any[];
// }


// // types/hotelPassword.ts
// export interface HotelAdmin {
//   id: string;
//   email: string;
//   name: string;
//   hotelId: string;
//   hotelName: string;
//   role: string;
// }

// export interface OTPRequestResponse {
//   success: boolean;
//   message: string;
//   expiresIn: number;
// }

// export interface OTPVerifyResponse {
//   success: boolean;
//   message: string;
//   tempToken: string;
//   expiresIn: number;
// }

// export interface PasswordChangeResponse {
//   success: boolean;
//   message: string;
// }

// export interface OTPState {
//   step: 'select' | 'request' | 'verify' | 'change' | 'success';
//   otp: string;
//   tempToken: string | null;
//   newPassword: string;
//   confirmPassword: string;
//   isLoading: boolean;
//   error: string | null;
//   message: string | null;
//   countdown: number;
//   expiresAt: number | null;
// }

// export interface OTPRequestPayload {
//   admin_email: string;
// }

// export interface OTPVerifyPayload {
//   otp: string;
// }

// export interface PasswordChangePayload {
//   new_password: string;
//   tempToken: string;
// }

// export interface ApiError {
//   message: string;
//   status?: number;
//   errors?: any[];
// }

// types/hotelPassword.ts
export interface HotelAdmin {
  id: string;
  email: string;
  name: string;
  hotelId: string;
  hotelName: string;
  role: string;
}

export interface OTPRequestResponse {
  success: boolean;
  message: string;
  data?: {
    expiresIn: number;
    emailType?: 'primary' | 'recovery';
    hasRecoveryEmail?: boolean;
  };
  expiresIn?: number;
  emailType?: 'primary' | 'recovery';
  hasRecoveryEmail?: boolean;
}

export interface OTPVerifyResponse {
  success: boolean;
  message: string;
  data?: {
    tempToken: string;
    expiresIn: number;
  };
  tempToken?: string;
  expiresIn?: number;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
  data?: {
    message?: string;
  };
}

export interface RecoveryEmailResponse {
  success: boolean;
  message: string;
  data?: {
    recovery_email?: string | null;
    has_recovery_email?: boolean;
  };
  recovery_email?: string | null;
  has_recovery_email?: boolean;
}

export interface OTPState {
  step: 'select' | 'request' | 'verify' | 'change' | 'success';
  otp: string;
  tempToken: string | null;
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  message: string | null;
  countdown: number;
  expiresAt: number | null;
  emailType: 'primary' | 'recovery' | null;
  hasRecoveryEmail: boolean;
  recoveryEmail: string | null;
}

export interface OTPRequestPayload {
  admin_email: string;
}

export interface OTPVerifyPayload {
  otp: string;
  admin_email?: string;
}

export interface PasswordChangePayload {
  new_password: string;
  tempToken: string;
  admin_email?: string;
}

export interface RecoveryEmailPayload {
  recovery_email: string;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: any[];
}