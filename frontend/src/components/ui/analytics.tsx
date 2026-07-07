// components/dashboard/AnalyticsPage.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  XCircle,
  Users,
  Coffee,
  Award,
  CreditCard,
  Wallet,
  ReceiptText,
  AlertCircle,
  ChartNoAxesCombined,
} from 'lucide-react'

import { hotelApi } from '@/services/hotelApi'
import StatCard from './StatCard'
import LoadingSpinner from './LoadingSpinner'

type RevenueChartItem = {
  label: string
  revenue: number | string
  paid_revenue?: number | string
  orders?: number | string
}

type OrderStatusItem = {
  status: string
  value: number | string
}

type PaymentStatusItem = {
  status: string
  orders: number | string
  total_amount: number | string
  paid_amount: number | string
}

type PaymentMethodItem = {
  payment_method: string
  total_orders: number | string
  valid_orders: number | string
  cancelled_orders: number | string
  paid_orders: number | string
  partial_orders: number | string
  pending_orders: number | string
  refunded_orders: number | string
  total_amount: number | string
  paid_amount: number | string
  due_amount: number | string
  method_status: string
}

type GatewayPaymentItem = {
  payment_method: string
  provider: string
  status: string
  transactions: number | string
  amount: number | string
  tax_amount: number | string
  total_amount: number | string
  gateway_status: string
}

type SubscriptionInvoiceItem = {
  status: string
  payment_method: string | null
  invoices: number | string
  total_amount: number | string
  amount: number | string
  tax_amount: number | string
}

type StaffItem = {
  id?: string
  name: string
  role?: string
  staff_code?: string
  orders: number | string
  completed_orders?: number | string
  cancelled_orders?: number | string
  revenue?: number | string
  collected_amount?: number | string
}

type TopItem = {
  item_name: string
  quantity_sold: number | string
  revenue: number | string
}

type AnalyticsData = {
  success?: boolean
  range?: string

  totalRevenue: number | string
  paidRevenue?: number | string
  dueAmount?: number | string

  totalOrders: number | string
  activeOrders?: number | string
  completed?: number | string
  cancelled: number | string

  paidOrders?: number | string
  partialOrders?: number | string
  unpaidOrders?: number | string
  refundedOrders?: number | string

  profit: number | string
  estimatedCost?: number | string

  revenueChart: RevenueChartItem[]
  orderStatus: OrderStatusItem[]
  paymentStatus?: PaymentStatusItem[]

  ordersByPaymentMethod?: PaymentMethodItem[]
  gatewayPayments?: GatewayPaymentItem[]
  subscriptionInvoices?: SubscriptionInvoiceItem[]

  staff: StaffItem[]
  topItems?: TopItem[]
}

interface AnalyticsPageProps {
  currencySymbol?: string
}

const COLORS = [
  '#3B82F6',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#F97316',
  '#14B8A6',
]

const toNumber = (value: unknown) => {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const formatCount = (value: unknown) => {
  return toNumber(value).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })
}

const formatMoney = (value: unknown, currencySymbol = 'Rs') => {
  return `${currencySymbol} ${toNumber(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

const prettyText = (value?: string | null) => {
  if (!value) return 'Unknown'
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const periodLabel = (filter: string) => {
  if (filter === 'today') return 'Today'
  return filter.charAt(0).toUpperCase() + filter.slice(1)
}

const isMoneyKey = (key: unknown) => {
  const text = String(key || '').toLowerCase()
  return (
    text.includes('amount') ||
    text.includes('revenue') ||
    text.includes('profit') ||
    text.includes('paid') ||
    text.includes('due')
  )
}

const CustomTooltip = ({ active, payload, label, currencySymbol }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-lg">
      {label && (
        <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
      )}

      {payload.map((item: any, index: number) => (
        <p key={index} className="text-gray-900 font-semibold text-sm">
          {item.name || item.dataKey}:{' '}
          {isMoneyKey(item.dataKey)
            ? formatMoney(item.value, currencySymbol)
            : formatCount(item.value)}
        </p>
      ))}
    </div>
  )
}

const ChartCard = ({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
      </div>

      {children}
    </div>
  )
}

export default function AnalyticsPage({ currencySymbol = 'Rs' }: AnalyticsPageProps) {
  const [filter, setFilter] = useState('today')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLocalError('')

        const res = await hotelApi.get<AnalyticsData>(
          `/api/hotel/data/analytics?range=${filter}`
        )

        setData(res.data)
      } catch (err) {
        console.error('Analytics fetch error:', err)
        setLocalError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filter])

  const normalizedRevenueChart = useMemo(() => {
    return (data?.revenueChart || []).map((item) => ({
      ...item,
      revenue: toNumber(item.revenue),
      paid_revenue: toNumber(item.paid_revenue),
      orders: toNumber(item.orders),
    }))
  }, [data])

  const normalizedOrderStatus = useMemo(() => {
    return (data?.orderStatus || []).map((item) => ({
      ...item,
      status: prettyText(item.status),
      value: toNumber(item.value),
    }))
  }, [data])

  const normalizedPaymentStatus = useMemo(() => {
    return (data?.paymentStatus || []).map((item) => ({
      ...item,
      status: prettyText(item.status),
      orders: toNumber(item.orders),
      total_amount: toNumber(item.total_amount),
      paid_amount: toNumber(item.paid_amount),
    }))
  }, [data])

  const normalizedPaymentMethods = useMemo(() => {
    return (data?.ordersByPaymentMethod || []).map((item) => ({
      ...item,
      payment_method: prettyText(item.payment_method),
      total_orders: toNumber(item.total_orders),
      valid_orders: toNumber(item.valid_orders),
      cancelled_orders: toNumber(item.cancelled_orders),
      paid_orders: toNumber(item.paid_orders),
      partial_orders: toNumber(item.partial_orders),
      pending_orders: toNumber(item.pending_orders),
      refunded_orders: toNumber(item.refunded_orders),
      total_amount: toNumber(item.total_amount),
      paid_amount: toNumber(item.paid_amount),
      due_amount: toNumber(item.due_amount),
      method_status: prettyText(item.method_status),
    }))
  }, [data])

  const normalizedStaff = useMemo(() => {
    return (data?.staff || []).map((item) => ({
      ...item,
      orders: toNumber(item.orders),
      completed_orders: toNumber(item.completed_orders),
      cancelled_orders: toNumber(item.cancelled_orders),
      revenue: toNumber(item.revenue),
      collected_amount: toNumber(item.collected_amount),
    }))
  }, [data])

  const normalizedTopItems = useMemo(() => {
    return (data?.topItems || []).map((item) => ({
      ...item,
      quantity_sold: toNumber(item.quantity_sold),
      revenue: toNumber(item.revenue),
    }))
  }, [data])

  const kpiCards = useMemo(() => {
    if (!data) return []

    return [
      {
        label: 'Revenue',
        value: formatMoney(data.totalRevenue, currencySymbol),
        change: 'Total sales',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        trend: 'up' as const,
      },
      {
        label: 'Paid Revenue',
        value: formatMoney(data.paidRevenue, currencySymbol),
        change: 'Collected',
        icon: <Wallet className="h-5 w-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        trend: 'up' as const,
      },
      {
        label: 'Due Amount',
        value: formatMoney(data.dueAmount, currencySymbol),
        change: 'Unpaid',
        icon: <ReceiptText className="h-5 w-5" />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        trend: 'down' as const,
      },
      {
        label: 'Profit',
        value: formatMoney(data.profit, currencySymbol),
        change: 'Estimated',
        icon: <DollarSign className="h-5 w-5" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        trend: 'up' as const,
      },
      {
        label: 'Total Orders',
        value: formatCount(data.totalOrders),
        change: `${formatCount(data.completed)} completed`,
        icon: <ShoppingBag className="h-5 w-5" />,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        trend: 'up' as const,
      },
      {
        label: 'Paid Orders',
        value: formatCount(data.paidOrders),
        change: `${formatCount(data.partialOrders)} partial`,
        icon: <CreditCard className="h-5 w-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        trend: 'up' as const,
      },
      {
        label: 'Unpaid Orders',
        value: formatCount(data.unpaidOrders),
        change: 'Pending payment',
        icon: <AlertCircle className="h-5 w-5" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        trend: 'down' as const,
      },
      {
        label: 'Cancelled',
        value: formatCount(data.cancelled),
        change: 'Cancelled orders',
        icon: <XCircle className="h-5 w-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        trend: 'down' as const,
      },
    ]
  }, [data, currencySymbol])

  if (loading) {
    return <LoadingSpinner />
  }

  if (localError || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">
          {localError || 'No analytics data available'}
        </h3>
        <p className="text-gray-600 mt-2">
          Start making sales to see analytics.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2 flex items-center gap-2">
              <ChartNoAxesCombined className="h-6 w-6" />
              Analytics Dashboard
            </h1>
            <p className="text-blue-100">
              Revenue, orders, payments, staff and item performance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 bg-white/10 rounded-lg p-1">
            {['today', 'week', 'month', 'year'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((stat, index) => (
          <StatCard
            key={index}
            {...stat}
            periodLabel={periodLabel(filter)}
          />
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Revenue Trend"
          subtitle={`Range: ${periodLabel(filter)}`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={normalizedRevenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Total Revenue"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="paid_revenue"
                name="Paid Revenue"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Order Status Distribution"
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={normalizedOrderStatus}
                dataKey="value"
                nameKey="status"
                outerRadius={105}
                innerRadius={55}
                paddingAngle={4}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {normalizedOrderStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Payment Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Orders Through Payment Method"
          icon={<CreditCard className="w-5 h-5 text-cyan-600" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={normalizedPaymentMethods}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="payment_method" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
              <Legend />
              <Bar dataKey="paid_amount" name="Paid Amount" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="due_amount" name="Due Amount" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Payment Status"
          icon={<Wallet className="w-5 h-5 text-green-600" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={normalizedPaymentStatus}
                dataKey="orders"
                nameKey="status"
                outerRadius={105}
                innerRadius={55}
                paddingAngle={4}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {normalizedPaymentStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Payment Method Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <ReceiptText className="w-5 h-5 text-purple-600" />
          Payment Method Details
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-3 pr-4 font-semibold">Method</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Orders</th>
                <th className="py-3 pr-4 font-semibold">Paid</th>
                <th className="py-3 pr-4 font-semibold">Due</th>
                <th className="py-3 pr-4 font-semibold">Cancelled</th>
              </tr>
            </thead>

            <tbody>
              {normalizedPaymentMethods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No payment method data found.
                  </td>
                </tr>
              ) : (
                normalizedPaymentMethods.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 text-gray-800">
                    <td className="py-4 pr-4 font-medium">{item.payment_method}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.method_status === 'Working'
                            ? 'bg-green-50 text-green-700'
                            : item.method_status === 'Used But Unpaid'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.method_status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">{formatCount(item.total_orders)}</td>
                    <td className="py-4 pr-4 text-emerald-600 font-medium">
                      {formatMoney(item.paid_amount, currencySymbol)}
                    </td>
                    <td className="py-4 pr-4 text-amber-600 font-medium">
                      {formatMoney(item.due_amount, currencySymbol)}
                    </td>
                    <td className="py-4 pr-4 text-red-600 font-medium">
                      {formatCount(item.cancelled_orders)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff + Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Staff Performance"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          subtitle="Top performer"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={normalizedStaff}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
              <Legend />
              <Bar dataKey="orders" name="Orders" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              <Bar
                dataKey="collected_amount"
                name="Collected Amount"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top Selling Items"
          icon={<Coffee className="w-5 h-5 text-orange-600" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={normalizedTopItems}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="item_name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
              <Legend />
              <Bar
                dataKey="quantity_sold"
                name="Quantity Sold"
                fill="#F97316"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>


    </div>
  )
}