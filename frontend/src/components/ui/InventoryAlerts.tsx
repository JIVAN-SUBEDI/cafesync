// components/dashboard/InventoryAlerts.tsx
'use client'

import React from 'react'
import { InventoryItem } from '@/store/slices/dashboardSlice'
import { AlertCircle, Package } from 'lucide-react'

interface InventoryAlertsProps {
  inventory: InventoryItem[]
}

export default function InventoryAlerts({ inventory }: InventoryAlertsProps) {
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'out_of_stock':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'low_stock':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'out_of_stock': return 'bg-red-50 border-red-100';
      case 'low_stock': return 'bg-amber-50 border-amber-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case 'out_of_stock': return 'Out of Stock';
      case 'low_stock': return 'Low Stock';
      default: return 'In Stock';
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Inventory Alerts</h3>
            <p className="text-sm text-gray-600">Items running low</p>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
      </div>
      
      <div className="p-4">
      {/* <div className="space-y-3">
        {inventory.length === 0 ? (
          <div className="text-center py-6">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">All items are well stocked</p>
          </div>
        ) : (
          inventory
            .filter(item => item.status === 'low_stock' || item.status === 'out_of_stock')
            .slice(0, 5)
            .map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(item.status)}`}>
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="font-medium text-gray-900">{item.item_name}</p>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      item.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {getStatusText(item.status)}
                    </span>
                    <p className="font-semibold text-gray-900">
                      {item.current_quantity} {item.unit}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Min: {item.min_quantity}</p>
                  {item.days_of_stock && (
                    <p className="text-xs text-gray-600">
                      {item.days_of_stock} days left
                    </p>
                  )}
                </div>
              </div>
            ))
        )}
      </div> */}
      </div>
    </div>
  )
}