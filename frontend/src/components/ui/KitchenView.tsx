'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/index'
import {
  fetchKitchenOrders,
  updateKitchenItemStatus,
} from '@/store/slices/dashboardSlice'
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  UtensilsCrossed,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'
import { io, Socket } from 'socket.io-client'

interface KitchenViewProps {
  hotelSlug: string
}

type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

interface KitchenOrderItem {
  id: string
  order_id: string
  name?: string
  item_name?: string
  menu_name?: string
  quantity?: number
  notes?: string
  special_instruction?: string
}

interface KitchenOrder {
  id: string
  order_number: string
  table_number?: string | number
  status: KitchenStatus
  time?: string
  chef_name?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  order_type?: string
  notes?: string | null
  kitchen_notes?: string | null
  special_instructions?: string | null
  order_items: KitchenOrderItem[]
  created_at?: string
  total_amount?: number
  subtotal?: number
  tax_amount?: number
  service_charge?: number
  payment_status?: string
  waiter_name?: string | null
  items_count?: number
  total_quantity?: number
}

interface OrderStatusSocketPayload {
  orderId: string
  status: KitchenStatus
}

export default function KitchenView({ hotelSlug }: KitchenViewProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { kitchenOrdersList = [], loading } = useSelector(
    (state: RootState) => state.dashboard
  )

  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (!hotelSlug) return
    dispatch(fetchKitchenOrders(hotelSlug))
  }, [hotelSlug, dispatch])

  useEffect(() => {
    setOrders(kitchenOrdersList as KitchenOrder[])
  }, [kitchenOrdersList])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const socket: Socket = io('http://localhost:4000',{
      withCredentials: true,
    })

    socket.on('connect', () => {
      console.log('connected:', socket.id)
    })

    socket.on('order:new', (newOrder: KitchenOrder) => {
      setOrders((prev) => {
        const exists = prev.some((order) => order.id === newOrder.id)
        if (exists) return prev
        return [newOrder, ...prev]
      })
      console.log(newOrder)
      toast.success(`New order: ${newOrder.order_number}`)
    })

    socket.on('order:status', ({ orderId, status }: OrderStatusSocketPayload) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      )

      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status } : prev
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [])


  const handleUpdateOrderStatus = async (
    orderId: string,
    status: KitchenStatus
  ) => {
    try {
      await dispatch(
        updateKitchenItemStatus({
          orderId,
          status,
        })
      ).unwrap()

      toast.success('Order status updated')

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      )

      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status } : prev
      )
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'preparing':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'completed':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCardStyle = (status: string) => {
    switch (status) {
      case 'ready':
        return 'border-emerald-200 bg-emerald-50'
      case 'preparing':
        return 'border-blue-200 bg-blue-50'
      case 'pending':
        return 'border-amber-200 bg-white'
      case 'completed':
        return 'border-slate-200 bg-slate-50'
      case 'cancelled':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4" />
      case 'preparing':
        return <Clock className="h-4 w-4" />
      case 'pending':
        return <AlertCircle className="h-4 w-4" />
      case 'completed':
        return <UtensilsCrossed className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const normalizeItems = (orderItems: KitchenOrderItem[]) => {
    if (!Array.isArray(orderItems)) return []

    return orderItems.map((item, index) => ({
      id: String(item?.id ?? index),
      name:
        item?.name ||
        item?.item_name ||
        item?.menu_name ||
        `Item ${index + 1}`,
      quantity: item?.quantity || 1,
      notes: item?.notes || item?.special_instruction || '',
    }))
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filterStatus === 'all') return true
      return order.status === filterStatus
    })
  }, [orders, filterStatus])

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
  const readyCount = orders.filter((o) => o.status === 'ready').length
  const completedCount = orders.filter((o) => o.status === 'completed').length

  if (loading && orders.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kitchen Display System</h1>
            <p className="mt-1 text-sm text-orange-100">
              Manage orders, update cooking status, and check full order details
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 px-4 py-3 text-right backdrop-blur">
              <p className="text-xs text-orange-100">Kitchen Time</p>
              <p className="text-lg font-semibold">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>

        
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          title="Pending"
          count={pendingCount}
          icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
          boxClass="bg-amber-50"
        />
        <StatCard
          title="Preparing"
          count={preparingCount}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          boxClass="bg-blue-50"
        />
        <StatCard
          title="Ready"
          count={readyCount}
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          boxClass="bg-emerald-50"
        />
        <StatCard
          title="Completed"
          count={completedCount}
          icon={<UtensilsCrossed className="h-5 w-5 text-slate-600" />}
          boxClass="bg-slate-50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              filterStatus === status
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <ChefHat className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900">No Active Orders</h3>
            <p className="mt-2 text-sm text-gray-600">
              There are no orders in this status right now.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const items = normalizeItems(order.order_items)

            return (
              <div
                key={order.id}
                className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${getCardStyle(
                  order.status
                )}`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {order.order_number}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <span>
                        {order.table_number ? `Table ${order.table_number}` : 'No table'}
                      </span>
                      {order.customer_name && (
                        <>
                          <span>•</span>
                          <span>{order.customer_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(order.time || order.created_at || '').toLocaleString()}</span>
                  </div>

                  {order.waiter_name ? (
                    <span>
                      Waiter: <span className="font-medium text-gray-800">{order.waiter_name}</span>
                    </span>
                  ) : null}
                </div>

                {(order.kitchen_notes || order.special_instructions) && (
                  <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                      Order Note
                    </p>
                    <p className="mt-1 text-sm text-orange-900">
                      {order.kitchen_notes || order.special_instructions}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Items</h4>
                    <span className="text-xs text-gray-500">
                      {order.items_count || items.length} item(s)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {item.quantity}x {item.name}
                          </p>
                          {item.notes ? (
                            <p className="truncate text-xs text-gray-500">{item.notes}</p>
                          ) : null}
                        </div>

                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium capitalize ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    ))}

                    {items.length > 3 && (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-sm font-medium text-orange-600 hover:text-orange-700"
                      >
                        View {items.length - 3} more item(s)
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                    {order.status === 'pending' || order.status === 'preparing' ? (
                  <button
                    onClick={() =>
                      handleUpdateOrderStatus(
                        order.id,
                        order.status === 'pending' ? 'preparing' : 'ready'
                      )
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                      order.status === 'ready'
                        ? 'bg-slate-700 hover:bg-slate-800'
                        : order.status === 'preparing'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {order.status === 'pending'
                      ? 'Start Cooking'
                      : order.status === 'preparing'
                      ? 'Mark Ready'
                      : 'Update Status'}
                  </button>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  )
}

function StatCard({
  title,
  count,
  icon,
  boxClass,
}: {
  title: string
  count: number
  icon: React.ReactNode
  boxClass: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${boxClass}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
      </div>
    </div>
  )
}

function OrderDetailsModal({
  order,
  onClose,
  onUpdateOrderStatus,
  getStatusColor,
}: {
  order: KitchenOrder
  onClose: () => void
  onUpdateOrderStatus: (orderId: string, status: KitchenStatus) => Promise<void>
  getStatusColor: (status: string) => string
}) {
  const items = order.order_items.map((item, index) => ({
    id: String(item?.id ?? index),
    name:
      item?.name ||
      item?.item_name ||
      item?.menu_name ||
      `Item ${index + 1}`,
    quantity: item?.quantity || 1,
    notes: item?.notes || item?.special_instruction || '',
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{order.order_number}</h2>
            <p className="text-sm text-gray-600">
              {order.table_number ? `Table ${order.table_number}` : 'No table'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-6 py-5">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>

            {order.time && (
              <span className="text-sm text-gray-500">
                {new Date(order.time).toLocaleString()}
              </span>
            )}
          </div>

          {(order.customer_name || order.customer_phone) && (
            <div className="mb-4 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Customer
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {order.customer_name || 'Walk-in Customer'}
              </p>
              {order.customer_phone && (
                <p className="text-xs text-gray-500">{order.customer_phone}</p>
              )}
            </div>
          )}

          {(order.kitchen_notes || order.special_instructions) && (
            <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                Kitchen Note
              </p>
              <p className="mt-1 text-sm text-orange-900">
                {order.kitchen_notes || order.special_instructions}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="font-semibold text-gray-900">All Order Items</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {item.quantity}x {item.name}
                    </p>
                    {item.notes ? (
                      <p className="mt-1 text-xs text-gray-500">Note: {item.notes}</p>
                    ) : null}
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Start Preparing
            </button>
            <button
              onClick={() => onUpdateOrderStatus(order.id, 'ready')}
              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Mark Ready
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}