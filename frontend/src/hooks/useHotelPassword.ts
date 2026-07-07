// // hooks/useHotelPassword.ts
// import { useEffect, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useRouter, useParams } from 'next/navigation';
// import { AppDispatch, RootState } from '@/store';
// import {
//   requestOTP,
//   resendOTP,
//   verifyOTP,
//   changePasswordWithOTP,
//   changePasswordWithOld,
//   setStep,
//   setOtp,
//   setNewPassword,
//   setConfirmPassword,
//   setCountdown,
//   clearMessages,
//   resetState,
// } from '@/store/slices/hotelPasswordSlice';

// export const useHotelPassword = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const router = useRouter();
//   const params = useParams<{ slug: string }>();
//   const hotelSlug = params?.slug as string;
  
//   const passwordState = useSelector((state: RootState) => state.hotelPassword);

//   // Auto-countdown timer
//   useEffect(() => {
//     if (!passwordState.expiresAt || passwordState.step !== 'verify') return;

//     const updateCountdown = () => {
//       const remaining = Math.max(0, Math.floor((passwordState.expiresAt! - Date.now()) / 1000));
//       dispatch(setCountdown(remaining));
      
//       if (remaining <= 0) {
//         clearInterval(interval);
//       }
//     };

//     updateCountdown();
//     const interval = setInterval(updateCountdown, 1000);

//     return () => clearInterval(interval);
//   }, [passwordState.expiresAt, passwordState.step, dispatch]);

//   // Request OTP
//   const handleRequestOTP = useCallback(async () => {
//     if (!hotelSlug) {
//       throw new Error('Hotel slug is required');
//     }
//     return dispatch(requestOTP({ hotelSlug })).unwrap();
//   }, [dispatch, hotelSlug]);

//   // Resend OTP
//   const handleResendOTP = useCallback(async () => {
//     if (!hotelSlug) {
//       throw new Error('Hotel slug is required');
//     }
//     return dispatch(resendOTP({ hotelSlug })).unwrap();
//   }, [dispatch, hotelSlug]);

//   // Verify OTP
//   const handleVerifyOTP = useCallback(async (otp: string) => {
//     if (otp.length !== 6) {
//       throw new Error('Please enter a valid 6-digit OTP');
//     }
//     if (!hotelSlug) {
//       throw new Error('Hotel slug is required');
//     }
//     return dispatch(verifyOTP({ otp, hotelSlug })).unwrap();
//   }, [dispatch, hotelSlug]);

//   // Change password with OTP
//   const handleChangeWithOTP = useCallback(async (newPassword: string, confirmPassword: string) => {
//     // Validate passwords
//     if (newPassword.length < 8) {
//       throw new Error('Password must be at least 8 characters long');
//     }

//     if (newPassword !== confirmPassword) {
//       throw new Error('Passwords do not match');
//     }

//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//     if (!passwordRegex.test(newPassword)) {
//       throw new Error('Password must contain uppercase, lowercase, number and special character');
//     }

//     if (!passwordState.tempToken) {
//       throw new Error('Verification token not found. Please restart the process.');
//     }

//     if (!hotelSlug) {
//       throw new Error('Hotel slug is required');
//     }

//     return dispatch(changePasswordWithOTP({
//       new_password: newPassword,
//       tempToken: passwordState.tempToken,
//       hotelSlug,
//     })).unwrap();
//   }, [dispatch, passwordState.tempToken, hotelSlug]);

//   // Change password with old password
//   const handleChangeWithOld = useCallback(async (
//     oldPassword: string,
//     newPassword: string,
//     confirmPassword: string
//   ) => {
//     // Validate old password
//     if (!oldPassword) {
//       throw new Error('Old password is required');
//     }

//     // Validate new password
//     if (newPassword.length < 8) {
//       throw new Error('Password must be at least 8 characters long');
//     }

//     if (newPassword !== confirmPassword) {
//       throw new Error('Passwords do not match');
//     }

//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//     if (!passwordRegex.test(newPassword)) {
//       throw new Error('Password must contain uppercase, lowercase, number and special character');
//     }

//     if (!hotelSlug) {
//       throw new Error('Hotel slug is required');
//     }

//     return dispatch(changePasswordWithOld({
//       old_password: oldPassword,
//       new_password: newPassword,
//     })).unwrap();
//   }, [dispatch, hotelSlug]);

//   // Navigation between steps
//   const goToStep = useCallback((step: 'request' | 'verify' | 'change' | 'success') => {
//     dispatch(setStep(step));
//   }, [dispatch]);

//   // Reset state
//   const resetPasswordFlow = useCallback(() => {
//     dispatch(resetState());
//   }, [dispatch]);

//   // Clear messages
//   const clearPasswordMessages = useCallback(() => {
//     dispatch(clearMessages());
//   }, [dispatch]);

//   // Set form values
//   const updateOtp = useCallback((otp: string) => {
//     dispatch(setOtp(otp));
//   }, [dispatch]);

//   const updateNewPassword = useCallback((password: string) => {
//     dispatch(setNewPassword(password));
//   }, [dispatch]);

//   const updateConfirmPassword = useCallback((password: string) => {
//     dispatch(setConfirmPassword(password));
//   }, [dispatch]);

//   return {
//     // State
//     ...passwordState,
//     hotelSlug,
    
//     // Actions
//     requestOTP: handleRequestOTP,
//     resendOTP: handleResendOTP,
//     verifyOTP: handleVerifyOTP,
//     changeWithOTP: handleChangeWithOTP,
//     changeWithOld: handleChangeWithOld,
//     goToStep,
//     resetPasswordFlow,
//     clearMessages: clearPasswordMessages,
//     updateOtp,
//     updateNewPassword,
//     updateConfirmPassword,
//   };
// };







// // hooks/useHotelPassword.ts
// import { useEffect, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useParams } from 'next/navigation';
// import { AppDispatch, RootState } from '@/store';
// import {
//   requestOTP,
//   resendOTP,
//   verifyOTP,
//   changePasswordWithOTP,
//   changePasswordWithOld,
//   setStep,
//   setOtp,
//   setNewPassword,
//   setConfirmPassword,
//   setCountdown,
//   clearMessages,
//   resetState,
// } from '@/store/slices/hotelPasswordSlice';

// export const useHotelPassword = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const params = useParams<{ slug: string }>();
//   const hotelSlug = params?.slug as string;

//   const passwordState = useSelector((state: RootState) => state.hotelPassword);

//   useEffect(() => {
//     if (!passwordState.expiresAt) return;
//     if (passwordState.step !== 'verify' && passwordState.step !== 'change') return;

//     const updateCountdown = () => {
//       const remaining = Math.max(
//         0,
//         Math.floor((passwordState.expiresAt! - Date.now()) / 1000)
//       );

//       dispatch(setCountdown(remaining));

//       if (remaining <= 0) {
//         clearInterval(interval);
//       }
//     };

//     updateCountdown();
//     const interval = setInterval(updateCountdown, 1000);

//     return () => clearInterval(interval);
//   }, [passwordState.expiresAt, passwordState.step, dispatch]);

//   const handleRequestOTP = useCallback(
//     async (admin_email: string) => {
//       if (!hotelSlug) {
//         throw new Error('Hotel slug is required');
//       }

//       if (!admin_email?.trim()) {
//         throw new Error('Admin email is required');
//       }

//       return dispatch(
//         requestOTP({
//           admin_email: admin_email.trim(),
//         })
//       ).unwrap();
//     },
//     [dispatch, hotelSlug]
//   );

//   const handleResendOTP = useCallback(
//     async (admin_email: string) => {
//       if (!hotelSlug) {
//         throw new Error('Hotel slug is required');
//       }

//       if (!admin_email?.trim()) {
//         throw new Error('Admin email is required');
//       }

//       return dispatch(
//         resendOTP({
//           admin_email: admin_email.trim(),
//         })
//       ).unwrap();
//     },
//     [dispatch, hotelSlug]
//   );

//   const handleVerifyOTP = useCallback(
//     async (otp: string) => {
//       if (!otp || otp.length !== 6) {
//         throw new Error('Please enter a valid 6-digit OTP');
//       }

//       if (!hotelSlug) {
//         throw new Error('Hotel slug is required');
//       }

//       return dispatch(verifyOTP({ otp })).unwrap();
//     },
//     [dispatch, hotelSlug]
//   );

//   const handleChangeWithOTP = useCallback(
//     async (newPassword: string, confirmPassword: string) => {
//       if (!newPassword) {
//         throw new Error('New password is required');
//       }

//       if (newPassword.length < 8) {
//         throw new Error('Password must be at least 8 characters long');
//       }

//       if (newPassword !== confirmPassword) {
//         throw new Error('Passwords do not match');
//       }

//       const passwordRegex =
//         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//       if (!passwordRegex.test(newPassword)) {
//         throw new Error(
//           'Password must contain uppercase, lowercase, number and special character'
//         );
//       }

//       if (!passwordState.tempToken) {
//         throw new Error('Verification token not found. Please restart the process.');
//       }

//       if (!hotelSlug) {
//         throw new Error('Hotel slug is required');
//       }

//       return dispatch(
//         changePasswordWithOTP({
//           new_password: newPassword,
//           tempToken: passwordState.tempToken,
//         })
//       ).unwrap();
//     },
//     [dispatch, passwordState.tempToken, hotelSlug]
//   );

//   const handleChangeWithOld = useCallback(
//     async (oldPassword: string, newPassword: string, confirmPassword: string) => {
//       if (!oldPassword) {
//         throw new Error('Old password is required');
//       }

//       if (!newPassword) {
//         throw new Error('New password is required');
//       }

//       if (newPassword.length < 8) {
//         throw new Error('Password must be at least 8 characters long');
//       }

//       if (newPassword !== confirmPassword) {
//         throw new Error('Passwords do not match');
//       }

//       const passwordRegex =
//         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//     //   if (!passwordRegex.test(newPassword)) {
//     //     throw new Error(
//     //       'Password must contain uppercase, lowercase, number and special character'
//     //     );
//     //   }

//       if (!hotelSlug) {
//         throw new Error('Hotel slug is required');
//       }

//       return dispatch(
//         changePasswordWithOld({
//           old_password: oldPassword,
//           new_password: newPassword,
//         })
//       ).unwrap();
//     },
//     [dispatch, hotelSlug]
//   );

//   const goToStep = useCallback(
//     (step: 'select' | 'request' | 'verify' | 'change' | 'success' ) => {
//       dispatch(setStep(step));
//     },
//     [dispatch]
//   );

//   const resetPasswordFlow = useCallback(() => {
//     dispatch(resetState());
//   }, [dispatch]);

//   const clearPasswordMessages = useCallback(() => {
//     dispatch(clearMessages());
//   }, [dispatch]);

//   const updateOtp = useCallback(
//     (otp: string) => {
//       dispatch(setOtp(otp));
//     },
//     [dispatch]
//   );

//   const updateNewPassword = useCallback(
//     (password: string) => {
//       dispatch(setNewPassword(password));
//     },
//     [dispatch]
//   );

//   const updateConfirmPassword = useCallback(
//     (password: string) => {
//       dispatch(setConfirmPassword(password));
//     },
//     [dispatch]
//   );

//   return {
//     ...passwordState,
//     hotelSlug,
//     requestOTP: handleRequestOTP,
//     resendOTP: handleResendOTP,
//     verifyOTP: handleVerifyOTP,
//     changeWithOTP: handleChangeWithOTP,
//     changeWithOld: handleChangeWithOld,
//     goToStep,
//     resetPasswordFlow,
//     clearMessages: clearPasswordMessages,
//     updateOtp,
//     updateNewPassword,
//     updateConfirmPassword,
//   };
// };







// hooks/useHotelPassword.ts
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { AppDispatch, RootState } from '@/store';
import {
  requestOTP,
  resendOTP,
  verifyOTP,
  changePasswordWithOTP,
  changePasswordWithOld,
  getRecoveryEmail,
  updateRecoveryEmail,
  removeRecoveryEmail,
  setStep,
  setOtp,
  setNewPassword,
  setConfirmPassword,
  setCountdown,
  setEmailType,
  setHasRecoveryEmail,
  setRecoveryEmail,
  clearMessages,
  resetState,
} from '@/store/slices/hotelPasswordSlice';

export const useHotelPassword = () => {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ slug: string }>();
  const hotelSlug = params?.slug as string;

  const passwordState = useSelector((state: RootState) => state.hotelPassword);

  // Countdown timer effect
  useEffect(() => {
    if (!passwordState.expiresAt) return;
    if (passwordState.step !== 'verify' && passwordState.step !== 'change') return;

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.floor((passwordState.expiresAt! - Date.now()) / 1000)
      );

      dispatch(setCountdown(remaining));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [passwordState.expiresAt, passwordState.step, dispatch]);

  // Load recovery email on mount if authenticated
  const loadRecoveryEmail = useCallback(async () => {
    try {
      await dispatch(getRecoveryEmail()).unwrap();
    } catch (error) {
      console.error('Failed to load recovery email:', error);
    }
  }, [dispatch]);

  // ===================== RECOVERY EMAIL ACTIONS =====================

  const handleGetRecoveryEmail = useCallback(async () => {
    return dispatch(getRecoveryEmail()).unwrap();
  }, [dispatch]);

  const handleUpdateRecoveryEmail = useCallback(
    async (recoveryEmail: string) => {
      if (!recoveryEmail?.trim()) {
        throw new Error('Recovery email is required');
      }

      const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
      if (!emailRegex.test(recoveryEmail)) {
        throw new Error('Please enter a valid email address');
      }

      return dispatch(updateRecoveryEmail({ recovery_email: recoveryEmail })).unwrap();
    },
    [dispatch]
  );

  const handleRemoveRecoveryEmail = useCallback(async () => {
    return dispatch(removeRecoveryEmail()).unwrap();
  }, [dispatch]);

  // ===================== OTP PASSWORD CHANGE ACTIONS =====================

  const handleRequestOTP = useCallback(
    async (admin_email: string) => {
      if (!admin_email?.trim()) {
        throw new Error('Admin email is required');
      }


      const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
      if (!emailRegex.test(admin_email)) {
        throw new Error('Please enter a valid email address');
      }

      return dispatch(
        requestOTP({
          admin_email: admin_email.trim(),
        })
      ).unwrap();
    },
    [dispatch]
  );

  const handleResendOTP = useCallback(
    async (admin_email: string) => {
      if (!admin_email?.trim()) {
        throw new Error('Admin email is required');
      }

      const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
      if (!emailRegex.test(admin_email)) {
        throw new Error('Please enter a valid email address');
      }

      return dispatch(
        resendOTP({
          admin_email: admin_email.trim(),
        })
      ).unwrap();
    },
    [dispatch]
  );

  const handleVerifyOTP = useCallback(
    async (otp: string, admin_email?: string) => {
      if (!otp || otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      if (!/^\d+$/.test(otp)) {
        throw new Error('OTP must contain only numbers');
      }

      return dispatch(verifyOTP({ otp, admin_email })).unwrap();
    },
    [dispatch]
  );

  // const handleChangeWithOTP = useCallback(
  //   async (newPassword: string, confirmPassword: string, admin_email?: string) => {
  //     if (!newPassword) {
  //       throw new Error('New password is required');
  //     }

  //     if (newPassword.length < 8) {
  //       throw new Error('Password must be at least 8 characters long');
  //     }

  //     if (newPassword !== confirmPassword) {
  //       throw new Error('Passwords do not match');
  //     }

  //     const passwordRegex =
  //       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  //     if (!passwordRegex.test(newPassword)) {
  //       throw new Error(
  //         'Password must contain uppercase, lowercase, number and special character'
  //       );
  //     }

  //     if (!passwordState.tempToken) {
  //       throw new Error('Verification token not found. Please restart the process.');
  //     }

  //     return dispatch(
  //       changePasswordWithOTP({
  //         new_password: newPassword,
  //         tempToken: passwordState.tempToken,
  //         admin_email,
  //       })
  //     ).unwrap();
  //   },
  //   [dispatch, passwordState.tempToken]
  // );

  // hooks/useHotelPassword.ts - Fix the changeWithOTP function

const handleChangeWithOTP = useCallback(
  async (newPassword: string, confirmPassword: string, admin_email?: string) => {
    if (!newPassword) {
      throw new Error('New password is required');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      throw new Error(
        'Password must contain uppercase, lowercase, number and special character'
      );
    }

    let token = passwordState.tempToken;

    if(!token && typeof window !== "undefined"){
      token= sessionStorage.getItem("hotel_password_temp_token")
    }

    // Debug log to check if tempToken exists
    console.log('Current tempToken from Redux:', token);

    if (!token) {
      throw new Error('Verification token not found. Please restart the process.');
    }

    const result= await dispatch(
      changePasswordWithOTP({
        new_password: newPassword,
        tempToken: token,
        admin_email,
      })
    ).unwrap();
  },
  [dispatch, passwordState.tempToken]
);

  const handleChangeWithOld = useCallback(
    async (oldPassword: string, newPassword: string, confirmPassword: string) => {
      if (!oldPassword) {
        throw new Error('Old password is required');
      }

      if (!newPassword) {
        throw new Error('New password is required');
      }

      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }



      return dispatch(
        changePasswordWithOld({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        })
      ).unwrap();
    },
    [dispatch]
  );

  // ===================== UI STATE ACTIONS =====================

  const goToStep = useCallback(
    (step: 'select' | 'request' | 'verify' | 'change' | 'success') => {
      dispatch(setStep(step));
    },
    [dispatch]
  );

  const resetPasswordFlow = useCallback(() => {
    dispatch(resetState());
  }, [dispatch]);

  const clearPasswordMessages = useCallback(() => {
    dispatch(clearMessages());
  }, [dispatch]);

  const updateOtp = useCallback(
    (otp: string) => {
      dispatch(setOtp(otp));
    },
    [dispatch]
  );

  const updateNewPassword = useCallback(
    (password: string) => {
      dispatch(setNewPassword(password));
    },
    [dispatch]
  );

  const updateConfirmPassword = useCallback(
    (password: string) => {
      dispatch(setConfirmPassword(password));
    },
    [dispatch]
  );

  const updateEmailType = useCallback(
    (emailType: 'primary' | 'recovery' | null) => {
      dispatch(setEmailType(emailType));
    },
    [dispatch]
  );

  const updateHasRecoveryEmail = useCallback(
    (hasRecoveryEmail: boolean) => {
      dispatch(setHasRecoveryEmail(hasRecoveryEmail));
    },
    [dispatch]
  );

  const updateRecoveryEmailState = useCallback(
    (recoveryEmail: string | null) => {
      dispatch(setRecoveryEmail(recoveryEmail));
    },
    [dispatch]
  );

  return {
    ...passwordState,
    hotelSlug,
    // Recovery email actions
    getRecoveryEmail: handleGetRecoveryEmail,
    updateRecoveryEmail: handleUpdateRecoveryEmail,
    removeRecoveryEmail: handleRemoveRecoveryEmail,
    loadRecoveryEmail,
    // OTP password change actions
    requestOTP: handleRequestOTP,
    resendOTP: handleResendOTP,
    verifyOTP: handleVerifyOTP,
    changeWithOTP: handleChangeWithOTP,
    changeWithOld: handleChangeWithOld,
    // UI state actions
    goToStep,
    resetPasswordFlow,
    clearMessages: clearPasswordMessages,
    updateOtp,
    updateNewPassword,
    updateConfirmPassword,
    updateEmailType,
    updateHasRecoveryEmail,
    updateRecoveryEmailState,
    
  };
};