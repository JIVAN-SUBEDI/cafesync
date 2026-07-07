'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/store'
import {
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Table2,
  ShoppingCart,
  CheckCircle2,
  RefreshCcw,
  Printer,
} from 'lucide-react'
import toast from 'react-hot-toast'

import {
  fetchOrders,
  fetchMenuItems,
  fetchPaymentMethods,
  updatePaymentStatus,
} from '@/store/slices/dashboardSlice'







interface HotelInfo {
  id: string
  hotel_name: string
  hotel_slug: string
  admin_name?: string
  admin_email?: string
  hotel_phone?: string
  hotel_address?: string
  city?: string
  country?: string
  timezone?: string
  currency?: string
  tax_rate?: number
  service_charge?: number
  subscription_status?: string
  subscription_plan_id?: string | null
  subscription_end_date?: string
  is_active?: boolean
  is_verified?: boolean
  created_at?: string
  updated_at?: string
}

interface DashboardStats {
  today_orders?: number | string
  today_revenue?: number | string
  active_orders?: number | string
  table_occupancy?: number | string
  staff_active?: string
  pending_kitchen_orders?: number | string
  low_inventory_items?: number | string
}

interface DashboardPayload {
  hotel?: HotelInfo | null
  stats?: DashboardStats
}

// interface ProfileViewProps {
//   dashboardData: DashboardPayload
// }












interface BillingViewProps {
  hotelSlug?: string
  currencySymbol?: string
}

export default function BillingView({ hotelSlug, currencySymbol }: BillingViewProps) {
  const dispatch = useDispatch<AppDispatch>()
  // const hotel= dashboardData.hotel

  const {
    ordersList,
    menuItemsList,
    paymentMethods,
    loading,

  } = useSelector((state: RootState) => state.dashboard)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [editableItems, setEditableItems] = useState<any[]>([])
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [taxAmount, setTaxAmount] = useState<number>(0)
  const [serviceCharge, setServiceCharge] = useState<number>(0)
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [kitchenNotes, setKitchenNotes] = useState('')

  const fetchedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!hotelSlug) return
    if (fetchedRef.current === hotelSlug) return

    fetchedRef.current = hotelSlug

    dispatch(fetchOrders(hotelSlug))
    dispatch(fetchMenuItems(hotelSlug))
    // console.log(hotel)
    dispatch(fetchPaymentMethods(hotelSlug))
  }, [dispatch, hotelSlug])

  const menuItems = useMemo(() => {
    return Array.isArray(menuItemsList) ? menuItemsList : []
  }, [menuItemsList])

  const activeTableOrders = useMemo(() => {
    const list = Array.isArray(ordersList) ? ordersList : []

    return list.filter((order: any) => {
      const hasTable = order.table_id || order.table_number
      const isOpen = !['completed', 'cancelled'].includes(
        String(order.status || '').toLowerCase(),
      )

      return hasTable && isOpen
    })
  }, [ordersList])

  const filteredTables = useMemo(() => {
    return activeTableOrders.filter((order: any) => {
      const tableText =
        `${order.table_number || ''} ${order.order_number || ''} ${order.customer_name || ''}`.toLowerCase()

      return tableText.includes(searchTerm.toLowerCase())
    })
  }, [activeTableOrders, searchTerm])

  useEffect(() => {
    if (!selectedTableId || !activeTableOrders.length) return

    const found = activeTableOrders.find(
      (order: any) =>
        String(order.table_id || order.id) === String(selectedTableId),
    )

    if (found) {
      loadOrder(found)
    }
  }, [selectedTableId, activeTableOrders])

  const loadOrder = (order: any) => {
    setSelectedOrder(order)

    if (order.hotel_id) {
      dispatch(fetchPaymentMethods(order.hotel_id))
    }

    const normalizedItems = Array.isArray(order.order_items)
      ? order.order_items.map((item: any) => ({
          id:
            item.id ||
            `${item.menu_item_id || item.menu_item?.id || 'item'}-${Math.random()}`,
          menu_item_id: item.menu_item_id || item.menu_item?.id || item.id,
          name:
            item.menu_item_name ||
            item.item_name ||
            item.name ||
            item.menu_item?.name ||
            'Item',
          quantity: Number(item.quantity || 1),
          unit_price: Number(
            item.unit_price ??
              item.price ??
              item.menu_item_price ??
              item.menu_item?.price ??
              0,
          ),
          subtotal: Number(
            item.subtotal ??
              item.total_price ??
              Number(item.quantity || 1) *
                Number(
                  item.unit_price ??
                    item.price ??
                    item.menu_item_price ??
                    item.menu_item?.price ??
                    0,
                ),
          ),
          image_url:
            item.image_url ||
            item.menu_item_image ||
            item.menu_item?.image_url ||
            '',
          special_instructions:
            item.special_instructions || item.notes || item.item_notes || '',
        }))
      : []

    setEditableItems(normalizedItems)
    setPaymentMethod('')
    setDiscountAmount(Number(order.discount_amount || 0))
    setTaxAmount(Number(order.tax_amount || 0))
    setServiceCharge(Number(order.service_charge || 0))
    setPaidAmount(0)
    setCustomerName(order.customer_name || '')
    setCustomerPhone(order.customer_phone || '')
    setSpecialInstructions(order.special_instructions || '')
    setKitchenNotes(order.kitchen_notes || '')
  }

  const subtotal = useMemo(() => {
    return editableItems.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.unit_price || 0)
    }, 0)
  }, [editableItems])

  const grandTotal = useMemo(() => {
    return (
      subtotal -
      Number(discountAmount || 0) +
      Number(taxAmount || 0) +
      Number(serviceCharge || 0)
    )
  }, [subtotal, discountAmount, taxAmount, serviceCharge])

  const alreadyPaidAmount = useMemo(() => {
    return Number(
      selectedOrder?.paid_amount ||
        selectedOrder?.total_paid ||
        selectedOrder?.payments_paid ||
        0,
    )
  }, [selectedOrder])

  const dueAmount = useMemo(() => {
    return Math.max(grandTotal - alreadyPaidAmount, 0)
  }, [grandTotal, alreadyPaidAmount])

  const dueAfterCurrentPayment = useMemo(() => {
    return Math.max(dueAmount - Number(paidAmount || 0), 0)
  }, [dueAmount, paidAmount])

  const changeQty = (index: number, type: 'inc' | 'dec') => {
    setEditableItems((prev) =>
      prev
        .map((item, i) => {
          if (i !== index) return item

          const nextQty =
            type === 'inc'
              ? Number(item.quantity || 0) + 1
              : Number(item.quantity || 0) - 1

          return {
            ...item,
            quantity: nextQty,
            subtotal: nextQty * Number(item.unit_price || 0),
          }
        })
        .filter((item) => item.quantity > 0),
    )
  }

  const removeItem = (index: number) => {
    setEditableItems((prev) => prev.filter((_, i) => i !== index))
  }

  const addMenuItemToBill = () => {
    if (!selectedMenuItemId) {
      toast.error('Please select an item')
      return
    }

    const item = menuItems.find(
      (m: any) => String(m.id) === String(selectedMenuItemId),
    )

    if (!item) {
      toast.error('Menu item not found')
      return
    }

    setEditableItems((prev) => {
      const existingIndex = prev.findIndex(
        (p) => String(p.menu_item_id) === String(item.id),
      )

      if (existingIndex >= 0) {
        return prev.map((p, i) =>
          i === existingIndex
            ? {
                ...p,
                quantity: Number(p.quantity || 0) + 1,
                subtotal:
                  (Number(p.quantity || 0) + 1) *
                  Number(p.unit_price || item.price || 0),
              }
            : p,
        )
      }

      return [
        ...prev,
        {
          id: `new-${item.id}-${Date.now()}`,
          menu_item_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: Number(item.price || 0),
          subtotal: Number(item.price || 0),
          image_url: item.image_url || '',
          special_instructions: '',
        },
      ]
    })

    setSelectedMenuItemId('')
    toast.success('Item added to bill')
  }

 const escapeHtml = (value: any) => {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const handlePrintReceipt = () => {
  if (!selectedOrder) {
    toast.error('Please select a table first')
    return
  }

  const receiptWindow = window.open('', '_blank', 'width=420,height=700')

  if (!receiptWindow) {
    toast.error('Please allow popups to print receipt')
    return
  }

  const itemsHtml = editableItems
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong><br/>
            <small>${formatCurrency(Number(item.unit_price || 0))} x ${Number(
              item.quantity || 0,
            )}</small>
          </td>
          <td style="text-align:center;">${Number(item.quantity || 0)}</td>
          <td style="text-align:right;">
            ${formatCurrency(
              Number(item.quantity || 0) * Number(item.unit_price || 0),
            )}
          </td>
        </tr>
      `,
    )
    .join('')

  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${escapeHtml(selectedOrder.order_number)}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            padding: 16px;
            color: #111;
            width: 360px;
            margin: 0 auto;
          }

          .center {
            text-align: center;
          }

          .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .muted {
            color: #555;
            font-size: 12px;
          }

          .line {
            border-top: 1px dashed #999;
            margin: 12px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            font-size: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
          }

          td {
            font-size: 13px;
            padding: 7px 0;
            vertical-align: top;
          }

          .row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin: 5px 0;
          }

          .total {
            font-size: 16px;
            font-weight: bold;
          }

          .footer {
            margin-top: 16px;
            text-align: center;
            font-size: 12px;
          }

          @media print {
            body {
              width: 100%;
              margin: 0;
            }

            button {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="center">
          <div class="title">Receipt</div>
          <div class="muted">Order #${escapeHtml(selectedOrder.order_number)}</div>
          <div class="muted">Table ${escapeHtml(
            selectedOrder.table_number || 'N/A',
          )}</div>
          <div class="muted">${new Date().toLocaleString()}</div>
        </div>

        <div class="line"></div>

        <div class="row">
          <span>Customer</span>
          <strong>${escapeHtml(customerName || 'Walk-in Customer')}</strong>
        </div>

        ${
          customerPhone
            ? `
              <div class="row">
                <span>Phone</span>
                <strong>${escapeHtml(customerPhone)}</strong>
              </div>
            `
            : ''
        }

        <div class="line"></div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="line"></div>

        <div class="row">
          <span>Subtotal</span>
          <strong>${formatCurrency(subtotal)}</strong>
        </div>

        <div class="row">
          <span>Discount</span>
          <strong>- ${formatCurrency(discountAmount)}</strong>
        </div>

        <div class="row">
          <span>Tax</span>
          <strong>${formatCurrency(taxAmount)}</strong>
        </div>

        <div class="row">
          <span>Service Charge</span>
          <strong>${formatCurrency(serviceCharge)}</strong>
        </div>

        <div class="line"></div>

        <div class="row total">
          <span>Grand Total</span>
          <span>${formatCurrency(grandTotal)}</span>
        </div>

        <div class="row">
          <span>Already Paid</span>
          <strong>${formatCurrency(alreadyPaidAmount)}</strong>
        </div>

        <div class="row">
          <span>Current Payment</span>
          <strong>${formatCurrency(Number(paidAmount || 0))}</strong>
        </div>

        <div class="row">
          <span>Due Amount</span>
          <strong>${formatCurrency(dueAfterCurrentPayment)}</strong>
        </div>

        ${
          paymentMethod
            ? `
              <div class="row">
                <span>Payment Method</span>
                <strong>${escapeHtml(paymentMethod)}</strong>
              </div>
            `
            : ''
        }

        <div class="line"></div>

        <div class="footer">
          Thank you for your visit!
        </div>

        <script>
          window.onload = function () {
            window.print();
            setTimeout(function () {
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `)

  receiptWindow.document.close()
}

  const handleCompletePayment = async () => {
    if (!selectedOrder) {
      toast.error('Please select a table first')
      return
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    const paymentAmount = Number(paidAmount || 0)

    if (paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    if (paymentAmount > dueAmount) {
      toast.error(`Payment cannot be more than due amount ${formatCurrency(dueAmount)}`)
      return
    }

    try {
      const result = await dispatch(
        updatePaymentStatus({
          hotelSlug,
          orderId: selectedOrder.id,
          paymentData: {
            amount: paymentAmount,
            payment_method: paymentMethod,
            payment_status: 'success',
          },
        }),
      ).unwrap()

      toast.success(
        result?.summary?.payment_status === 'paid'
          ? 'Payment completed successfully'
          : 'Partial payment added successfully',
      )

      setPaidAmount(0)
      dispatch(fetchOrders(hotelSlug))
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process payment')
    }
  }

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${Number(amount || 0).toFixed(2)}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'served':
        return 'bg-green-100 text-green-700'
      case 'ready':
        return 'bg-amber-100 text-amber-700'
      case 'preparing':
        return 'bg-blue-100 text-blue-700'
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-700'
      case 'pending':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Billing & Checkout</h1>
            <p className="text-emerald-100 mt-1">
              Select a table, review order, edit items, and complete payment
            </p>
          </div>

          <button
            onClick={() => {
              dispatch(fetchOrders(hotelSlug))
              dispatch(fetchMenuItems(hotelSlug))
              if (selectedOrder?.hotel_id) {
                dispatch(fetchPaymentMethods(selectedOrder.hotel_id))
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Table2 className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-gray-900">Active Tables</h2>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search table / customer / order..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3">
            {filteredTables.length > 0 ? (
              filteredTables.map((order: any) => {
                const isActive = String(selectedOrder?.id) === String(order.id)

                return (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelectedTableId(String(order.table_id || order.id))
                      loadOrder(order)
                    }}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Table {order.table_number || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.customer_name || 'Walk-in Customer'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {order.order_number}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Payment: {order.payment_status || 'pending'}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(order.total_amount || order.amount || 0)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        Paid: {formatCurrency(order.paid_amount || 0)}
                      </span>
                      <span className="text-amber-600">
                        Due:{' '}
                        {formatCurrency(
                          Math.max(
                            Number(order.total_amount || order.amount || 0) -
                              Number(order.paid_amount || 0),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="py-12 text-center">
                <Table2 className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600">No active table orders found</p>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-8 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {!selectedOrder ? (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
              <Receipt className="h-14 w-14 text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Select a table
              </h3>
              <p className="text-gray-500 mt-1">
                Click a table from the left side to load billing details
              </p>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Table {selectedOrder.table_number || 'N/A'} Billing
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Order #{selectedOrder.order_number}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedOrder.status}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-gray-500">Payment</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedOrder.payment_status || 'pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Customer Name
                    </label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Walk-in Customer"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Customer Phone
                    </label>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="98xxxxxxxx"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingCart className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">Add Items</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <select
                      value={selectedMenuItemId}
                      onChange={(e) => setSelectedMenuItemId(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select menu item</option>
                      {menuItems.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {formatCurrency(item.price || 0)}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={addMenuItemToBill}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Bill Items</h3>
                  </div>

                  {editableItems.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {editableItems.map((item, index) => (
                        <div
                          key={`${item.menu_item_id}-${index}`}
                          className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Receipt className="h-6 w-6 text-gray-400" />
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900">
                                {item.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(item.unit_price)} each
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden">
                              <button
                                onClick={() => changeQty(index, 'dec')}
                                className="px-3 py-2 hover:bg-gray-50"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-4 py-2 min-w-[48px] text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => changeQty(index, 'inc')}
                                className="px-3 py-2 hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="min-w-[110px] text-right">
                              <p className="text-sm text-gray-500">Subtotal</p>
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(item.quantity * item.unit_price)}
                              </p>
                            </div>

                            <button
                              onClick={() => removeItem(index)}
                              className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <ShoppingCart className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-600">No items in this bill</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Discount
                    </label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Tax
                    </label>
                    <input
                      type="number"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(Number(e.target.value))}
                      className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Service Charge
                    </label>
                    <input
                      type="number"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(Number(e.target.value))}
                      className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">Payment</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Payment Method
                      </label>

                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {paymentMethods?.filter((m: any) => m.is_enabled)
                          ?.length > 0 ? (
                          paymentMethods
                            .filter((method: any) => method.is_enabled)
                            .map((method: any) => (
                              <button
                                key={method.id}
                                onClick={() =>
                                  setPaymentMethod(method.method_name)
                                }
                                className={`rounded-2xl border p-4 text-center ${
                                  paymentMethod === method.method_name
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <CreditCard className="h-5 w-5 mx-auto mb-2 text-emerald-600" />
                                <span className="text-sm font-medium text-gray-900">
                                  {method.method_name}
                                </span>
                              </button>
                            ))
                        ) : (
                          <div className="col-span-full text-sm text-red-500">
                            No payment methods found. Add payment methods from
                            Settings.
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Current Payment Amount
                      </label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />

                      <div className="mt-4 rounded-2xl bg-gray-50 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discount</span>
                          <span className="font-medium text-red-600">
                            - {formatCurrency(discountAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(taxAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service Charge</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(serviceCharge)}
                          </span>
                        </div>

                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-semibold text-gray-900">
                            Grand Total
                          </span>
                          <span className="font-bold text-lg text-gray-900">
                            {formatCurrency(grandTotal)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">
                            Already Paid
                          </span>
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(alreadyPaidAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">
                            Due Amount
                          </span>
                          <span
                            className={`font-bold ${
                              dueAmount > 0
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {formatCurrency(dueAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">
                            Due After This Payment
                          </span>
                          <span
                            className={`font-bold ${
                              dueAfterCurrentPayment > 0
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {formatCurrency(dueAfterCurrentPayment)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={handlePrintReceipt}
                    className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium inline-flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Receipt
                  </button>

                  <button
                    onClick={handleCompletePayment}
                    disabled={dueAmount <= 0}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Add Payment
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-lg text-sm text-gray-700">
          Loading...
        </div>
      )}
    </div>
  )
}