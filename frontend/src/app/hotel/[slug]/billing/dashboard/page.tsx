"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import { Receipt, User, History } from "lucide-react";

import type { RootState, AppDispatch } from "@/store/index";
import { useHotelAuth } from "@/hooks/useHotelAuth";
import { logoutHotel } from "@/store/slices/hotelAuthSlice";
import { fetchDashboardData } from "@/store/slices/dashboardSlice";

import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import BillingView from "@/components/ui/BillingView";
import ProfileView from "@/components/ui/ProfileView";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import type { Hotel, HotelAuthUser } from "@/store/slices/hotelAuthSlice";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  count?: number;
  component: string;
}

export default function HotelBillingDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const slugParam = params?.slug;
  const hotelSlug = Array.isArray(slugParam) ? slugParam[0] : slugParam || "";

  const {
    user,
    hotel: authHotel,
    isAuthenticated,
    isLoading: authLoading,
  } = useHotelAuth() as {
    user: HotelAuthUser | null;
    hotel: Hotel | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };

  const { data: dashboardData, loading: dashboardLoading } = useSelector(
    (state: RootState) => state.dashboard,
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState("billing");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const hotel = useMemo<Hotel | null>(() => {
    if (!authHotel) return null;

    const sameHotel =
      dashboardData?.hotel &&
      (dashboardData.hotel.id === authHotel.id ||
        dashboardData.hotel.hotel_slug === authHotel.hotel_slug);

    if (sameHotel) {
      return {
        ...authHotel,
        ...dashboardData.hotel,
      };
    }

    return authHotel;
  }, [authHotel, dashboardData]);

  const authSlug = useMemo(() => {
    return hotel?.hotel_slug || user?.hotel_slug || null;
  }, [hotel, user]);

  const isSlugMismatch = useMemo(() => {
    if (!authSlug || !hotelSlug) return false;
    return authSlug !== hotelSlug;
  }, [authSlug, hotelSlug]);

  const sidebarItems: SidebarItem[] = useMemo(() => {
    return [
      {
        id: "billing",
        label: "Billing",
        icon: <Receipt size={20} />,
        active: currentView === "billing",
        component: "billing",
      },
      {
        id: "history",
        label: "History",
        icon: <History size={20} />,
        active: currentView === "history",
        component: "history",
      },
      {
        id: "profile",
        label: "Profile",
        icon: <User size={20} />,
        active: currentView === "profile",
        component: "profile",
      },
    ];
  }, [currentView]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (isSlugMismatch && authSlug) {
      router.replace(`/hotel/${authSlug}/dashboard`);
    }
  }, [authLoading, isAuthenticated, isSlugMismatch, authSlug, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (!authSlug) return;
    if (!hotelSlug) return;
    if (authSlug !== hotelSlug) return;

    dispatch(fetchDashboardData());
  }, [authLoading, isAuthenticated, authSlug, hotelSlug, dispatch]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await dispatch(logoutHotel()).unwrap();
      toast.success("Logged out successfully");
      router.replace("/");
    } catch {
      toast.error("Failed to logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleItemClick = (component: string) => {
    setCurrentView(component);
    setIsSidebarOpen(false);
  };

  const renderView = () => {
    if (authLoading || isLoggingOut || (dashboardLoading && !dashboardData)) {
      return <LoadingSpinner />;
    }

    if (!hotel) {
      return (
        <div className="py-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Hotel not found
          </h3>
          <p className="mt-2 text-gray-600">
            Please log in to access the billing dashboard.
          </p>
        </div>
      );
    }

    switch (currentView) {
      case "billing":
        return <BillingView hotelSlug={hotelSlug} />;

      case "history":
        return <BillingView hotelSlug={hotelSlug} mode="history" />;

      case "profile":
        return dashboardData ? (
          <ProfileView dashboardData={dashboardData} />
        ) : (
          <LoadingSpinner />
        );

      default:
        return <BillingView hotelSlug={hotelSlug} />;
    }
  };

  if (authLoading || isLoggingOut) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated || isSlugMismatch || !hotel) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            borderRadius: "8px",
            border: "1px solid #374151",
          },
        }}
      />

      <Sidebar
        items={sidebarItems}
        user={user}
        hotel={hotel}
        isMobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        onItemClick={handleItemClick}
      />

      <div className="flex flex-1 flex-col">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          hotel={hotel}
          currentView={currentView}
          onLogout={handleLogout}
        />

        <main className="p-4 md:p-6">{renderView()}</main>
      </div>
    </div>
  );
}