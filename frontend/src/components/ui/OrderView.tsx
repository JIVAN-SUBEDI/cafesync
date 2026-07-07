
'use client'

import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/index'
import { 
  fetchOrders, 
  createOrder, 
  updateOrderStatus, 
  deleteOrder,
  updatePaymentStatus, 
  updateOrder
} from '@/store/slices/dashboardSlice'
import { Plus, Filter, Download, Edit, Trash2, Eye, Receipt, CreditCard } from 'lucide-react'
import OrderModal from './OrderModal'
import ConfirmModal from './ConfirmModal'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'

interface OrdersViewProps {
  hotelSlug: string,
  currencySymbol: string,

}

export default function OrdersView({ hotelSlug,currencySymbol }: OrdersViewProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { ordersList, loading } = useSelector((state: RootState) => state.dashboard)
  
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingOrder, setViewingOrder] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    if (hotelSlug) {
      dispatch(fetchOrders(hotelSlug))
    }
  }, [hotelSlug, dispatch])

  const handleCreateOrder = async (orderData: any) => {
    try {
      // Prepare order data for API
      const apiOrderData = {
        table_id: orderData.table_id,
        waiter_id: orderData.waiter_id,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        special_instructions: orderData.special_instructions,
        kitchen_notes: orderData.kitchen_notes,
        discount_amount: parseFloat(orderData.discount_amount) || 0,
        tax_amount: parseFloat(orderData.tax_amount) || 0,
        service_charge: parseFloat(orderData.service_charge) || 0,
        payment_method: orderData.payment_method,
        paid_amount: parseFloat(orderData.paid_amount) || 0,
        subtotal: parseFloat(orderData.subtotal) || 0,
        total_amount: parseFloat(orderData.total_amount) || 0,
        status: orderData.status || 'pending',
        payment_status: orderData.payment_status || 'pending',
        items: orderData.items || []
      }
      
      await dispatch(createOrder({ hotelSlug, orderData: apiOrderData })).unwrap()
      toast.success('Order created successfully')
      setShowOrderModal(false)
      dispatch(fetchOrders(hotelSlug)) // Refresh orders
    } catch (error: any) {
      toast.error(error || 'Failed to create order')
    }
  }

  // const handleUpdateOrder = async (orderData: any) => {
  //   try {
  //     // For now, only update status through the status dropdown
  //     // If you need full order update, you'll need a separate API endpoint
  //     toast.success('Order updated successfully')
  //     setShowOrderModal(false)
  //     setEditingOrder(null)
  //     dispatch(fetchOrders(hotelSlug)) // Refresh orders
  //   } catch (error: any) {
  //     toast.error(error || 'Failed to update order')
  //   }
  // }

  const handleUpdateOrder = async (orderData: any) => {
  try {
    // Prepare order data for API
    const apiOrderData = {
      table_id: orderData.table_id,
      waiter_id: orderData.waiter_id,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      special_instructions: orderData.special_instructions,
      kitchen_notes: orderData.kitchen_notes,
      discount_amount: parseFloat(orderData.discount_amount) || 0,
      tax_amount: parseFloat(orderData.tax_amount) || 0,
      service_charge: parseFloat(orderData.service_charge) || 0,
      payment_method: orderData.payment_method,
      paid_amount: parseFloat(orderData.paid_amount) || 0,
      subtotal: parseFloat(orderData.subtotal) || 0,
      total_amount: parseFloat(orderData.total_amount) || 0,
      status: orderData.status || 'pending',
      payment_status: orderData.payment_status || 'pending',
      items: orderData.items || []
    }
    
    // You need to add a dispatch for update order action
    // Assuming you have an updateOrder action in dashboardSlice
    await dispatch(updateOrder({ hotelSlug, orderId: editingOrder?.id, orderData: apiOrderData })).unwrap()
    
    toast.success('Order updated successfully')
    setShowOrderModal(false)
    setEditingOrder(null)
    dispatch(fetchOrders(hotelSlug)) // Refresh orders
  } catch (error: any) {
    toast.error(error?.message || 'Failed to update order')
  }
}

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return
    
    try {
      await dispatch(deleteOrder({ hotelSlug, orderId: selectedOrder.id })).unwrap()
      toast.success('Order deleted successfully')
      setShowDeleteModal(false)
      setSelectedOrder(null)
      dispatch(fetchOrders(hotelSlug)) // Refresh orders
    } catch (error: any) {
      toast.error(error || 'Failed to delete order')
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await dispatch(updateOrderStatus({ 
        hotelSlug, 
        orderId, 
        status: status as "pending" |"preparing" | "ready" | "completed" | "cancelled" 
      })).unwrap()
      toast.success(`Order status updated to ${status}`)
      dispatch(fetchOrders(hotelSlug)) // Refresh orders
    } catch (error: any) {
      toast.error(error || 'Failed to update order status')
    }
  }

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      await dispatch(updatePaymentStatus({ 
        hotelSlug, 
        orderId, 
        paymentStatus: paymentStatus as any 
      })).unwrap()
      toast.success(`Payment status updated to ${paymentStatus}`)
      dispatch(fetchOrders(hotelSlug)) // Refresh orders
    } catch (error: any) {
      toast.error(error || 'Failed to update payment status')
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'ready': return 'bg-amber-100 text-amber-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'partial': return 'bg-amber-100 text-amber-800';
      case 'partially_paid': return 'bg-amber-100 text-amber-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return currencySymbol+' 0.00'
    return `${currencySymbol} ${Number(amount).toFixed(2)}`
  }

  const filteredOrders = ordersList?.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesPayment = filterPayment === 'all' || order.payment_status === filterPayment
    const matchesSearch = order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.table_number?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesPayment && matchesSearch
  }) || []

  const pendingOrders = ordersList?.filter(o => o.status === 'pending').length || 0
  const preparingOrders = ordersList?.filter(o => o.status === 'preparing').length || 0
  const completedOrders = ordersList?.filter(o => o.status === 'completed').length || 0

  const handleExport = () => {
    const exportData = filteredOrders.map(order => ({
      'Order #': order.order_number,
      'Table': order.table_number || 'Takeaway',
      'Customer': order.customer_name || 'Walk-in Customer',
      'Amount': order.amount,
      'Status': order.status,
      'Payment Status': order.payment_status,
      'Date': order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'
    }))
    
    const csv = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && (!ordersList || ordersList.length === 0)) {
    return <LoadingSpinner />
  }

  console.log("viewing order", viewingOrder)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Orders Management</h1>
            <p className="text-blue-100">Manage all hotel orders and payments</p>
          </div>
          <button 
            onClick={() => {
              setEditingOrder(null)
              setShowOrderModal(true)
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Order
          </button>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{ordersList?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Receipt className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Preparing</p>
              <p className="text-2xl font-bold text-gray-900">{preparingOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900">All Orders</h3>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
    
              <button 
                onClick={handleExport}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">Order #</th>
                <th className="p-4 font-medium">Table</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-xs text-gray-600">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-900">{order.table_number || 'Takeaway'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-900">{order.customer_name || 'Walk-in Customer'}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount || order.amount)}</p>
                    {/* <p className="text-xs text-gray-600">{order.items_count || 0} items</p> */}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border focus:ring-1 focus:ring-blue-500 ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
          
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setViewingOrder(order)
                          setShowViewModal(true)
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    <button 
  onClick={() => {
    setEditingOrder({
      ...order,
      items: Array.isArray(order.order_items) ? order.order_items : [],
    })
    setShowOrderModal(true)
  }}
  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
>
  <Edit className="h-4 w-4" />
</button>
                      <button 
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowDeleteModal(true)
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No orders found</p>
              <button 
                onClick={() => {
                  setEditingOrder(null)
                  setShowOrderModal(true)
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Create your first order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Modal */}
      <OrderModal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false)
          setEditingOrder(null)
        }}
        onSubmit={editingOrder ? handleUpdateOrder : handleCreateOrder}
        initialData={editingOrder}
        hotelSlug={hotelSlug}
        currencySymbol={currencySymbol}
      />

      {/* View Order Modal */}
        {/* View Order Modal */}
{showViewModal && viewingOrder && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex justify-between items-start p-6 border-b">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
          <p className="text-sm text-gray-500 mt-1">
            View complete order information and ordered items
          </p>
        </div>
        <button
          onClick={() => setShowViewModal(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Order Number</p>
            <p className="font-semibold text-gray-900 mt-1">
              {viewingOrder.order_number}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Table</p>
            <p className="font-semibold text-gray-900 mt-1">
              {viewingOrder.table_number || 'Takeaway'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Customer</p>
            <p className="font-semibold text-gray-900 mt-1">
              {viewingOrder.customer_name || 'Walk-in Customer'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-semibold text-gray-900 mt-1">
              {viewingOrder.customer_phone || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Status</p>
            <div className="mt-2">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  viewingOrder.status
                )}`}
              >
                {viewingOrder.status}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Payment Status</p>
            <div className="mt-2">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                  viewingOrder.payment_status || 'pending'
                )}`}
              >
                {viewingOrder.payment_status || 'pending'}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Subtotal</p>
            <p className="font-semibold text-gray-900 mt-1">
              {formatCurrency(viewingOrder.subtotal || viewingOrder.amount || 0)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="font-semibold text-gray-900 mt-1">
              {formatCurrency(viewingOrder.total_amount || viewingOrder.amount || 0)}
            </p>
          </div>
        </div>

        {/* Extra Charges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Discount</p>
            <p className="font-medium text-gray-900 mt-1">
              {formatCurrency(viewingOrder.discount_amount || 0)}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Tax</p>
            <p className="font-medium text-gray-900 mt-1">
              {formatCurrency(viewingOrder.tax_amount || 0)}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Service Charge</p>
            <p className="font-medium text-gray-900 mt-1">
              {formatCurrency(viewingOrder.service_charge || 0)}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Special Instructions</p>
            <p className="text-gray-900">
              {viewingOrder.special_instructions || 'None'}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Kitchen Notes</p>
            <p className="text-gray-900">
              {viewingOrder.kitchen_notes || 'None'}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
           <span className="text-sm text-gray-500">
  {Array.isArray(viewingOrder.order_items)
    ? viewingOrder.order_items.length
    : viewingOrder.items || 0} item(s)
</span>
          </div>

          {Array.isArray(viewingOrder.order_items) && viewingOrder.order_items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewingOrder.order_items.map((item: any, index: number) => {
                const qty = Number(item.quantity || 0)
                const unitPrice = Number(
                  item.unit_price ??
                    item.price ??
                    item.menu_item_price ??
                    item.menu_item?.price ??
                    0
                )
                const subtotal =
                  Number(item.subtotal ?? item.total_price ?? qty * unitPrice)

                const itemName =
                  item.menu_item_name ||
                  item.item_name ||
                  item.name ||
                  item.menu_item?.name ||
                  `Item ${index + 1}`

                const itemImage =
                  item.image_url ||
                  item.menu_item_image ||
                  item.menu_item?.image_url ||
                  item.menu_item?.image

                const itemStatus = item.status || 'pending'
                const instructions =
                  item.special_instructions ||
                  item.notes ||
                  item.item_notes ||
                  ''

                return (
                  <div
                    key={item.id || index}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {itemImage ? (
                          <img
                            src={itemImage}
                            alt={itemName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs text-center px-2">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 truncate">
                              {itemName}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Qty: {qty} × {formatCurrency(unitPrice)}
                            </p>
                          </div>

                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              itemStatus
                            )}`}
                          >
                            {itemStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-gray-500">Unit Price</p>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(unitPrice)}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-gray-500">Subtotal</p>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(subtotal)}
                            </p>
                          </div>
                        </div>

                        {instructions && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">
                              Item Instructions
                            </p>
                            <p className="text-sm text-gray-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                              {instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No item details available for this order</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end p-6 border-t bg-gray-50">
        <button
          onClick={() => setShowViewModal(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedOrder(null)
        }}
        onConfirm={handleDeleteOrder}
        title="Delete Order"
        message={`Are you sure you want to delete order "${selectedOrder?.order_number}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}