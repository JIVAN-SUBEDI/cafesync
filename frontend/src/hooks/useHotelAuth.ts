"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import type { RootState, AppDispatch } from "../store/index";
import { checkAuthStatus, clearRedirectTo } from "@/store/slices/hotelAuthSlice";

export const useHotelAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const {
    user,
    hotel,
    hotelSlug,
    isAuthenticated,
    authCheckLoading,
    status,
    error,
    redirectTo,
    session,
    token,
  } = useSelector((state: RootState) => state.authHotel);

  useEffect(() => {
    if (authCheckLoading) {
      dispatch(checkAuthStatus());
    }
  }, [authCheckLoading, dispatch]);

  useEffect(() => {
    if (!redirectTo) return;

    router.push(redirectTo);
    dispatch(clearRedirectTo());
  }, [redirectTo, router, dispatch]);

  useEffect(() => {
    if (isAuthenticated && hotelSlug) {
      Cookies.set("hotel_slug", hotelSlug, {
        expires: session?.is_remembered ? 30 : 7,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    } else if (!isAuthenticated) {
      Cookies.remove("hotel_slug");
    }
  }, [hotelSlug, isAuthenticated, session?.is_remembered]);

  return {
    user,
    hotel,
    hotelSlug,
    token,
    session,
    isAuthenticated,
    isLoading: authCheckLoading || status === "loading",
    authCheckLoading,
    error,
    status,
    redirectTo,
  };
};

export default useHotelAuth;