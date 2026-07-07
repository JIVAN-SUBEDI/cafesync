// components/dashboard/RecentOrders.tsx
'use client'

import React from 'react'
import { Order } from '@/store/slices/dashboardSlice'
import { Clock, CheckCircle, CheckCircle2 } from 'lucide-react'

interface RecentOrdersProps {
  orders: Order[],
  currencySymbol: string,
}

export default function RecentOrders({ orders ,currencySymbol}: RecentOrdersProps) {

  const getStatusIcon = (status: Order['status']) => {
    switch(status) {
      case 'completed':
      case 'served':
        return <CheckCircle className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch(status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'served': return 'bg-green-100 text-green-800';
      case 'ready': return 'bg-amber-100 text-amber-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <p className="text-sm text-gray-600">Today's order activity</p>
          </div>

        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Table {order.table_number}</p>
                  <p className="text-sm text-gray-600">{order.customer_name || 'Walk-in Customer'}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">{currencySymbol} {order.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}