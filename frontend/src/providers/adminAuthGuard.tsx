
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchAdminProfile,
  refreshAdminSession,
} from "@/store/slices/authSlice";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { checking, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Try to get profile (this will fail if access token expired)
        const result = await dispatch(fetchAdminProfile()).unwrap();
        if (mounted && result) return;
      } catch (profileError) {
        console.log("Profile fetch failed, attempting refresh...");
        
        try {
          // Try to refresh the token
          await dispatch(refreshAdminSession()).unwrap();
          
          // Try profile again
          await dispatch(fetchAdminProfile()).unwrap();
          if (mounted) return;
        } catch (refreshError) {
          console.log("Refresh failed, redirecting to login");
          if (mounted) {
            router.replace("/admin/login?reason=session_expired");
          }
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [dispatch, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}