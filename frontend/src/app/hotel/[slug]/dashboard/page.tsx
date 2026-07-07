"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  User,
  Users,
  FolderTree,
  UtensilsCrossed,
  Table as TableIcon,
  Receipt,
  ChefHat,
  Package,
  History,
  ChartNoAxesCombined, 
} from "lucide-react";

import type { RootState, AppDispatch } from "@/store/index";
import { useHotelAuth } from "@/hooks/useHotelAuth";
import { logoutHotel } from "@/store/slices/hotelAuthSlice";
import { fetchDashboardData } from "@/store/slices/dashboardSlice";

import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import DashboardView from "@/components/ui/DashboardView";
import OrdersView from "@/components/ui/OrderView";
import KitchenView from "@/components/ui/KitchenView";
import InventoryView from "@/components/ui/InventoryView";
import SettingsView from "@/components/ui/SettingsView";
import BillingView from "@/components/ui/BillingView";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProfileView from "@/components/ui/ProfileView";
import StaffView from "@/components/ui/StaffView";
import CategoryView from "@/components/ui/CategoryView";
import MenuView from "@/components/ui/MenuView";
import TablesView from "@/components/ui/TablesView";
import SubscriptionView from "@/components/ui/SubscriptionView";
import AnalyticsPage from "@/components/ui/analytics";
import { getCurrencySymbol } from "@/utils/currency";
import type { Hotel, HotelAuthUser } from "@/store/slices/hotelAuthSlice";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  count?: number;
  component: string;
}

type UserRole = "hotel_admin" | "billing" | "kitchen" | string;

export default function HotelDashboardPage() {
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
    (state: RootState) => state.dashboard
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const role: UserRole = user?.role || "hotel_admin";

  const defaultView = useMemo(() => {
    if (role === "billing") return "billing";
    if (role === "kitchen") return "kitchen";
    return "dashboard";
  }, [role]);

  useEffect(() => {
    setCurrentView(defaultView);
    
  }, [defaultView]);

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
  const currencySymbol = getCurrencySymbol(hotel?.currency);
  const isSlugMismatch = useMemo(() => {
    if (!authSlug || !hotelSlug) return false;
    return authSlug !== hotelSlug;
  }, [authSlug, hotelSlug]);

  const sidebarItems: SidebarItem[] = useMemo(() => {
    const counts = dashboardData?.sidebar_counts;

    const allItems: SidebarItem[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        active: currentView === "dashboard",
        component: "dashboard",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: <ChartNoAxesCombined  size={20} />,
        active: currentView === "analytics",
        component: "analytics",
      },

      {
        id: "staff",
        label: "Staff",
        icon: <Users size={20} />,
        active: currentView === "staff",
        component: "staff",
        count: counts?.staff,
      },
      {
        id: "category",
        label: "Menu Category",
        icon: <FolderTree size={20} />,
        active: currentView === "category",
        component: "category",
        count: counts?.category,
      },
      {
        id: "menu",
        label: "Menu",
        icon: <UtensilsCrossed size={20} />,
        active: currentView === "menu",
        component: "menu",
        count: counts?.menu,
      },
      {
        id: "tables",
        label: "Tables",
        icon: <TableIcon size={20} />,
        active: currentView === "tables",
        component: "tables",
        count: counts?.tables,
      },
      {
        id: "orders",
        label: "Orders",
        icon: <Receipt size={20} />,
        active: currentView === "orders",
        component: "orders",
        count: counts?.orders,
      },
      {
        id: "kitchen",
        label: "Kitchen",
        icon: <ChefHat size={20} />,
        active: currentView === "kitchen",
        component: "kitchen",
        count: counts?.kitchen,
      },
      {
        id: "billing",
        label: "Billing",
        icon: <Receipt size={20} />,
        active: currentView === "billing",
        component: "billing",
      },
      {
        id: "profile",
        label: "Profile",
        icon: <User size={20} />,
        active: currentView === "profile",
        component: "profile",
      },


    ];

    if (role === "billing") {
      return allItems.filter((item) =>
        ["billing", "profile", "history"].includes(item.id)
      );
    }

    if (role === "kitchen") {
      return allItems.filter((item) =>
        ["kitchen", "profile", "history"].includes(item.id)
      );
    }

    return allItems;
  }, [currentView, dashboardData, role]);

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
    console.log(hotel?.currency)

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
            Please log in to access the dashboard.
          </p>
        </div>
      );
    }

    switch (currentView) {
      case "dashboard":
        return <DashboardView hotelSlug={hotelSlug} currencySymbol={currencySymbol}/>;

      case "profile":
        return dashboardData ? (
          <ProfileView dashboardData={user} />
        ) : (
          <LoadingSpinner />
        );

      case "staff":
        return <StaffView hotelSlug={hotelSlug} />;

      case "category":
        return <CategoryView hotelSlug={hotelSlug} currencySymbol={currencySymbol}/>;

      case "menu":
        return <MenuView hotelSlug={hotelSlug} currencySymbol={currencySymbol} />;

      case "tables":
        return <TablesView />;

      case "orders":
        return <OrdersView hotelSlug={hotelSlug} currencySymbol={currencySymbol} />;

      case "kitchen":
        return <KitchenView  hotelSlug={hotelSlug} />;

      case "billing":
        return <BillingView currencySymbol={currencySymbol} hotelSlug={hotelSlug} />;

      case "inventory":
        return <InventoryView hotelSlug={hotelSlug} />;
      case "analytics":
        return <AnalyticsPage />;

      case "settings":
        return (
          <SettingsView
            hotelSlug={hotelSlug}
            hotel={hotel}
            adminEmail={hotel.admin_email}
          />
        );
      case "subscription":
        return (
          <SubscriptionView

            hotel={hotel}
        
          />
        );

      case "history":
        return <OrdersView hotelSlug={hotelSlug} />;


      default:
        if (role === "billing") return <BillingView hotelSlug={hotelSlug} />;
        if (role === "kitchen") return <KitchenView hotelSlug={hotelSlug} />;
        return <DashboardView hotelSlug={hotelSlug} />;
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