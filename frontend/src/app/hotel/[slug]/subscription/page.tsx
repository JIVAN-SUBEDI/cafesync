'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/services/api'
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

type InvoiceDetails = {
  id: string
  hotel_id: string
  subscription_plan_id: string | null
  payment_id: string | null
  invoice_number: string
  billing_cycle: string
  amount: string | number
  tax_amount: string | number
  total_amount: string | number
  billing_period_start: string | null
  billing_period_end: string | null
  due_date: string | null
  status: string
  payment_status: string
  paid_at: string | null
  payment_method: string | null
  transaction_id: string | null
  created_at: string

  plan_name: string | null
  plan_code: string | null
  max_staff: number | null
  max_tables: number | null
  max_menu_items: number | null

  hotel_name: string
  hotel_slug: string
  hotel_phone: string | null
  hotel_address: string | null
  city: string | null
  country: string | null
  currency: string | null
  timezone: string | null
  tax_rate: string | number | null
  service_charge: string | number | null

  admin_user_id: string | null
  admin_name: string | null
  admin_email: string | null
  admin_phone: string | null
  admin_profile_image: string | null
}

export default function SubscriptionInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const SearchParams = useSearchParams()
  const invoiceRef = useRef<HTMLDivElement | null>(null)

  const invoiceId = SearchParams.get('invoice_id')

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError('')
        console.log(invoiceId)
      const { data } = await api.get(
        `/api/hotel/subscription/invoices/${invoiceId}`,
        { withCredentials: true }
      )

      setInvoice(data.data?.invoice || data.invoice)
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

const handleDownloadPdf = async () => {
  if (!invoiceRef.current || !invoice) return

  try {
    setDownloading(true)

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',

      // FIX: html2canvas cannot parse lab()/oklch() colors.
      // This forces cloned invoice DOM to use normal hex/rgb-safe colors.
      onclone: (clonedDocument) => {
        const clonedInvoice = clonedDocument.querySelector('.invoice-print-area') as HTMLElement | null

        if (!clonedInvoice) return

        clonedInvoice.style.backgroundColor = '#ffffff'
        clonedInvoice.style.color = '#111827'
        clonedInvoice.style.borderColor = '#e5e7eb'
        clonedInvoice.style.boxShadow = 'none'

        const allElements = clonedInvoice.querySelectorAll<HTMLElement>('*')

        allElements.forEach((el) => {
          el.style.boxShadow = 'none'
          el.style.textShadow = 'none'
          el.style.colorScheme = 'light'

          const className = String(el.className || '')

          // default text
          el.style.color = '#111827'

          // muted text
          if (
            className.includes('text-gray-400') ||
            className.includes('text-gray-500') ||
            className.includes('text-gray-600')
          ) {
            el.style.color = '#4b5563'
          }

          // blue text
          if (className.includes('text-blue')) {
            el.style.color = '#2563eb'
          }

          // green/paid text
          if (
            className.includes('text-emerald') ||
            className.includes('text-green')
          ) {
            el.style.color = '#047857'
          }

          // red/cancelled text
          if (className.includes('text-red')) {
            el.style.color = '#b91c1c'
          }

          // amber/pending text
          if (
            className.includes('text-amber') ||
            className.includes('text-yellow')
          ) {
            el.style.color = '#b45309'
          }

          // backgrounds
          if (className.includes('bg-white')) {
            el.style.backgroundColor = '#ffffff'
          } else if (className.includes('bg-gray-50')) {
            el.style.backgroundColor = '#f9fafb'
          } else if (className.includes('bg-gray-100')) {
            el.style.backgroundColor = '#f3f4f6'
          } else if (
            className.includes('bg-emerald') ||
            className.includes('bg-green')
          ) {
            el.style.backgroundColor = '#d1fae5'
          } else if (className.includes('bg-red')) {
            el.style.backgroundColor = '#fee2e2'
          } else if (
            className.includes('bg-amber') ||
            className.includes('bg-yellow')
          ) {
            el.style.backgroundColor = '#fef3c7'
          } else if (className.includes('bg-blue')) {
            el.style.backgroundColor = '#dbeafe'
          }

          // borders
          if (className.includes('border')) {
            el.style.borderColor = '#e5e7eb'
          }
        })
      },
    })

    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight))
    pdf.save(`${invoice.invoice_number}.pdf`)
  } catch (error) {
    console.error('Invoice PDF download failed:', error)
  } finally {
    setDownloading(false)
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md w-full text-center">
          <p className="text-red-600 font-semibold">{error || 'Invoice not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const currency = invoice.currency || 'NPR'

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="no-print max-w-4xl mx-auto mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </button>
        </div>
      </div>

<div
  ref={invoiceRef}
  className="invoice-print-area print-page max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl p-8 md:p-10"
>
        <div className="flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-sm text-gray-500 mt-1">
              Subscription Billing Invoice
            </p>
          </div>

          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">
              {invoice.invoice_number}
            </p>
            <span
              className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                invoice.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-700'
                  : invoice.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Billed To
            </h2>
            <p className="mt-3 text-lg font-bold text-gray-900">
              {invoice.hotel_name}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {invoice.hotel_address || '-'}
            </p>
            <p className="text-sm text-gray-600">
              {[invoice.city, invoice.country].filter(Boolean).join(', ') || '-'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Phone: {invoice.hotel_phone || invoice.admin_phone || '-'}
            </p>
            <p className="text-sm text-gray-600">
              Email: {invoice.admin_email || '-'}
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Invoice Details
            </h2>

            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="text-gray-500">Invoice Date:</span>{' '}
                <span className="font-medium text-gray-900">
                  {formatDate(invoice.created_at)}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Due Date:</span>{' '}
                <span className="font-medium text-gray-900">
                  {formatDate(invoice.due_date)}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Paid At:</span>{' '}
                <span className="font-medium text-gray-900">
                  {formatDate(invoice.paid_at)}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Payment Method:</span>{' '}
                <span className="font-medium text-gray-900 capitalize">
                  {invoice.payment_method || '-'}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Transaction ID:</span>{' '}
                <span className="font-medium text-gray-900">
                  {invoice.transaction_id || '-'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-600">
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Cycle</th>
                <th className="p-4 font-semibold">Period</th>
                <th className="p-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-t border-gray-200">
                <td className="p-4">
                  <p className="font-semibold text-gray-900">
                    {invoice.plan_name || 'Subscription Plan'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Plan Code: {invoice.plan_code || '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {invoice.max_tables || 0} tables • {invoice.max_staff || 0} staff • {invoice.max_menu_items || 0} menu items
                  </p>
                </td>

                <td className="p-4 capitalize text-gray-700">
                  {invoice.billing_cycle}
                </td>

                <td className="p-4 text-gray-700">
                  {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}
                </td>

                <td className="p-4 text-right font-semibold text-gray-900">
                  {currency} {formatMoney(invoice.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {currency} {formatMoney(invoice.amount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-gray-900">
                {currency} {formatMoney(invoice.tax_amount)}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                {currency} {formatMoney(invoice.total_amount)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
          <p className="text-sm text-gray-600 mt-2">
            This invoice was generated for your subscription payment. Please keep it for your records.
          </p>
        </div>

        <div className="mt-10 text-center text-xs text-gray-400">
          <p>Generated by {invoice.hotel_name} Billing System</p>
        </div>
      </div>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function formatMoney(value?: string | number | null) {
  const number = Number(String(value ?? 0).replace(/,/g, ''))

  return new Intl.NumberFormat('en-NP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0)
}