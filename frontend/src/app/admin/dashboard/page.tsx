// // app/admin/dashboard/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useDashboard } from "@/hooks/useDashboard";
// import {
//   BarChart3,
//   Building2,
//   Users,
//   CreditCard,
//   TrendingUp,
//   Download,
//   RefreshCw,
//   Calendar,
//   ChevronDown,
//   AlertCircle,
//   Hotel,
//   DollarSign,
//   Activity,
//   UserCheck,
//   Clock,
//   Globe,
//   Mail,
//   Phone,
//   MapPin,
//   LogOut,
// } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/store";
// import { logoutAdmin } from "@/store/slices/authSlice";
// import { useRouter } from "next/navigation";

// // Components
// import StatCard from "@/components/admin/StatCard";
// import RevenueChart from "@/components/admin/RevenueChart";
// import HotelGrowthChart from "@/components/admin/HotelGrowthChart";
// import RecentHotelsTable from "@/components/admin/RecentHotelsTable";
// import RecentTransactionsTable from "@/components/admin/RecentTransactionsTable";
// import TopHotelsList from "@/components/admin/TopHotelsList";
// import ActivityFeed from "@/components/admin/ActivityFeed";
// import SystemHealthWidget from "@/components/admin/SystemHealthWidget";
// import PlanDistributionChart from "@/components/admin/PlanDistributionChart";

// export default function AdminDashboardPage() {
//   const {
//     data,
//     filters,
//     isLoading,
//     isError,
//     error,
//     lastFetched,
//     updateFilters,
//     refresh,
//     exportData,
//     resetError,
//   } = useDashboard();

//   const dispatch = useDispatch<AppDispatch>();
//   const router = useRouter();
  

//   const [showExportMenu, setShowExportMenu] = useState(false);
//   const [autoRefresh, setAutoRefresh] = useState(true);
//   const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

//   // Auto-refresh every 5 minutes
//   useEffect(() => {
//     if (!autoRefresh) return;

//     const interval = setInterval(
//       () => {
//         refresh();
//         setLastRefreshed(new Date().toLocaleTimeString());
//       },
//       5 * 60 * 1000,
//     );

//     return () => clearInterval(interval);
//   }, [autoRefresh, refresh]);

//   const handleManualRefresh = async () => {
//     await refresh();
//     setLastRefreshed(new Date().toLocaleTimeString());
//   };

//   const handleRangeChange = (range: "7d" | "30d" | "90d" | "1y") => {
//     updateFilters({ range });
//   };

//   const handleExport = (type: "hotels" | "transactions") => {
//     exportData(type);
//     setShowExportMenu(false);
//   };

//   const formatLastFetched = (timestamp: string | null) => {
//     if (!timestamp) return "Never";
//     return new Date(timestamp).toLocaleTimeString();
//   };

//   const handleAdminLogout= () => {
//     dispatch(logoutAdmin());
//     // Optionally, you can also redirect to login page here if not handled by auth state change
//     router.push('/admin/login');
//   }

//   if (isLoading && !data) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   if (isError && !data) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
//           <div className="flex items-center gap-3 text-red-600 mb-4">
//             <AlertCircle className="h-8 w-8" />
//             <h2 className="text-xl font-semibold">Failed to Load Dashboard</h2>
//           </div>
//           <p className="text-gray-600 mb-6">
//             {error || "An unexpected error occurred"}
//           </p>
//           <button
//             onClick={() => {
//               resetError();
//               refresh();
//             }}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!data) return null;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
//               <p className="text-sm text-gray-600">
//                 Welcome back, {data?.metadata?.adminId ? "Admin" : "User"}
//               </p>
//             </div>

//             <div className="flex items-center gap-3">
//               {/* Time Range Selector */}
//               <div className="relative">
//                 <select
//                   value={filters.range}
//                   onChange={(e) => handleRangeChange(e.target.value as any)}
//                   className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2"
//                 >
//                   <option value="7d">Last 7 days</option>
//                   <option value="30d">Last 30 days</option>
//                   <option value="90d">Last 90 days</option>
//                   <option value="1y">Last year</option>
//                 </select>
//                 <Calendar className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
//               </div>

//               {/* Auto-refresh Toggle */}
//               <button
//                 onClick={() => setAutoRefresh(!autoRefresh)}
//                 className={`p-2 rounded-lg border ${
//                   autoRefresh
//                     ? "bg-green-50 border-green-200 text-green-600"
//                     : "bg-gray-50 border-gray-200 text-gray-600"
//                 }`}
//                 title={autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
//               >
//                 <Clock className="h-5 w-5" />
//               </button>

//               {/* Manual Refresh */}
//               <button
//                 onClick={handleManualRefresh}
//                 disabled={isLoading}
//                 className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
//                 title="Refresh now"
//               >
//                 <RefreshCw
//                   className={`h-5 w-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`}
//                 />
//               </button>

//               {/* Export Dropdown */}
//               <div className="relative">
//                 <button
//                   onClick={() => setShowExportMenu(!showExportMenu)}
//                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
//                 >
//                   <Download className="h-4 w-4" />
//                   Export
//                   <ChevronDown className="h-4 w-4" />
//                 </button>

//                 {showExportMenu && (
//                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
//                     <button
//                       onClick={() => handleExport("hotels")}
//                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                     >
//                       Export Hotels
//                     </button>
//                     <button
//                       onClick={() => handleExport("transactions")}
//                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                     >
//                       Export Transactions
//                     </button>
//                   </div>
//                 )}
//               </div>
//               <button
//                 className="p-2 text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors hover:cursor-pointer"
//                 title="Logout"
//                 onClick={handleAdminLogout}
//               >
//                 <LogOut className="h-5 w-5" />
//               </button>
//             </div>
//           </div>

//           {/* Last Refreshed Info */}
//           <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
//             <span>
//               Last updated: {formatLastFetched(lastFetched || lastRefreshed)}
//             </span>
//             {autoRefresh && <span>• Auto-refresh every 5 min</span>}
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <StatCard
//             title="Total Hotels"
//             value={data.summary.totalHotels.toString()}
//             change={`+${data.summary.newHotels} new`}
//             icon={Building2}
//             color="blue"
//           />
//           <StatCard
//             title="Active Hotels"
//             value={data.summary.activeHotels.toString()}
//             percentage={data.summary.activePercentage}
//             icon={Hotel}
//             color="green"
//           />
//           <StatCard
//             title="Monthly Revenue"
//             value={`$${data.summary.mrr}`}
//             change={`${data.summary.revenueGrowth >= 0 ? "+" : ""}${data.summary.revenueGrowth}%`}
//             icon={DollarSign}
//             color="purple"
//           />
//           <StatCard
//             title="Active Staff"
//             value={data.summary.activeStaff30d.toString()}
//             subtitle={`Avg ${data.summary.avgStaffPerHotel} per hotel`}
//             icon={Users}
//             color="orange"
//           />
//         </div>

//         {/* Second Row Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <StatCard
//             title="Paying Hotels"
//             value={data.summary.payingHotels.toString()}
//             subtitle={`${((data.summary.payingHotels / data.summary.totalHotels) * 100).toFixed(1)}% conversion`}
//             icon={CreditCard}
//             color="indigo"
//             size="small"
//           />
//           <StatCard
//             title="Avg Subscription"
//             value={`$${data.summary.averageSubscriptionValue}`}
//             subtitle="Per active hotel"
//             icon={TrendingUp}
//             color="pink"
//             size="small"
//           />
//           <StatCard
//             title="Revenue (Period)"
//             value={`$${data.summary.revenueInPeriod}`}
//             subtitle={`of total $${data.summary.totalRevenue}`}
//             icon={BarChart3}
//             color="teal"
//             size="small"
//           />
//           <StatCard
//             title="Staff per Hotel"
//             value={data.summary.avgStaffPerHotel.toString()}
//             subtitle={`${data.summary.totalStaff} total staff`}
//             icon={UserCheck}
//             color="cyan"
//             size="small"
//           />
//         </div>

//         {/* Charts Row */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//           <RevenueChart data={data.charts.revenue} />
//           <HotelGrowthChart data={data.charts.hotelGrowth} />
//         </div>

//         {/* Third Row - Tables */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//           <RecentHotelsTable hotels={data.recentHotels} />
//           <RecentTransactionsTable transactions={data.recentTransactions} />
//         </div>

//         {/* Fourth Row */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//           <PlanDistributionChart
//             distribution={data.subscriptions.planDistribution}
//           />
//           <TopHotelsList hotels={data.topHotels} />
//           <SystemHealthWidget health={data.systemHealth} />
//         </div>

//         {/* Activity Feed */}
//         <ActivityFeed activities={data.recentActivity} />

//         {/* Subscription Stats Summary */}
//         <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">
//             Subscription Overview
//           </h3>
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             <div className="text-center p-4 bg-gray-50 rounded-lg">
//               <div className="text-2xl font-bold text-gray-900">
//                 {data.subscriptions.total}
//               </div>
//               <div className="text-sm text-gray-600">Total</div>
//             </div>
//             <div className="text-center p-4 bg-green-50 rounded-lg">
//               <div className="text-2xl font-bold text-green-600">
//                 {data.subscriptions.active}
//               </div>
//               <div className="text-sm text-green-600">Active</div>
//             </div>
//             <div className="text-center p-4 bg-yellow-50 rounded-lg">
//               <div className="text-2xl font-bold text-yellow-600">
//                 {data.subscriptions.trial}
//               </div>
//               <div className="text-sm text-yellow-600">Trial</div>
//             </div>
//             <div className="text-center p-4 bg-orange-50 rounded-lg">
//               <div className="text-2xl font-bold text-orange-600">
//                 {data.subscriptions.expired}
//               </div>
//               <div className="text-sm text-orange-600">Expired</div>
//             </div>
//             <div className="text-center p-4 bg-red-50 rounded-lg">
//               <div className="text-2xl font-bold text-red-600">
//                 {data.subscriptions.cancelled}
//               </div>
//               <div className="text-sm text-red-600">Cancelled</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }








// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { useDashboard } from "@/hooks/useDashboard";
import {
  BarChart3,
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Download,
  RefreshCw,
  Calendar,
  ChevronDown,
  AlertCircle,
  Hotel,
  DollarSign,
  UserCheck,
  Clock,
  LogOut,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { logoutAdmin } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";

// Components
import StatCard from "@/components/admin/StatCard";
import RevenueChart from "@/components/admin/RevenueChart";
import HotelGrowthChart from "@/components/admin/HotelGrowthChart";
import RecentHotelsTable from "@/components/admin/RecentHotelsTable";
import RecentTransactionsTable from "@/components/admin/RecentTransactionsTable";
import TopHotelsList from "@/components/admin/TopHotelsList";
import ActivityFeed from "@/components/admin/ActivityFeed";
import SystemHealthWidget from "@/components/admin/SystemHealthWidget";
import PlanDistributionChart from "@/components/admin/PlanDistributionChart";

// Loading component
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Component that uses useSearchParams must be wrapped in Suspense
function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  // Get params safely - they are already available in client components with Suspense
  const rangeParam = searchParams?.get('range') as '7d' | '30d' | '90d' | '1y' | null;
  
  const {
    data,
    filters,
    isLoading,
    isError,
    error,
    lastFetched,
    updateFilters,
    refresh,
    exportData,
    resetError,
  } = useDashboard();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  // Update filter from URL param if present

  const safeRange= filters?.range  ?? "30d";

  useEffect(() => {
    if (rangeParam && rangeParam !== filters.range) {
      updateFilters({ range: rangeParam });
    }
  }, [rangeParam, filters.range, updateFilters]);

  
  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(
      () => {
        refresh();
        setLastRefreshed(new Date().toLocaleTimeString());
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  const handleManualRefresh = async () => {
    await refresh();
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  const handleRangeChange = (range: "7d" | "30d" | "90d" | "1y") => {
    updateFilters({ range });
  };

  const handleExport = (type: "hotels" | "transactions") => {
    exportData(type);
    setShowExportMenu(false);
  };

  const formatLastFetched = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleAdminLogout = () => {
    dispatch(logoutAdmin());
    router.push('/slug');
  };

  if (isLoading && !data) {
    return <DashboardLoading />;
  }

  if (isError && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Failed to Load Dashboard</h2>
          </div>
          <p className="text-gray-600 mb-6">
            {error || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => {
              resetError();
              refresh();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {data?.metadata?.adminId ? "Admin" : "User"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <div className="relative">
                <select
                  value={safeRange}
                  onChange={(e) => handleRangeChange(e.target.value as any)}
                  className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <Calendar className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg border ${
                  autoRefresh
                    ? "bg-green-50 border-green-200 text-green-600"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
                title={autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
              >
                <Clock className="h-5 w-5" />
              </button>

              {/* Manual Refresh */}
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                title="Refresh now"
              >
                <RefreshCw
                  className={`h-5 w-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => handleExport("hotels")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export Hotels
                    </button>
                    <button
                      onClick={() => handleExport("transactions")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export Orders
                    </button>
                  </div>
                )}
              </div>
              <button
                className="p-2 text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors hover:cursor-pointer"
                title="Logout"
                onClick={handleAdminLogout}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Last Refreshed Info */}
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <span>
              Last updated: {formatLastFetched(lastFetched || lastRefreshed)}
            </span>
            {autoRefresh && <span>• Auto-refresh every 5 min</span>}
          </div>
        </div>
      </div>

      {/* Main Content - Same as before */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Hotels"
            value={data.summary.totalHotels.toString()}
            change={`+${data.summary.newHotels} new`}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Active Hotels"
            value={data.summary.activeHotels.toString()}
            percentage={data.summary.activePercentage}
            icon={Hotel}
            color="green"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${data.summary.mrr}`}
            change={`${data.summary.revenueGrowth >= 0 ? "+" : ""}${data.summary.revenueGrowth}%`}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Active Staff"
            value={data.summary.activeStaff30d.toString()}
            subtitle={`Avg ${data.summary.avgStaffPerHotel} per hotel`}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Paying Hotels"
            value={data.summary.payingHotels.toString()}
            subtitle={`${((data.summary.payingHotels / data.summary.totalHotels) * 100).toFixed(1)}% conversion`}
            icon={CreditCard}
            color="indigo"
            size="small"
          />
          <StatCard
            title="Avg Subscription"
            value={`$${data.summary.averageSubscriptionValue}`}
            subtitle="Per active hotel"
            icon={TrendingUp}
            color="pink"
            size="small"
          />
          <StatCard
            title="Revenue (Period)"
            value={`$${data.summary.revenueInPeriod}`}
            subtitle={`of total $${data.summary.totalRevenue}`}
            icon={BarChart3}
            color="teal"
            size="small"
          />
          <StatCard
            title="Staff per Hotel"
            value={data.summary.avgStaffPerHotel.toString()}
            subtitle={`${data.summary.totalStaff} total staff`}
            icon={UserCheck}
            color="cyan"
            size="small"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart data={data.charts.revenue} />
          <HotelGrowthChart data={data.charts.hotelGrowth} />
        </div>

        {/* Third Row - Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RecentHotelsTable hotels={data.recentHotels} />
          <RecentTransactionsTable transactions={data.recentTransactions} />
        </div>

        {/* Fourth Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <PlanDistributionChart
            distribution={data.subscriptions.planDistribution}
          />
          <TopHotelsList hotels={data.topHotels} />
          <SystemHealthWidget health={data.systemHealth} />
        </div>

        {/* Activity Feed */}
        <ActivityFeed activities={data.recentActivity} />

        {/* Subscription Stats Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Subscription Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.subscriptions.total}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.subscriptions.active}
              </div>
              <div className="text-sm text-green-600">Active</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {data.subscriptions.trial}
              </div>
              <div className="text-sm text-yellow-600">Trial</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {data.subscriptions.expired}
              </div>
              <div className="text-sm text-orange-600">Expired</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {data.subscriptions.cancelled}
              </div>
              <div className="text-sm text-red-600">Cancelled</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export with Suspense boundary for async searchParams
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}