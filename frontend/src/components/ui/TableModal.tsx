
'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface TableModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (tableData: any) => void
  initialData?: any
}

export default function TableModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: TableModalProps) {
  const sections = ['Main Hall', 'Terrace', 'VIP Area', 'Garden', 'Private Room', 'Bar Area']

  const [formData, setFormData] = useState({
    table_number: '',
    table_name: '',
    capacity: 2,
    floor_number: 1,
    sectionSelect: 'Main Hall', // dropdown value
    customSection: '', // only when sectionSelect === 'Other'
    status: 'available',
    qr_code_url: '',
  })

  useEffect(() => {
    if (initialData) {
      const incomingSection = initialData.section || 'Main Hall'
      const isPredefined = sections.includes(incomingSection)

      setFormData({
        table_number: initialData.table_number || '',
        table_name: initialData.table_name || '',
        capacity: initialData.capacity || 2,
        floor_number: initialData.floor_number || 1,
        sectionSelect: isPredefined ? incomingSection : 'Other',
        customSection: isPredefined ? '' : incomingSection,
        status: initialData.status || 'available',
        qr_code_url: initialData.qr_code_url || '',
      })
    } else {
      setFormData({
        table_number: '',
        table_name: '',
        capacity: 2,
        floor_number: 1,
        sectionSelect: 'Main Hall',
        customSection: '',
        status: 'available',
        qr_code_url: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const finalSection =
      formData.sectionSelect === 'Other'
        ? (formData.customSection || 'Other')
        : formData.sectionSelect

    onSubmit({
      table_number: formData.table_number.trim(),
      table_name: formData.table_name.trim() || null,
      capacity: Number(formData.capacity) || 2,
      floor_number: Number(formData.floor_number) || 1,
      section: finalSection,
      status: formData.status,
      qr_code_url: formData.qr_code_url.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-[9999] isolate overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500/75" onClick={onClose} aria-hidden="true" />

      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div
          role="dialog"
          aria-modal="true"
          className="relative z-[10000] w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {initialData ? 'Edit Table' : 'Add New Table'}
            </h3>
            <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Table Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.table_number}
                    onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., T-01"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Table Name</label>
                  <input
                    type="text"
                    value={formData.table_name}
                    onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Window View"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 2 })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Floor Number</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.floor_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        floor_number: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Section *</label>
                <select
                  required
                  value={formData.sectionSelect}
                  onChange={(e) => setFormData({ ...formData, sectionSelect: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {sections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              {formData.sectionSelect === 'Other' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Custom Section Name
                  </label>
                  <input
                    type="text"
                    value={formData.customSection}
                    onChange={(e) => setFormData({ ...formData, customSection: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter section name"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  QR Code URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.qr_code_url}
                  onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/qr-code.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Link to QR code for table ordering (will be generated automatically if empty)
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {initialData ? 'Update Table' : 'Add Table'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
