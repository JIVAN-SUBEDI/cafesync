// components/dashboard/Header.tsx
'use client'

import React, { useState } from 'react'
import { 
  Menu, 
  Bell, 
  Search, 
  Calendar, 
  ChevronDown,
  LogOut
} from 'lucide-react'
import { Hotel } from '@/store/slices/hotelAuthSlice'

interface HeaderProps { 
  onMenuClick: () => void
  hotel: Hotel
  currentView: string
  onLogout:  () => Promise<void> | void; // allow async
}

export default function Header({ 
  onMenuClick,
  hotel,
  currentView,
  onLogout
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    profile: 'Hotel Profile',
    staff: 'Staff Management',
    category: 'Menu Categories',
    menu: 'Menu Items',
    tables: 'Table Management',
    orders: 'Orders',
    kitchen: 'Kitchen Display',
    inventory: 'Inventory',
    settings: 'Settings',
    billing: 'Billing'
  }


    const handleLogoutClick = async () => {
    setShowProfileMenu(false);
    await onLogout(); // important for async handler
  };




  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {viewTitles[currentView] || currentView}
              </h1>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
         

            {/* Notifications */}
        

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  {hotel.hotel_name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">Hotel Admin</p>
                  <p className="text-xs text-gray-500 truncate">{hotel.admin_name}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Signed in as</p>
                    <p className="text-xs text-gray-600 truncate">{hotel.admin_email}</p>
                  </div>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button 
                      onClick={handleLogoutClick}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}