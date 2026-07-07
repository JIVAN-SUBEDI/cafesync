'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hotel } from '@/store/slices/hotelAuthSlice'
import { api } from '@/services/api'
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Loader2,
  Eye,
} from 'lucide-react'

interface BillingViewProps {
  hotel: Hotel
}

type Plan = {
  id: string
  plan_name: string
  plan_code: string
  price_per_month: string
  price_per_year: string
  max_staff: number
  max_tables: number
  max_menu_items: number
  features: Record<string, boolean>
}

type Invoice = {
  id: string
  invoice_number: string
  amount: string
  total_amount?: string
  payment_method: string
  payment_status: string
  status?: string
  created_at: string
}
type ToastState = {
  type: 'success' | 'error' | 'info'
  message: string
}

type ChangeType = 'current' | 'upgrade' | 'downgrade' | 'billing_cycle_change' | 'new_subscription'

const DOWNGRADE_ALLOWED_DAYS = 7

export default function BillingView({ hotel }: BillingViewProps) {
  const [activeTab, setActiveTab] = useState<'subscription' | 'invoices'>('subscription')
  const [plans, setPlans] = useState<Plan[]>([])
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    hotel.billing_cycle === 'monthly' ? 'monthly' : 'yearly'
  )
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'khalti'>('esewa')
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const currentPlanId = hotel.subscription_plan_id ? String(hotel.subscription_plan_id) : ''

  const currentPlan = useMemo(() => {
    return plans.find((plan) => String(plan.id) === currentPlanId) || null
  }, [plans, currentPlanId])

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => String(plan.id) === selectedPlanId) || null
  }, [plans, selectedPlanId])

  const subscriptionEndDate =
    hotel.subscription_status === 'trial'
      ? hotel.trial_ends_at
      : hotel.subscription_end_date

  const remainingDays = useMemo(() => {
    return getRemainingDays(subscriptionEndDate)
  }, [subscriptionEndDate])

  const canDowngrade = remainingDays !== null && remainingDays <= DOWNGRADE_ALLOWED_DAYS
const submitEsewaForm = (
  paymentUrl: string,
  formFields: Record<string, string | number>
) => {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = paymentUrl

  Object.entries(formFields).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = String(value)
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
}
  const selectedChangeType = useMemo<ChangeType>(() => {
    if (!selectedPlan) return 'current'

    if (!currentPlan) return 'new_subscription'

    const selectedIsCurrent = String(selectedPlan.id) === currentPlanId
    const cycleChanged = billingCycle !== hotel.billing_cycle

    if (selectedIsCurrent && cycleChanged) return 'billing_cycle_change'
    if (selectedIsCurrent) return 'current'

    const selectedScore = getPlanScore(selectedPlan)
    const currentScore = getPlanScore(currentPlan)

    if (selectedScore < currentScore) return 'downgrade'
    if (selectedScore > currentScore) return 'upgrade'

    return 'upgrade'
  }, [selectedPlan, currentPlan, currentPlanId, billingCycle, hotel.billing_cycle])

  const isDowngradeBlocked =
    selectedChangeType === 'downgrade' && !canDowngrade

  const canContinuePayment =
    Boolean(selectedPlan) &&
    selectedChangeType !== 'current' &&
    !isDowngradeBlocked

  const selectedPlanPrice = selectedPlan
    ? getPlanPrice(selectedPlan, billingCycle)
    : 0

  const tabs = [
    {
      id: 'subscription' as const,
      label: 'Subscription',
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      id: 'invoices' as const,
      label: 'Invoices',
      icon: <Download className="h-4 w-4" />,
    },
  ]

  useEffect(() => {
    fetchPlans()
    fetchInvoices()
  }, [])
  const openInvoicePage = (invoiceId: string) => {
    router.push(
      `/hotel/${hotel.hotel_slug}/subscription?invoice_id=${encodeURIComponent(invoiceId)}`
    )
  }
  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type })

    window.setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true)
      const { data } = await api.get('api/auth/subscriptions', {
        withCredentials: true,
      })
      setPlans(data.data?.plans || data.plans || [])
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || 'Failed to load subscription plans',
        'error'
      )
      setPlans([])
    } finally {
      setLoadingPlans(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/api/hotel/subscription/invoices', {
        withCredentials: true,
      })
      setInvoices(data.data?.invoices || data.invoices || [])
    } catch {
      setInvoices([])
    }
  }

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800'
      case 'trial':
        return 'bg-amber-100 text-amber-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSubscriptionIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5" />
      case 'trial':
        return <Clock className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlanId(String(plan.id))

    if (!currentPlan) return

    const selectedScore = getPlanScore(plan)
    const currentScore = getPlanScore(currentPlan)
    const isSelectedCurrent = String(plan.id) === currentPlanId

    if (isSelectedCurrent) return

    if (selectedScore < currentScore && !canDowngrade) {
      showToast(
        `Downgrade is allowed only when ${DOWNGRADE_ALLOWED_DAYS} days or fewer are remaining in your current plan.`,
        'error'
      )
    }
  }

const handleUpgrade = async () => {
  if (!selectedPlanId || !selectedPlan) return

  if (selectedChangeType === 'current') {
    showToast('This is already your current plan.', 'info')
    return
  }

  if (isDowngradeBlocked) {
    showToast(
      `You can downgrade only when ${DOWNGRADE_ALLOWED_DAYS} days or fewer are remaining in your current plan.`,
      'error'
    )
    return
  }

  try {
    setUpgrading(true)

    const { data } = await api.post(
      '/api/hotel/subscription/upgrade',
      {
        plan_id: selectedPlanId,
        billing_cycle: billingCycle,
        payment_method: paymentMethod,
        change_type: selectedChangeType,
      },
      { withCredentials: true }
    )

    const payload = data.data || data

    const paymentUrl = payload.payment_url
    const formFields = payload.form_fields

    // eSewa needs POST form submit, not GET redirect
    if (paymentMethod === 'esewa') {
      if (!paymentUrl || !formFields) {
        showToast('eSewa payment form data missing', 'error')
        return
      }

      submitEsewaForm(paymentUrl, formFields)
      return
    }

    // Khalti uses normal redirect
    if (paymentMethod === 'khalti') {
      if (!paymentUrl) {
        showToast('Khalti payment URL missing', 'error')
        return
      }

      window.location.href = paymentUrl
      return
    }

    showToast('Payment created successfully', 'success')
  } catch (error: any) {
    showToast(
      error?.response?.data?.message || 'Failed to start payment',
      'error'
    )
  } finally {
    setUpgrading(false)
  }
}
  const getActionLabel = () => {
    switch (selectedChangeType) {
      case 'upgrade':
        return 'Continue to Upgrade Payment'
      case 'downgrade':
        return 'Continue to Downgrade Payment'
      case 'billing_cycle_change':
        return 'Continue to Billing Cycle Payment'
      case 'new_subscription':
        return 'Continue to Payment'
      default:
        return 'Continue to Payment'
    }
  }

  const getSelectedChangeMessage = () => {
    if (!selectedPlan) return null

    if (selectedChangeType === 'current') {
      return {
        title: 'Current plan selected',
        message: 'Select another plan or change the billing cycle to continue.',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      }
    }

    if (isDowngradeBlocked) {
      return {
        title: 'Downgrade locked',
        message:
          remainingDays === null
            ? `Downgrade is allowed only in the last ${DOWNGRADE_ALLOWED_DAYS} days of your current plan.`
            : `You still have ${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining. Downgrade unlocks when ${DOWNGRADE_ALLOWED_DAYS} days or fewer are left.`,
        className: 'border-red-200 bg-red-50 text-red-800',
      }
    }

    if (selectedChangeType === 'downgrade') {
      return {
        title: 'Downgrade available',
        message: `Your current plan has ${remainingDays ?? 0} day${remainingDays === 1 ? '' : 's'} remaining, so downgrade is allowed.`,
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      }
    }

    if (selectedChangeType === 'billing_cycle_change') {
      return {
        title: 'Billing cycle change',
        message: `You are changing your billing cycle to ${billingCycle}.`,
        className: 'border-blue-200 bg-blue-50 text-blue-800',
      }
    }

    return {
      title: 'Upgrade available',
      message: 'Upgrade can be done anytime.',
      className: 'border-blue-200 bg-blue-50 text-blue-800',
    }
  }

  const selectedChangeMessage = getSelectedChangeMessage()

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg border px-4 py-3 shadow-lg ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <h1 className="text-xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-blue-100">Manage your subscription and invoices</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
            <p className="text-sm text-gray-600">
              {hotel.plan_name || 'Trial Plan'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getSubscriptionColor(hotel.subscription_status)}`}>
              {getSubscriptionIcon(hotel.subscription_status)}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionColor(hotel.subscription_status)}`}>
              {hotel.subscription_status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Plan</p>
            <p className="text-xl font-bold text-gray-900">
              {hotel.plan_name || 'Trial Plan'}
            </p>
          </div>



          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              {hotel.subscription_status === 'trial' ? 'Trial Ends' : 'Ends At'}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {hotel.subscription_status === 'trial'
                ? hotel.trial_ends_at
                  ? new Date(hotel.trial_ends_at).toLocaleDateString()
                  : '-'
                : hotel.subscription_end_date
                  ? new Date(hotel.subscription_end_date).toLocaleDateString()
                  : '-'}
            </p>
            {remainingDays !== null && (
              <p className="text-xs text-gray-500 mt-1">
                {remainingDays <= 0
                  ? 'Expired or ending today'
                  : `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Choose Subscription Plan
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Upgrade anytime. Downgrade is available only in the last {DOWNGRADE_ALLOWED_DAYS} days of your current plan.
                  </p>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      billingCycle === 'monthly'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      billingCycle === 'yearly'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              {loadingPlans ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const isCurrent = String(plan.id) === currentPlanId
                    const isSelected = String(plan.id) === selectedPlanId
                    const price =
                      billingCycle === 'yearly'
                        ? plan.price_per_year
                        : plan.price_per_month

                    const planIsDowngrade =
                      Boolean(currentPlan) &&
                      !isCurrent &&
                      getPlanScore(plan) < getPlanScore(currentPlan)

                    const planDowngradeBlocked = planIsDowngrade && !canDowngrade

                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleSelectPlan(plan)}
                        className={`
                          cursor-pointer border rounded-xl p-6 transition-all hover:shadow-lg
                          ${
                            isSelected
                              ? planDowngradeBlocked
                                ? 'border-red-500 bg-red-50 ring-2 ring-red-100'
                                : 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                              : isCurrent
                                ? 'border-emerald-500 bg-emerald-50'
                                : planDowngradeBlocked
                                  ? 'border-gray-200 bg-gray-50'
                                  : 'border-gray-200'
                          }
                        `}
                      >
                        <div className="mb-4">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-lg font-bold text-gray-900">
                              {plan.plan_name}
                            </h4>

                            {isCurrent ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                Current
                              </span>
                            ) : planDowngradeBlocked ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                Locked
                              </span>
                            ) : planIsDowngrade ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                                Downgrade
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                Upgrade
                              </span>
                            )}
                          </div>

                          <p className="text-2xl font-bold text-gray-900 mt-2">
                            NPR {formatMoney(parseAmount(price))}
                            <span className="text-sm font-normal text-gray-500">
                              /{billingCycle === 'yearly' ? 'year' : 'month'}
                            </span>
                          </p>

                          {planDowngradeBlocked && (
                            <p className="text-xs text-red-600 mt-2">
                              Downgrade unlocks in the last {DOWNGRADE_ALLOWED_DAYS} days.
                            </p>
                          )}
                        </div>

                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            {plan.max_tables} tables
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            {plan.max_staff} staff members
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            {plan.max_menu_items} menu items
                          </li>

                          {Object.entries(plan.features || {})
                            .filter(([, enabled]) => enabled)
                            .slice(0, 5)
                            .map(([feature]) => (
                              <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 capitalize">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                {feature.replaceAll('_', ' ')}
                              </li>
                            ))}
                        </ul>

                        <button
                          type="button"
                          className={`
                            w-full py-2 rounded-lg font-medium transition-colors
                            ${
                              isCurrent
                                ? 'bg-emerald-600 text-white'
                                : isSelected
                                  ? planDowngradeBlocked
                                    ? 'bg-red-600 text-white'
                                    : 'bg-blue-600 text-white'
                                  : planDowngradeBlocked
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-gray-100 text-gray-800'
                            }
                          `}
                        >
                          {isCurrent
                            ? 'Current Plan'
                            : isSelected
                              ? planDowngradeBlocked
                                ? 'Downgrade Locked'
                                : 'Selected'
                              : planDowngradeBlocked
                                ? 'Locked'
                                : 'Select Plan'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedPlan && (
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Choose Payment Method
                      </h4>

                      {selectedChangeMessage && (
                        <div className={`mb-4 rounded-lg border p-4 ${selectedChangeMessage.className}`}>
                          <p className="text-sm font-semibold">
                            {selectedChangeMessage.title}
                          </p>
                          <p className="text-sm mt-1">
                            {selectedChangeMessage.message}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => setPaymentMethod('esewa')}
                          className={`p-4 rounded-lg border text-left ${
                            paymentMethod === 'esewa'
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <p className="font-semibold text-gray-900">eSewa</p>
                          <p className="text-sm text-gray-500">Pay using eSewa wallet</p>
                        </button>

                        <button
                          onClick={() => setPaymentMethod('khalti')}
                          className={`p-4 rounded-lg border text-left ${
                            paymentMethod === 'khalti'
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <p className="font-semibold text-gray-900">Khalti</p>
                          <p className="text-sm text-gray-500">Pay using Khalti wallet</p>
                        </button>
                      </div>
                    </div>

                    <div className="w-full lg:w-80 border border-gray-200 rounded-xl p-5 bg-gray-50">
                      <h5 className="text-sm font-semibold text-gray-900 mb-4">
                        Payment Summary
                      </h5>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-600">Selected Plan</span>
                          <span className="font-medium text-gray-900 text-right">
                            {selectedPlan.plan_name}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-600">Billing Cycle</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {billingCycle}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-600">Payment Method</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {paymentMethod}
                          </span>
                        </div>

                        <div className="border-t border-gray-200 pt-3 flex items-center justify-between gap-4">
                          <span className="text-gray-900 font-semibold">Total</span>
                          <span className="text-xl font-bold text-gray-900">
                            NPR {formatMoney(selectedPlanPrice)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleUpgrade}
                        disabled={upgrading || !canContinuePayment}
                        className="mt-5 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {upgrading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {getActionLabel()}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Invoice History</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr className="text-left text-sm text-gray-600 border-b border-gray-100">
                    <th className="p-4 font-medium">Invoice #</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Method</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                  </thead>

                  <tbody>
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-500">
                          No invoices found
                        </td>
                      </tr>
                    )}

      {invoices.map((invoice) => (
  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
    <td className="p-4 font-medium text-gray-900">
      {invoice.invoice_number}
    </td>

    <td className="p-4 text-gray-900">
      {new Date(invoice.created_at).toLocaleDateString()}
    </td>

    <td className="p-4 font-semibold text-gray-900">
      NPR {formatMoney(parseAmount(invoice.total_amount || invoice.amount))}
    </td>

    <td className="p-4 capitalize">
      {invoice.payment_method || '-'}
    </td>

    <td className="p-4">
      <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium capitalize">
        {invoice.payment_status || invoice.status || 'pending'}
      </span>
    </td>

    <td className="p-4 text-right">
      <button
        type="button"
        onClick={() => openInvoicePage(invoice.id)}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
      >
        <Eye className="h-4 w-4" />
        View Invoice
      </button>
    </td>
  </tr>
))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function parseAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0

  const amount = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

function formatMoney(value: string | number | null | undefined) {
  const amount = parseAmount(value)

  return new Intl.NumberFormat('en-NP', {
    maximumFractionDigits: 2,
  }).format(amount)
}

function getPlanPrice(plan: Plan, billingCycle: 'monthly' | 'yearly') {
  return billingCycle === 'yearly'
    ? parseAmount(plan.price_per_year)
    : parseAmount(plan.price_per_month)
}

function getPlanScore(plan: Plan) {
  return (
    parseAmount(plan.max_staff) * 1000000 +
    parseAmount(plan.max_tables) * 10000 +
    parseAmount(plan.max_menu_items) * 10 +
    parseAmount(plan.price_per_month)
  )
}

function getRemainingDays(dateValue?: string | null) {
  if (!dateValue) return null

  const endDate = new Date(dateValue)

  if (Number.isNaN(endDate.getTime())) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)

  const diff = endDate.getTime() - today.getTime()

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
