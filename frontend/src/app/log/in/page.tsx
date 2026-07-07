
"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import type { AppDispatch, RootState } from "@/store";
import { loginAdmin, clearAdminError } from "@/store/slices/authSlice";
import { Loader2, AlertCircle, Eye, EyeOff, Shield } from "lucide-react";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const { isAuthenticated, status, error } = useSelector(
    (state: RootState) => state.auth,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isSubmitting = status === "loading";

  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/admin/dashboard",
    [searchParams],
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  const validate = () => {
    const errors: Record<string, string> = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!validate()) return;

  dispatch(clearAdminError());

  try {
    await dispatch(
      loginAdmin({
        email: email.trim(),
        password,
        rememberMe,
      })
    ).unwrap();

    router.replace("/admin/dashboard");
  } catch (err) {
    // error already handled in slice
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 rounded-full border border-slate-700">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-300">
              Admin Portal • Secure Session
            </span>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Main Admin Login</h1>
            <p className="text-slate-400 text-sm mt-1">
              Sign in to manage hotels, plans & platform settings
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  dispatch(clearAdminError());
                }}
                placeholder="admin@example.com"
                disabled={isSubmitting}
                className={`w-full px-4 py-3 bg-slate-800/50 border ${
                  formErrors.email ? "border-red-500" : "border-slate-600"
                } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50`}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-400">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    dispatch(clearAdminError());
                  }}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${
                    formErrors.password ? "border-red-500" : "border-slate-600"
                  } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 disabled:opacity-50`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {formErrors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-slate-800/50 border-slate-600 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 focus:ring-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-slate-300">
                  Remember this device
                </span>
              </label>

              <button
                type="button"
                onClick={() => router.push("/admin/forgot-password")}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Secure Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>✓ Access token: 5 min</span>
              <span>✓ Refresh token: long</span>
              <span>✓ HTTP-only cookies</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Unauthorized access is prohibited. All access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-800 flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading login...
          </div>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}