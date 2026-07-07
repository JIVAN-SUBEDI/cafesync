// components/dashboard/StatCard.tsx
'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  change: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

export default function StatCard({ label, value, change, icon, color, bgColor }: StatCardProps) {
  const isPositive = change.startsWith('+')
  const changeValue = change.replace('+', '').replace('-', '')
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <div className={color}>{icon}</div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">Today</span>
          <p className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'} flex items-center gap-1 justify-end`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </p>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  )
}