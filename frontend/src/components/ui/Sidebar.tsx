'use client'

import React, { useMemo } from 'react'
import {
  Settings,
  CreditCard,
  LogOut,
  Phone,
  Mail,
  Shield,
} from 'lucide-react'
import type { Hotel, HotelAuthUser } from '@/store/slices/hotelAuthSlice'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  active: boolean
  count?: number
  component: string
}

interface SidebarProps {
  items: SidebarItem[]
  user: HotelAuthUser | null
  hotel: Hotel | null
  isMobileOpen: boolean
  onClose: () => void
  onLogout: () => void
  onItemClick: (component: string) => void
}

export default function Sidebar({
  items,
  user,
  hotel,
  isMobileOpen,
  onClose,
  onLogout,
  onItemClick,
}: SidebarProps) {
  const hotelName = hotel?.hotel_name || 'Hotel'
  const hotelSlug = hotel?.hotel_slug || user?.hotel_slug || 'hotel'
  const adminEmail = user?.email || 'No email'
  const hotelImage =
    hotel?.hotel_img || 'https://freesvg.org/img/abstract-user-flat-4.png'

  const subscriptionStatus = hotel?.subscription_status || 'unknown'
  const planName = hotel?.plan_name;


  const startDate =
    subscriptionStatus === 'trial'
      ? hotel?.trial_starts_at
      : hotel?.subscription_start_date

  const endDate =
    subscriptionStatus === 'trial'
      ? hotel?.trial_ends_at
      : hotel?.subscription_end_date

  const daysLeft = useMemo(() => {
    if (!endDate) return null
    const diff = new Date(endDate).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [endDate])

  const progressPercent = useMemo(() => {
    if (!startDate || !endDate) return 70

    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()

    if (now <= start) return 0
    if (now >= end) return 100

    return Math.round(((now - start) / (end - start)) * 100)
  }, [startDate, endDate])

  const isEndingSoon =
    subscriptionStatus === 'active' && daysLeft !== null && daysLeft <= 14 && daysLeft >= 0

  const visibleItems = useMemo(() => {
    const role = user?.role

    if (role === 'hotel_admin') return items

    if (role === 'billing') {
      return items.filter((item) =>
        ['dashboard', 'billing', 'profile'].includes(item.id)
      )
    }

    if (role === 'kitchen') {
      return items.filter((item) =>
        ['dashboard', 'kitchen', 'orders', 'profile'].includes(item.id)
      )
    }

    return items.filter((item) => item.id === 'dashboard')
  }, [items, user?.role])

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'from-emerald-50 to-green-50 border-emerald-100 text-emerald-700'
      case 'trial':
        return 'from-amber-50 to-yellow-50 border-amber-100 text-amber-700'
      case 'suspended':
        return 'from-red-50 to-rose-50 border-red-100 text-red-700'
      default:
        return 'from-gray-50 to-slate-50 border-gray-100 text-gray-700'
    }
  }

  return (
    <>
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200
          transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300 z-50
          flex flex-col self-start
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 border rounded-full overflow-hidden w-14 h-14">
              <img
                src={hotelImage}
                alt={hotelName}
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{hotelName}</h2>
              <p className="text-sm text-gray-500 truncate">@{hotelSlug}</p>
              <p className="text-xs text-blue-600 capitalize">
                {user?.role?.replace('_', ' ') || 'user'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {hotel?.hotel_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate">{hotel.hotel_phone}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600 break-all">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{adminEmail}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onItemClick(item.component)
                  if (window.innerWidth < 1024) onClose()
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${
                    item.active
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 border border-blue-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={item.active ? 'text-blue-500' : 'text-gray-500'}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`
                      px-2 py-1 text-xs font-semibold rounded-full
                      ${
                        item.active
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {user?.role === 'hotel_admin' && (
            <>
              <div className="my-6 border-t border-gray-200" />

              <div className="space-y-1">
                <button
                  onClick={() => {
                    onItemClick('settings')
                    if (window.innerWidth < 1024) onClose()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={20} />
                  <span className="font-medium">Settings</span>
                </button>

                <button
                  onClick={() => {
                    onItemClick('subscription')
                    if (window.innerWidth < 1024) onClose()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <CreditCard size={20} />
                  <span className="font-medium">Subscription</span>
                </button>
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div
            className={`bg-gradient-to-r rounded-xl p-4 border ${getSubscriptionColor(
              subscriptionStatus
            )}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{planName}</p>
                {endDate && (
                  <p className="text-xs opacity-80">
                    Ends {new Date(endDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Shield className="h-4 w-4 shrink-0" />
            </div>

            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
              <div
                className={`
                  h-1.5 rounded-full
                  ${
                    subscriptionStatus === 'active'
                      ? 'bg-emerald-500'
                      : subscriptionStatus === 'trial'
                        ? 'bg-amber-500'
                        : 'bg-gray-400'
                  }
                `}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isEndingSoon && (
              <div className="text-xs mb-3">
                Subscription is ending in {daysLeft} days.
              </div>
            )}

            {subscriptionStatus === 'trial' && (
              <button
                onClick={() => onItemClick('billing')}
                className="w-full text-xs font-semibold bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors"
              >
                Upgrade Now
              </button>
            )}

            {isEndingSoon && (
              <button
                onClick={() => onItemClick('billing')}
                className="w-full text-xs font-semibold bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Pay Now
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}