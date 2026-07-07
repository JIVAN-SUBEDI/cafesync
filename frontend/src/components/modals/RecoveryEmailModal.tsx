// components/dashboard/modals/RecoveryEmailModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { X, Mail, AlertCircle, CheckCircle } from 'lucide-react'

interface RecoveryEmailModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
  onSubmit: (email: string) => Promise<void>
  isLoading: boolean
}

export default function RecoveryEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onSubmit,
  isLoading
}: RecoveryEmailModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && currentEmail) {
      setEmail(currentEmail)
    } else if (isOpen && !currentEmail) {
      setEmail('')
    }
    setError('')
    setSuccess('')
  }, [isOpen, currentEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    setError('')
    setIsSubmitting(true)
    
    try {
      await onSubmit(email)
      setSuccess('Recovery email updated successfully!')
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to update recovery email')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentEmail ? 'Update Recovery Email' : 'Add Recovery Email'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentEmail 
                  ? 'Change your recovery email address' 
                  : 'Set up a recovery email for password reset OTPs'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recovery Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recovery@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isSubmitting || isLoading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This email will be used to send password reset OTP codes. It should be different from your primary admin email.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Security Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>🔒 Security Note:</strong> Your recovery email adds an extra layer of security. Password reset OTPs will be sent to this email address if it exists.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                currentEmail ? 'Update Email' : 'Add Email'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}