// 'use client';

// import { useEffect, useCallback, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/store';
// import { verifyAuth, refreshSession, logoutAdmin } from '@/store/slices/authSlice';
// import { useRouter } from 'next/navigation';

// export const useAdminSession = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const router = useRouter();
//   const refreshTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
//   const { isAuthenticated, admin, lastChecked } = useSelector(
//     (state: RootState) => state.auth
//   );

//   // Verify authentication on mount and when tab becomes visible
//   useEffect(() => {
//     const verify = async () => {
//       try {
//         await dispatch(verifyAuth()).unwrap();
//       } catch (error) {
//         // Not authenticated
//       }
//     };
    
//     verify();
    
//     // Re-verify when tab becomes visible (security)
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         verify();
//       }
//     };
    
//     document.addEventListener('visibilitychange', handleVisibilityChange);
    
//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//     };
//   }, [dispatch]);

//   // Session refresh every 5 minutes if authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       refreshTimerRef.current = setInterval(async () => {
//         try {
//           await dispatch(refreshSession()).unwrap();
//         } catch (error) {
//           // Session expired
//           dispatch(logoutAdmin());
//           router.push('/admin/login?session=expired');
//         }
//       }, 5 * 60 * 1000); // 5 minutes
//     }
    
//     return () => {
//       if (refreshTimerRef.current) {
//         clearInterval(refreshTimerRef.current);
//       }
//     };
//   }, [isAuthenticated, dispatch, router]);

//   // Logout after inactivity (30 minutes)
//   useEffect(() => {
//     let inactivityTimer: NodeJS.Timeout;
    
//     const resetInactivityTimer = () => {
//       if (inactivityTimer) clearTimeout(inactivityTimer);
      
//       if (isAuthenticated) {
//         inactivityTimer = setTimeout(async () => {
//           await dispatch(logoutAdmin());
//           router.push('/admin/login?reason=inactivity');
//         }, 30 * 60 * 1000); // 30 minutes
//       }
//     };
    
//     if (isAuthenticated) {
//       resetInactivityTimer();
      
//       window.addEventListener('mousemove', resetInactivityTimer);
//       window.addEventListener('keypress', resetInactivityTimer);
//       window.addEventListener('click', resetInactivityTimer);
//       window.addEventListener('scroll', resetInactivityTimer);
//     }
    
//     return () => {
//       if (inactivityTimer) clearTimeout(inactivityTimer);
//       window.removeEventListener('mousemove', resetInactivityTimer);
//       window.removeEventListener('keypress', resetInactivityTimer);
//       window.removeEventListener('click', resetInactivityTimer);
//       window.removeEventListener('scroll', resetInactivityTimer);
//     };
//   }, [isAuthenticated, dispatch, router]);

//   const secureLogout = useCallback(async () => {
//     await dispatch(logoutAdmin());
//     router.push('/admin/login');
//   }, [dispatch, router]);

//   return {
//     isAuthenticated,
//     admin,
//     lastChecked,
//     logout: secureLogout,
//   };
// };