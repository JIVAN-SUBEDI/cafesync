// components/dashboard/modals/PasswordChangeModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useHotelPassword } from '@/hooks/useHotelPassword';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelSlug: string;
  adminEmail: string;
}

export default function PasswordChangeModal({ 
  isOpen, 
  onClose, 
  hotelSlug,
  adminEmail 
}: PasswordChangeModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    isLoading,
    error,
    changeWithOld,
    clearMessages,
  } = useHotelPassword();

  // Reset form when modal closes
  const handleClose = () => {
    if (!isLoading) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLocalError(null);
      setSuccess(false);
      clearMessages();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!oldPassword) {
      setLocalError('Please enter your current password');
      return;
    }

    if (!newPassword) {
      setLocalError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters long');
      return;
    }

    // Password strength validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

if (!passwordRegex.test(newPassword.trim())) {
  setLocalError(
    "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
  );
  return;
}

    if (newPassword !== confirmPassword) {
      setLocalError('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setLocalError('New password must be different from current password');
      return;
    }

    try {
      await changeWithOld(oldPassword, newPassword, confirmPassword);
      setSuccess(true);
      // Close modal after 2 seconds on success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to change password');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500 mt-1">
                Update your password to keep your account secure
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success State */}
          {success ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Changed!</h3>
              <p className="text-gray-600">
                Your password has been successfully updated.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Error Message */}
              {(localError || error) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{localError || error}</p>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-11"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-11"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                    <li>One special character (@$!%*?&)</li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-11"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          newPassword.length >= 8 && 
                          /[A-Z]/.test(newPassword) && 
                          /[a-z]/.test(newPassword) && 
                          /[0-9]/.test(newPassword) && 
                          /[@$!%*?&]/.test(newPassword)
                            ? 'w-full bg-green-500'
                            : newPassword.length >= 6
                            ? 'w-2/3 bg-yellow-500'
                            : 'w-1/3 bg-red-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {newPassword.length >= 8 && 
                       /[A-Z]/.test(newPassword) && 
                       /[a-z]/.test(newPassword) && 
                       /[0-9]/.test(newPassword) && 
                       /[@$!%*?&]/.test(newPassword)
                        ? 'Strong'
                        : newPassword.length >= 6
                        ? 'Medium'
                        : 'Weak'}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !oldPassword || !newPassword || !confirmPassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}