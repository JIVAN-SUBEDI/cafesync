// components/dashboard/views/ImageViewModal.tsx
'use client'

import React from 'react'
import { X, Download, ExternalLink } from 'lucide-react'

interface ImageViewModalProps {
  isOpen: boolean
  onClose: () => void
  item: any
}

export default function ImageViewModal({ isOpen, onClose, item }: ImageViewModalProps) {
  if (!isOpen || !item) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(item.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.name.replace(/\s+/g, '-').toLowerCase()}-image.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="relative max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-600">
              {item.category} • रु {Number(item.price).toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            
            <a
              href={item.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative bg-gray-900 flex items-center justify-center p-4" style={{ minHeight: '400px' }}>
          <img
            src={item.image_url}
            alt={item.name}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+Not+Found'
            }}
          />
        </div>

        {/* Footer with Item Details */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className={`text-sm font-medium mt-1 ${
                item.is_available ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {item.is_available ? 'Available' : 'Unavailable'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Popular</p>
              <p className="text-sm font-medium mt-1">
                {item.is_popular ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Prep Time</p>
              <p className="text-sm font-medium mt-1">
                {item.preparation_time ? `${item.preparation_time} min` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tax Rate</p>
              <p className="text-sm font-medium mt-1">
                {item.tax_rate ? `${item.tax_rate}%` : '—'}
              </p>
            </div>
          </div>
          {item.description && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">{item.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}