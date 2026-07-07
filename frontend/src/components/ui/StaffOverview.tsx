// components/dashboard/StaffOverview.tsx
'use client'

import React from 'react'
import { Staff } from '@/store/slices/dashboardSlice'
import { Users } from 'lucide-react'

interface StaffOverviewProps {
  staff: Staff[]
}

export default function StaffOverview({ staff }: StaffOverviewProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_break': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'waiter': return 'bg-blue-100 text-blue-800';
      case 'chef': return 'bg-amber-100 text-amber-800';
      case 'cook': return 'bg-orange-100 text-orange-800';
      case 'cashier': return 'bg-emerald-100 text-emerald-800';
      case 'cleaner': return 'bg-gray-100 text-gray-800';
      case 'receptionist': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Staff Overview</h3>
            <p className="text-sm text-gray-600">Current staff activity</p>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Manage
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3">
          {staff.slice(0, 6).map((staffMember) => (
            <div key={staffMember.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  {(staffMember.name || staffMember.full_name || staffMember.email || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{(staffMember.name || staffMember.full_name)}</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(staffMember.role)}`}>
                      {staffMember.role}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(staffMember.status)}`}>
                      {staffMember.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{staffMember.today_orders || 0}</span> orders
                </p>
                {staffMember.today_sales && (
                  <p className="text-xs text-gray-600">
                    ${staffMember.today_sales.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}