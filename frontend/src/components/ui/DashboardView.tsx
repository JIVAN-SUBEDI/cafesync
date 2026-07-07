
'use client'

import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/index'
import StatCard from './StatCard'
import RecentOrders from './RecentOrders'
import TableStatus from './TableStatus'
import StaffOverview from './StaffOverview'
import InventoryAlerts from './InventoryAlerts'
import LoadingSpinner from './LoadingSpinner'
import { 
  DollarSign, 
  ShoppingCart, 
  TableIcon, 
  Users 
} from 'lucide-react'

interface DashboardViewProps {
  hotelSlug: string,
  currencySymbol: string
}

export default function DashboardView({ hotelSlug ,currencySymbol}: DashboardViewProps) {
  const { data, loading } = useSelector((state: RootState) => state.dashboard)
  
  // Memoized stat cards to prevent re-renders
  const statCards = useMemo(() => {
    if (!data) return [];
    
    const { stats } = data;
    
    return [
      {
        label: "Today's Revenue",
        value: `${currencySymbol} ${(stats.today_revenue || 0).toLocaleString()}`,
        change: `+${stats.today_orders || 0} orders`,
        icon: <DollarSign className="h-5 w-5" />,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      },
      {
        label: "Active Orders",
        value: (stats.active_orders || 0).toString(),
        change: `${stats.today_orders || 0} today`,
        icon: <ShoppingCart className="h-5 w-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        label: "Table Occupancy",
        value: `${stats.table_occupancy || 0}%`,
        change: `${stats.today_orders ? 'Busy' : 'Available'}`,
        icon: <TableIcon className="h-5 w-5" />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50'
      },

    ];
  }, [data]);

  // Memoized current time to prevent re-renders
  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900">No dashboard data available</h3>
        <p className="text-gray-600 mt-2">Please check your connection and try again</p>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-6">
      {/* Welcome & Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Welcome back, {data.hotel?.admin_name || 'Hotel Admin'}!</h1>
            <p className="text-blue-100">Here's what's happening with your hotel today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-blue-200">Current Time</p>
              <p className="text-lg font-semibold">{currentTime}</p>
            </div>
            <div className="h-10 w-0.5 bg-white/30"></div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Hotel Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="font-semibold">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Orders & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrders orders={data.recent_orders}  currencySymbol={currencySymbol}/>
        <TableStatus tables={data.tables} />
      </div>

      {/* Staff & Inventory */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StaffOverview staff={data.staff} />
   
      </div> */}
    </div>
  );
}