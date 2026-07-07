// // components/dashboard/TableStatus.tsx
// 'use client'

// import React from 'react'
// import { Table } from '@/store/slices/dashboardSlice'

// interface TableStatusProps {
//   tables: Table[]
// }

// export default function TableStatus({ tables }: TableStatusProps) {
//   const getTableStatus = (table: Table) => {
//     switch(table.status) {
//       case 'available':
//         return {
//           color: 'bg-emerald-100 text-emerald-800',
//           border: 'border-emerald-200 hover:border-emerald-300',
//           label: 'Available'
//         }
//       case 'occupied':
//         return {
//           color: 'bg-red-100 text-red-800',
//           border: 'border-red-200 hover:border-red-300',
//           label: 'Occupied'
//         }
//       case 'reserved':
//         return {
//           color: 'bg-amber-100 text-amber-800',
//           border: 'border-amber-200 hover:border-amber-300',
//           label: 'Reserved'
//         }
//       case 'cleaning':
//         return {
//           color: 'bg-blue-100 text-blue-800',
//           border: 'border-blue-200 hover:border-blue-300',
//           label: 'Cleaning'
//         }
//       default:
//         return {
//           color: 'bg-gray-100 text-gray-800',
//           border: 'border-gray-200 hover:border-gray-300',
//           label: 'Unknown'
//         }
//     }
//   }

//   return (
//     <div className="bg-white rounded-lg border border-gray-200">
//       <div className="p-4 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="font-semibold text-gray-900">Table Status</h3>
//             <p className="text-sm text-gray-600">Current table occupancy</p>
//           </div>
//           <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
//             View All
//           </button>
//         </div>
//       </div>
      
//       <div className="p-4">
//         <div className="grid grid-cols-2 gap-3">
//           {tables.slice(0, 6).map((table) => {
//             const status = getTableStatus(table)
//             return (
//               <div key={table.id} className={`
//                 border rounded-lg p-3 text-center transition-all hover:shadow-sm
//                 ${status.border}
//               `}>
//                 <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color} mb-2`}>
//                   {status.label}
//                 </div>
//                 <p className="text-lg font-bold text-gray-900">{table.table_number}</p>
//                 <p className="text-sm text-gray-600">{table.capacity} seats</p>
//                 {table.section && (
//                   <p className="text-xs text-gray-500 mt-1">{table.section}</p>
//                 )}
//                 {table.waiter_name && (
//                   <p className="text-xs text-gray-700 mt-1">
//                     Waiter: <span className="font-medium">{table.waiter_name}</span>
//                   </p>
//                 )}
//                 {table.order_amount && (
//                   <p className="text-sm font-semibold text-gray-900 mt-2">
//                     ${table.order_amount.toFixed(2)}
//                   </p>
//                 )}
//               </div>
//             )
//           })}
//         </div>
//       </div>
//     </div>
//   )
// }


// components/dashboard/TableStatus.tsx
'use client'

import React, { useMemo } from 'react'
import { Table } from '@/store/slices/dashboardSlice'

interface TableStatusProps {
  tables: any // <-- allow defensive handling
}

export default function TableStatus({ tables }: TableStatusProps) {
  // ✅ always convert to a real array
  const safeTables: Table[] = useMemo(() => {
    if (Array.isArray(tables)) return tables
    if (Array.isArray(tables?.tables)) return tables.tables
    if (Array.isArray(tables?.data)) return tables.data
    return []
  }, [tables])

  const getTableStatus = (table: Table) => {
    switch (table.status) {
      case 'available':
        return {
          color: 'bg-emerald-100 text-emerald-800',
          border: 'border-emerald-200 hover:border-emerald-300',
          label: 'Available',
        }
      case 'occupied':
        return {
          color: 'bg-red-100 text-red-800',
          border: 'border-red-200 hover:border-red-300',
          label: 'Occupied',
        }
      case 'reserved':
        return {
          color: 'bg-amber-100 text-amber-800',
          border: 'border-amber-200 hover:border-amber-300',
          label: 'Reserved',
        }
      case 'cleaning':
        return {
          color: 'bg-blue-100 text-blue-800',
          border: 'border-blue-200 hover:border-blue-300',
          label: 'Cleaning',
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          border: 'border-gray-200 hover:border-gray-300',
          label: 'Unknown',
        }
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Table Status</h3>
            <p className="text-sm text-gray-600">Current table occupancy</p>
          </div>
   
        </div>
      </div>

      <div className="p-4">
        {safeTables.length === 0 ? (
          <div className="text-sm text-gray-600">No tables found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {safeTables.slice(0, 6).map((table) => {
              const status = getTableStatus(table)
              return (
                <div
                  key={table.id}
                  className={`
                    border rounded-lg p-3 text-center transition-all hover:shadow-sm
                    ${status.border}
                  `}
                >
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color} mb-2`}
                  >
                    {status.label}
                  </div>
                  <p className="text-lg font-bold text-gray-900">{table.table_number}</p>
                  <p className="text-sm text-gray-600">{table.capacity} seats</p>

                  {table.section && (
                    <p className="text-xs text-gray-500 mt-1">{table.section}</p>
                  )}

                  {table.waiter_name && (
                    <p className="text-xs text-gray-700 mt-1">
                      Waiter: <span className="font-medium">{table.waiter_name}</span>
                    </p>
                  )}

                  {typeof table.order_amount === 'number' && (
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      ${table.order_amount.toFixed(2)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
