"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { checkSlugExists, clearTenant } from "@/store/slices/tenantSlice";
import {
  loginHotel,
  clearHotelAuthError,
  clearRedirectTo,
} from "@/store/slices/hotelAuthSlice";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Hotel,
  Lock,
} from "lucide-react";

export default function HotelLoginPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();

const routeSlug = useMemo(() => {
  const raw = params?.slug;

  if (Array.isArray(raw)) return raw[0] ?? "";

  return raw ?? "";
}, [params]);



useEffect(() => {
  if (!routeSlug || routeSlug.trim() === "") {
    router.push("/slug");
  }
}, [routeSlug, router]);

const { tenant, status: tenantStatus, error: tenantError } = useSelector(
  (s: RootState) => s.tenant
);
  const {
    status: authStatus,
    error: authError,
    isAuthenticated,
    redirectTo,
  } = useSelector((s: RootState) => s.authHotel);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const tenantSlug = tenant?.slug || routeSlug;

  const authErrorMessage =
    typeof authError === "string"
      ? authError
      : authError && typeof authError === "object" && "message" in authError
      ? String(authError.message)
      : "";

  const authErrorCode =
    authError && typeof authError === "object" && "error" in authError
      ? String(authError.error)
      : "";

  const retryAfter =
    authError && typeof authError === "object" && "retryAfter" in authError
      ? Number(authError.retryAfter)
      : undefined;

  const remainingAttempts =
    authError && typeof authError === "object" && "remainingAttempts" in authError
      ? Number(authError.remainingAttempts)
      : undefined;

  useEffect(() => {
    if (routeSlug) {
      dispatch(checkSlugExists({ slug: routeSlug }));
    }

    return () => {
      dispatch(clearTenant());
      dispatch(clearHotelAuthError());
      dispatch(clearRedirectTo());
    };
  }, [routeSlug, dispatch]);

  useEffect(() => {
    if (redirectTo) {
      router.push(redirectTo);
      dispatch(clearRedirectTo());
    }
  }, [redirectTo, router, dispatch]);

  useEffect(() => {
    if (isAuthenticated && tenantSlug) {
      router.push(`/hotel/${tenantSlug}/dashboard`);
    }
  }, [isAuthenticated, tenantSlug, router]);

  const isAccountLocked =
    authErrorMessage.includes("Account temporarily locked") ||
    authErrorCode === "ACCOUNT_LOCKED";

  const isInvalidCredentials =
    authErrorMessage.includes("Invalid email or password") ||
    authErrorCode === "INVALID_CREDENTIALS";

  const isSubscriptionIssue =
    authErrorMessage.toLowerCase().includes("subscription") ||
    authErrorCode === "SUBSCRIPTION_REQUIRED";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    dispatch(clearHotelAuthError());

    const errors: Record<string, string> = {};

    if (!email.trim()) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormErrors({ email: "Please enter a valid email address" });
      return;
    }

    if (!tenantSlug) {
      return;
    }

    const result = await dispatch(
      loginHotel({
        email: email.trim(),
        password,
        rememberMe,
        slug: tenantSlug,
      })
    );

    if (loginHotel.fulfilled.match(result)) {
      router.push(`/hotel/${tenantSlug}/dashboard`);
    }
  };

  const handleForgotPassword = () => {
    if (!tenantSlug) return;
    router.push(`/hotel/${tenantSlug}/forgot-password`);
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  if (tenantStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Loading information...</p>
        </div>
      </div>
    );
  }

  if (tenantStatus === "failed" || (!tenant && tenantStatus === "succeeded")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="mx-auto max-w-md px-4 py-14">
          <div className="rounded-2xl border border-red-200 bg-white/80 p-6 shadow-xl backdrop-blur">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl mb-4">
                <Hotel className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-red-700">Cafe/Resturannt Not Found</h1>
              <p className="text-gray-600 text-sm mt-2">
                The hotel <span className="font-bold text-red-600">{routeSlug}</span> was not found.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {tenantError || "Please check the URL and try again."}
              </p>
            </div>

            <button
              onClick={handleBackToHome}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Hotel Login</h1>
                  <div className="inline-flex items-center rounded-full border border-[#e7d488]/70 bg-[#fff3c4]/70 px-3 py-1 text-xs font-extrabold text-[#4A2A07] mt-1">
                    Step 2 of 2
                  </div>
                </div>
              </div>

              <button
                onClick={handleBackToHome}
                className="text-sm text-gray-600 hover:text-amber-600 font-medium"
              >
                Back to Home
              </button>
            </div>

            {tenant && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <Hotel className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-gray-900">{tenant.name}</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      Hotel Name
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{tenant.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      URL Slug
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{tenant.slug}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      Status
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1 capitalize">
                      {tenant.subscription_status || "Active"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      Type
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">Hotel</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-6">
              Welcome back to <span className="font-bold text-gray-900">{tenant?.name}</span>.
              Please enter your credentials to continue.
            </p>
          </div>

          {!!authError && (
            <div
              className={`mb-6 p-4 rounded-xl ${
                isAccountLocked
                  ? "bg-red-50 border border-red-200"
                  : isSubscriptionIssue
                  ? "bg-orange-50 border border-orange-200"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`h-5 w-5 mt-0.5 ${
                    isAccountLocked
                      ? "text-red-500"
                      : isSubscriptionIssue
                      ? "text-orange-500"
                      : "text-amber-500"
                  }`}
                />

                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isAccountLocked
                        ? "text-red-700"
                        : isSubscriptionIssue
                        ? "text-orange-700"
                        : "text-amber-700"
                    }`}
                  >
                    {authErrorMessage || "Login failed"}
                  </p>

                  {isAccountLocked && retryAfter !== undefined && (
                    <p className="text-red-600 text-sm mt-1">
                      Please try again in {retryAfter} seconds.
                    </p>
                  )}

                  {isSubscriptionIssue && (
                    <p className="text-orange-600 text-sm mt-1">
                      Please contact support to reactivate your subscription.
                    </p>
                  )}

                  {isInvalidCredentials && remainingAttempts !== undefined && (
                    <p className="text-amber-600 text-sm mt-1">
                      {remainingAttempts} attempts remaining before account lockout.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hotel.com"
                className={`w-full px-4 py-3 rounded-xl border ${
                  formErrors.email ? "border-red-300" : "border-amber-200"
                } bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                disabled={authStatus === "loading" || isAccountLocked}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    formErrors.password ? "border-red-300" : "border-amber-200"
                  } bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors pr-12`}
                  disabled={authStatus === "loading" || isAccountLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-600"
                  disabled={authStatus === "loading" || isAccountLocked}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                  disabled={authStatus === "loading" || isAccountLocked}
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                disabled={authStatus === "loading" || isAccountLocked}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={authStatus === "loading" || isAccountLocked || !tenant}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authStatus === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign In to {tenant?.name}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold text-[#6B451F]/70">
            This login is scoped to the tenant slug:{" "}
            <span className="font-black text-gray-900">{tenantSlug}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            All login attempts are logged and monitored for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
}