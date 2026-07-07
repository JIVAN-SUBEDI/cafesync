// app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle,
  ChefHat,
  Coffee,
  CreditCard,
  CreditCard as CreditCardIcon,
  Crown,
  Download,
  HelpCircle,
  Hotel,
  Loader2,
  Menu,
  Receipt,
  ShoppingBag,
  Smartphone,
  Sparkle,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "../store/index";
import { fetchSubscriptionPlans } from "@/store/slices/subscriptionSlice";
import { checkAuthStatus } from "@/store/slices/hotelAuthSlice";
import { useHotelAuth } from "@/hooks/useHotelAuth";

// ===================== TYPES =====================
interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_code: string;
  description: string;
  price_per_year: string | number;
  price_per_month: string | number;
  max_staff: number;
  max_tables: number;
  max_menu_items: number;
  features?: Record<string, boolean>;
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
}

interface UISubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currentPrice: number;
  features: string[];
  popular: boolean;
  maxStaff: number;
  maxTables: number;
  maxMenuItems: number;
  planCode: string;
  displayOrder: number;
}

interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
  gradient: string;
  bgGradient: string;
}

interface Stat {
  label: string;
  value: string;
  change: string;
  color: string;
}

interface PaymentMethod {
  name: string;
  description: string;
  icon: ReactNode;
  color: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

// ===================== CONSTANTS =====================
const APP_DOWNLOAD_URL = "/downloads/cloudcafe.apk";
const PLAN_CURRENCY = "Rs";

const FEATURES: Feature[] = [
  {
    title: "Staff Management",
    description:
      "Create staff accounts, assign roles, manage permissions, and track staff activity from one dashboard.",
    icon: <Users className="h-8 w-8" />,
    gradient: "from-blue-500 to-cyan-600",
    bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-50",
  },
  {
    title: "Order Management",
    description:
      "Take, update, and track dine-in orders in real time from waiter to kitchen to billing.",
    icon: <ShoppingBag className="h-8 w-8" />,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "bg-gradient-to-br from-amber-50 to-orange-50",
  },
  {
    title: "Menu Management",
    description:
      "Add menu categories, menu items, prices, availability, and update your cafe menu anytime.",
    icon: <BookOpen className="h-8 w-8" />,
    gradient: "from-emerald-500 to-teal-600",
    bgGradient: "bg-gradient-to-br from-emerald-50 to-teal-50",
  },
  {
    title: "Kitchen Display",
    description:
      "Send orders directly to the kitchen screen so chefs can prepare items faster with fewer mistakes.",
    icon: <ChefHat className="h-8 w-8" />,
    gradient: "from-rose-500 to-pink-600",
    bgGradient: "bg-gradient-to-br from-rose-50 to-pink-50",
  },
  {
    title: "Billing System",
    description:
      "Generate bills, track paid and due amounts, and manage payments using eSewa and Khalti.",
    icon: <Receipt className="h-8 w-8" />,
    gradient: "from-violet-500 to-purple-600",
    bgGradient: "bg-gradient-to-br from-violet-50 to-purple-50",
  },
  {
    title: "Advanced Analytics",
    description:
      "View revenue, paid amount, due amount, top items, staff performance, and order reports.",
    icon: <BarChart3 className="h-8 w-8" />,
    gradient: "from-indigo-500 to-blue-600",
    bgGradient: "bg-gradient-to-br from-indigo-50 to-blue-50",
  },
];

const PRODUCT_STATS: Stat[] = [
  {
    label: "Core Modules",
    value: "6",
    change: "Cafe features",
    color: "text-amber-600",
  },
  {
    label: "Payment Support",
    value: "2",
    change: "eSewa & Khalti",
    color: "text-emerald-600",
  },
  {
    label: "App Access",
    value: "APK",
    change: "Direct download",
    color: "text-blue-600",
  },
  {
    label: "Dashboard",
    value: "Live",
    change: "Real-time data",
    color: "text-violet-600",
  },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    name: "eSewa",
    description: "Accept digital payments through eSewa.",
    icon: <Wallet className="h-7 w-7" />,
    color: "from-green-500 to-emerald-600",
  },
  {
    name: "Khalti",
    description: "Accept digital payments through Khalti.",
    icon: <CreditCardIcon className="h-7 w-7" />,
    color: "from-violet-500 to-purple-600",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Which payment methods do you support?",
    answer: "CloudCafe currently supports eSewa and Khalti only.",
  },
  {
    question: "Can users download the app from the website?",
    answer:
      "Yes. The Android APK can be downloaded directly from the CloudCafe website without using the Play Store.",
  },
  {
    question: "What features are included?",
    answer:
      "CloudCafe includes staff management, order management, menu management, kitchen display, billing system, and advanced analytics.",
  },
  {
    question: "Is this made for cafes and restaurants?",
    answer:
      "Yes. CloudCafe is designed for cafes, restaurants, and hospitality businesses that need simple digital order, billing, kitchen, and staff management.",
  },
];

// ===================== HELPERS =====================
const parsePrice = (value: string | number | undefined | null) => {
  const numericValue = Number(value || 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatPlanPrice = (value: number) => {
  if (!value) return "Custom";

  return `${PLAN_CURRENCY} ${value.toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  })}`;
};

const prettyPlanCode = (value?: string) => {
  if (!value) return "";
  return value.replaceAll("_", " ").toUpperCase();
};

const transformApiPlanToUiPlan = (
  apiPlan: SubscriptionPlan,
  billingCycle: "monthly" | "yearly",
): UISubscriptionPlan => {
  const features = apiPlan.features || {};

  const backendFeatureMap: Record<string, string> = {
    staff_management: "Staff management",
    order_management: "Order management",
    menu_management: "Menu management",
    kitchen_display: "Kitchen display system",
    billing_system: "Billing system",
    advanced_reports: "Advanced analytics",
    full_reports: "Advanced analytics",
    basic_reports: "Basic analytics",
  };

  let featureList = Object.entries(backendFeatureMap)
    .filter(([key]) => features[key])
    .map(([, label]) => label);

  if (!featureList.length) {
    featureList = [
      "Staff management",
      "Order management",
      "Menu management",
      "Kitchen display system",
      "Billing system",
      "Advanced analytics",
    ];
  }

  const maxStaff = Number(apiPlan.max_staff || 0);
  const maxTables = Number(apiPlan.max_tables || 0);
  const maxMenuItems = Number(apiPlan.max_menu_items || 0);

  if (maxStaff > 0) featureList.push(`Up to ${maxStaff} staff members`);
  if (maxTables > 0) featureList.push(`${maxTables} tables`);
  if (maxMenuItems > 0) featureList.push(`${maxMenuItems} menu items`);

  featureList.push("eSewa payment support");
  featureList.push("Khalti payment support");
  featureList.push("Direct Android app download");

  const monthlyPrice = parsePrice(apiPlan.price_per_month);
  const yearlyPrice = parsePrice(apiPlan.price_per_year);

  const planCode = apiPlan.plan_code || "";
  const normalizedCode = planCode.toUpperCase();

  return {
    id: apiPlan.id,
    name: apiPlan.plan_name,
    description: apiPlan.description,
    monthlyPrice,
    yearlyPrice,
    currentPrice: billingCycle === "monthly" ? monthlyPrice : yearlyPrice,
    features: Array.from(new Set(featureList)),
    popular:
      normalizedCode.includes("BUSINESS") ||
      normalizedCode.includes("PRO") ||
      normalizedCode.includes("PREMIUM"),
    maxStaff,
    maxTables,
    maxMenuItems,
    planCode,
    displayOrder: Number(apiPlan.display_order || 999),
  };
};

const getPlanTheme = (planCode: string, popular: boolean) => {
  const code = planCode.toUpperCase();

  if (code.includes("STARTER") || code.includes("BASIC")) {
    return {
      border: popular ? "border-blue-500" : "border-blue-100",
      badge: "from-blue-500 to-indigo-500",
      iconBg: "from-blue-100 to-indigo-100",
      iconText: "text-blue-600",
      title: "text-blue-700",
      button:
        "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white",
      checkBg: "bg-blue-100",
      checkText: "text-blue-600",
    };
  }

  if (code.includes("ENTERPRISE")) {
    return {
      border: popular ? "border-gray-900" : "border-gray-200",
      badge: "from-gray-800 to-gray-950",
      iconBg: "from-gray-100 to-gray-200",
      iconText: "text-gray-800",
      title: "text-gray-900",
      button:
        "bg-gradient-to-r from-gray-800 to-gray-950 hover:from-gray-900 hover:to-black text-white",
      checkBg: "bg-gray-100",
      checkText: "text-gray-800",
    };
  }

  return {
    border: popular ? "border-amber-500" : "border-amber-100",
    badge: "from-amber-500 to-orange-500",
    iconBg: "from-amber-100 to-orange-100",
    iconText: "text-amber-600",
    title: "text-amber-700",
    button:
      "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
    checkBg: "bg-amber-100",
    checkText: "text-amber-600",
  };
};

// ===================== MAIN COMPONENT =====================
export default function CloudCafeLandingPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const fetchedPlansRef = useRef(false);

  const { plans, loading, error } = useSelector(
    (state: RootState) => state.subscription,
  );

  const { isAuthenticated, hotel, hotelSlug } = useHotelAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const displayName = hotel?.hotel_name || hotel?.admin_name || hotelSlug || "";

  useEffect(() => {
    if (fetchedPlansRef.current) return;

    fetchedPlansRef.current = true;
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sortedUiPlans = useMemo(() => {
    const sourcePlans = Array.isArray(plans) ? (plans as SubscriptionPlan[]) : [];

    return sourcePlans
      .filter((plan) => plan.is_active !== false)
      .map((plan) => transformApiPlanToUiPlan(plan, billingCycle))
      .sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;

        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }

        return a.currentPrice - b.currentPrice;
      });
  }, [plans, billingCycle]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const handleRegister = (planId?: string) => {
    if (isAuthenticated) {
      handleGoToDashboard();
      return;
    }

    if (planId) {
      router.push(`/register?plan=${planId}&type=subscription`);
      return;
    }

    router.push("/register?type=subscription");
  };

  const handleLogin = () => {
    router.push("/slug");
    setIsMenuOpen(false);
  };

  const handleGoToDashboard = () => {
    if (hotelSlug) {
      router.push(`/hotel/${hotelSlug}/dashboard`);
      return;
    }

    dispatch(checkAuthStatus()).then((action: any) => {
      if (action.payload?.user?.hotel_slug) {
        router.push(`/hotel/${action.payload.user.hotel_slug}/dashboard`);
      } else {
        router.push("/slug");
      }
    });
  };

  const handleDownloadApp = () => {
    window.location.href = APP_DOWNLOAD_URL;
  };

  const closeMobileMenuAndRun = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* NAVIGATION */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-lg py-3"
            : "bg-white/80 backdrop-blur-xl border-b border-gray-100 py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-2"
            >
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                <Hotel className="h-6 w-6 text-white" />
              </div>

              <div className="text-left">
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  CloudCafe
                </span>
                <div className="h-1 w-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1" />
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-8">
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="text-gray-700 hover:text-amber-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-3 py-1"
              >
                Features
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("pricing")}
                className="text-gray-700 hover:text-amber-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-3 py-1"
              >
                Pricing
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("download-app")}
                className="text-gray-700 hover:text-amber-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-3 py-1"
              >
                Download App
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("payments")}
                className="text-gray-700 hover:text-amber-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-3 py-1"
              >
                Payments
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("faq")}
                className="text-gray-700 hover:text-amber-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-3 py-1"
              >
                FAQ
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium text-sm">
                    Welcome, {displayName}
                  </span>

                  <button
                    type="button"
                    onClick={handleGoToDashboard}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="text-gray-700 hover:text-amber-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-amber-50 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    Log in
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRegister()}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <Sparkle className="h-3.5 w-3.5" />
                    Register
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              className="lg:hidden p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="lg:hidden py-6 border-t border-gray-100 bg-white/95 backdrop-blur-xl mt-4">
              <div className="flex flex-col space-y-3">
                {[
                  ["Features", "features"],
                  ["Pricing", "pricing"],
                  ["Download App", "download-app"],
                  ["Payments", "payments"],
                  ["FAQ", "faq"],
                ].map(([label, id]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className="text-gray-700 hover:text-amber-600 font-medium py-3 px-4 hover:bg-amber-50 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {label}
                  </button>
                ))}

                <div className="pt-4 border-t border-gray-100">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => closeMobileMenuAndRun(handleGoToDashboard)}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      Go to Dashboard
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleLogin}
                        className="w-full text-gray-700 hover:text-amber-600 font-semibold py-3 px-6 hover:bg-amber-50 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        Log in
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          closeMobileMenuAndRun(() => handleRegister())
                        }
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <Sparkle className="h-3.5 w-3.5" />
                        Register
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50" />
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-white/80 to-transparent" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-rose-200 to-pink-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full opacity-20 blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 mb-8">
              <div className="h-2 w-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-amber-800">
                Cafe SaaS for orders, kitchen, billing, staff and analytics
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Manage Your
              <span className="block mt-4">
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                  Cafe Smarter
                </span>
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              CloudCafe helps cafes manage staff, orders, menu items, kitchen
              display, billing, and analytics from one simple SaaS dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              <button
                type="button"
                onClick={() => handleRegister()}
                className="group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <Sparkle className="h-5 w-5" />
                Get Started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </button>

              <button
                type="button"
                onClick={handleDownloadApp}
                className="group bg-white text-gray-900 border border-gray-200 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <Download className="h-5 w-5 text-amber-600" />
                Download App
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="group text-left bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                    <Sparkles className="h-6 w-6 text-amber-600" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    Explore Features
                  </h3>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  Staff, order, menu, kitchen, billing and analytics tools.
                </p>

                <div className="flex items-center text-amber-600 font-semibold text-sm">
                  View features
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("download-app")}
                className="group text-left bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    Download App
                  </h3>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  Download the Android app directly from our website.
                </p>

                <div className="flex items-center text-blue-600 font-semibold text-sm">
                  Download APK
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("payments")}
                className="group text-left bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl">
                    <Wallet className="h-6 w-6 text-emerald-600" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    Payments
                  </h3>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  We currently support eSewa and Khalti only.
                </p>

                <div className="flex items-center text-emerald-600 font-semibold text-sm">
                  View payments
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {PRODUCT_STATS.map((stat, index) => (
                <div key={index} className="text-center p-4">
                  <p
                    className={`text-3xl sm:text-4xl font-bold mb-2 ${stat.color}`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-gray-900 font-semibold mb-1 text-sm sm:text-base">
                    {stat.label}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {stat.change}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="py-24 scroll-mt-20 bg-gradient-to-b from-white to-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 mb-6">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                REAL CAFE FEATURES
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need
              <span className="block mt-4">
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  To Run Your Cafe
                </span>
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-600">
              Only the core modules your cafe actually uses.
            </p>
          </div>

          <div className="mb-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div
                  className={`mb-6 p-5 rounded-2xl ${FEATURES[activeFeature].bgGradient} w-fit`}
                >
                  <div
                    className={`bg-gradient-to-br ${FEATURES[activeFeature].gradient} p-3 rounded-xl text-white`}
                  >
                    {FEATURES[activeFeature].icon}
                  </div>
                </div>

                <h3 className="text-3xl font-bold mb-4">
                  {FEATURES[activeFeature].title}
                </h3>

                <p className="text-gray-300 mb-8 text-lg">
                  {FEATURES[activeFeature].description}
                </p>

                <div className="flex items-center gap-3 text-emerald-300 font-semibold">
                  <CheckCircle className="h-5 w-5" />
                  Included in CloudCafe
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {FEATURES.map((feature, index) => (
                  <button
                    type="button"
                    key={feature.title}
                    onClick={() => setActiveFeature(index)}
                    className={`p-4 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      activeFeature === index
                        ? "bg-white/10 backdrop-blur-sm border border-white/20"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${feature.bgGradient} mb-3`}>
                      <div
                        className={`bg-gradient-to-br ${feature.gradient} p-2 rounded-lg text-white`}
                      >
                        {feature.icon}
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-white">
                      {feature.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div
                  className={`mb-6 p-5 rounded-2xl ${feature.bgGradient} w-fit`}
                >
                  <div
                    className={`bg-gradient-to-br ${feature.gradient} p-3 rounded-xl text-white`}
                  >
                    {feature.icon}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>

                <p className="text-gray-600 mb-8">{feature.description}</p>

                <div className="flex items-center text-amber-600 font-semibold">
                  Included in CloudCafe
                  <CheckCircle className="h-4 w-4 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOAD APP */}
      <section
        id="download-app"
        className="py-24 scroll-mt-20 bg-gradient-to-b from-white to-blue-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 mb-6">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  DIRECT APP DOWNLOAD
                </span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Download CloudCafe App
                <span className="block mt-4">
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
                    Directly From Website
                  </span>
                </span>
              </h2>

              <p className="text-lg text-gray-600 mb-8">
                Install the CloudCafe Android app directly from our website. No
                Play Store required. Perfect for waiter order-taking, staff
                access, and cafe operations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={APP_DOWNLOAD_URL}
                  download
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-3"
                >
                  <Download className="h-5 w-5" />
                  Download APK
                </a>

                <button
                  type="button"
                  onClick={() => handleRegister()}
                  className="bg-white border border-gray-200 text-gray-900 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-3"
                >
                  <ArrowRight className="h-5 w-5 text-amber-600" />
                  Create Account
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Put your APK file here:{" "}
                <code className="bg-white border border-gray-200 px-2 py-1 rounded">
                  public/downloads/cloudcafe.apk
                </code>
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
              <div className="bg-gray-900 rounded-3xl p-6 text-white">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-gray-400 text-sm">CloudCafe App</p>
                    <h3 className="text-2xl font-bold">Waiter Dashboard</h3>
                  </div>

                  <Smartphone className="h-10 w-10 text-cyan-400" />
                </div>

                <div className="space-y-4">
                  {[
                    "Take orders from table",
                    "Send orders to kitchen",
                    "Check order status",
                    "Manage staff access",
                    "View billing updates",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 bg-white/10 rounded-xl p-4"
                    >
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="py-24 scroll-mt-20 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 mb-6">
              <CreditCard className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700">
                BACKEND PRICING PLANS
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Pricing Plans
              <span className="block mt-4">
                <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                  From Your Backend
                </span>
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-600">
              Plans are loaded from your subscription API using Redux.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-amber-600"
                }`}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-amber-600"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          {loading && !sortedUiPlans.length ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-amber-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading subscription plans...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>

                <p className="text-red-600 font-semibold mb-2">
                  Error loading plans
                </p>

                <p className="text-gray-600 mb-4">{String(error)}</p>

                <button
                  type="button"
                  onClick={() => dispatch(fetchSubscriptionPlans())}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : !sortedUiPlans.length ? (
            <div className="text-center py-20">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md mx-auto">
                <Coffee className="h-10 w-10 text-amber-600 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold mb-2">
                  No active plans found
                </p>
                <p className="text-gray-600">
                  Add active subscription plans from your backend.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {sortedUiPlans.map((plan) => {
                const theme = getPlanTheme(plan.planCode, plan.popular);
                const otherCyclePrice =
                  billingCycle === "monthly"
                    ? plan.yearlyPrice
                    : plan.monthlyPrice;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-3xl overflow-hidden transition-all duration-500 shadow-xl hover:shadow-2xl border-2 ${theme.border} ${
                      plan.popular ? "lg:scale-105" : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div
                          className={`bg-gradient-to-r ${theme.badge} text-white px-7 py-3 rounded-full text-sm font-semibold shadow-2xl flex items-center gap-2`}
                        >
                          <Crown className="h-4 w-4" />
                          POPULAR
                        </div>
                      </div>
                    )}

                    <div className="p-8 h-full flex flex-col">
                      <div className="mb-8">
                        <div
                          className={`p-4 rounded-2xl bg-gradient-to-br ${theme.iconBg} w-fit mb-5`}
                        >
                          <Hotel className={`h-7 w-7 ${theme.iconText}`} />
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <h3 className={`text-3xl font-bold ${theme.title}`}>
                            {plan.name}
                          </h3>

                          {plan.planCode && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                              {prettyPlanCode(plan.planCode)}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 min-h-[48px]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mb-8">
                        <div className="flex items-end gap-2">
                          <span className="text-5xl font-bold text-gray-900">
                            {formatPlanPrice(plan.currentPrice)}
                          </span>

                          {plan.currentPrice > 0 && (
                            <span className="text-gray-500 pb-2">
                              /{billingCycle === "monthly" ? "month" : "year"}
                            </span>
                          )}
                        </div>

                        {otherCyclePrice > 0 && (
                          <p className="text-sm text-gray-500 mt-3">
                            {billingCycle === "monthly"
                              ? `Yearly price: ${formatPlanPrice(otherCyclePrice)}/year`
                              : `Monthly price: ${formatPlanPrice(otherCyclePrice)}/month`}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRegister(plan.id)}
                        className={`w-full py-4 px-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-amber-500 ${theme.button}`}
                      >
                        <CreditCardIcon className="h-5 w-5" />
                        Choose Plan
                      </button>

                      <div className="mt-8 mb-8 flex-1">
                        <h4 className="font-bold text-lg mb-5 text-gray-900">
                          Included:
                        </h4>

                        <ul className="space-y-3">
                          {plan.features.slice(0, 9).map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                              <div
                                className={`p-1 rounded-lg mt-0.5 ${theme.checkBg}`}
                              >
                                <Check className={`h-4 w-4 ${theme.checkText}`} />
                              </div>

                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className={`text-2xl font-bold ${theme.title}`}>
                              {plan.maxStaff || "-"}
                            </p>
                            <p className="text-gray-500 text-sm">Staff</p>
                          </div>

                          <div>
                            <p className={`text-2xl font-bold ${theme.title}`}>
                              {plan.maxTables || "-"}
                            </p>
                            <p className="text-gray-500 text-sm">Tables</p>
                          </div>

                          <div>
                            <p className={`text-2xl font-bold ${theme.title}`}>
                              {plan.maxMenuItems || "-"}
                            </p>
                            <p className="text-gray-500 text-sm">Menu</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* PAYMENTS */}
      <section
        id="payments"
        className="py-24 scroll-mt-20 bg-gradient-to-b from-white to-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 mb-6">
              <Wallet className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                PAYMENT SUPPORT
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Supported Payment
              <span className="block mt-4">
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  Methods
                </span>
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-600">
              CloudCafe currently supports only eSewa and Khalti for online
              payments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method.name}
                className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div
                  className={`p-5 rounded-2xl bg-gradient-to-br ${method.color} w-fit mb-6`}
                >
                  <div className="text-white">{method.icon}</div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {method.name}
                </h3>

                <p className="text-gray-600">{method.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="py-24 scroll-mt-20 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 mb-6">
              <HelpCircle className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                FREQUENTLY ASKED QUESTIONS
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Common Questions
            </h2>

            <p className="text-lg text-gray-600">
              Simple answers about CloudCafe.
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = activeFaq === index;

              return (
                <div
                  key={item.question}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 p-6 text-left focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <span className="text-lg font-bold text-gray-900">
                      {item.question}
                    </span>

                    <span
                      className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                        isOpen
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isOpen ? <X className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                  <Hotel className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-2xl font-bold">CloudCafe</p>
                  <div className="h-1 w-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1" />
                </div>
              </div>

              <p className="text-gray-400">
                Cafe management SaaS for staff, orders, menu, kitchen, billing,
                and analytics.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <div className="space-y-3">
                {["features", "pricing", "download-app", "payments", "faq"].map(
                  (id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => scrollToSection(id)}
                      className="block text-gray-400 hover:text-amber-400 transition-colors capitalize"
                    >
                      {id.replace("-", " ")}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Supported Payments</h3>
              <div className="space-y-3 text-gray-400">
                <p>eSewa</p>
                <p>Khalti</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} CloudCafe. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}