// components/dashboard/views/SettingsView.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Hotel } from '@/store/slices/hotelAuthSlice'
import { toast } from 'react-hot-toast'
import {
  Settings,
  Shield,
  CreditCard,
  Mail,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Building,
  Phone,
  MapPin,
  Globe,
  Save,
} from 'lucide-react'

import PasswordChangeModal from '../modals/PasswordChangeModal'

import { useHotelPassword } from '@/hooks/useHotelPassword'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  updateHotelProfile,
  PaymentMethod,
} from '@/store/slices/dashboardSlice'

interface SettingsViewProps {
  hotelSlug: string
  hotel: Hotel
  adminEmail: string
}

export default function SettingsView({
  hotelSlug,
  hotel,
  adminEmail,
}: SettingsViewProps) {
  const dispatch = useAppDispatch()

  const [activeTab, setActiveTab] = useState('general_info')
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  const [newPaymentMethod, setNewPaymentMethod] = useState('')
  const [isSavingHotelInfo, setIsSavingHotelInfo] = useState(false)
  const [isSavingBusinessSettings, setIsSavingBusinessSettings] =
    useState(false)

  const [hotelInfoForm, setHotelInfoForm] = useState({
    hotel_name: '',
    hotel_phone: '',
    hotel_address: '',
    city: '',
    country: '',
  })

  const [businessForm, setBusinessForm] = useState({
    timezone: 'UTC',
    currency: 'USD',
    tax_rate: 0.1,
    service_charge: 0.05,
  })

  const { paymentMethods, paymentMethodsLoading } = useAppSelector(
    (state) => state.dashboard,
  )



  useEffect(() => {
    if (hotelSlug) {
      dispatch(fetchPaymentMethods(hotelSlug))
    }
  }, [dispatch, hotelSlug])

  useEffect(() => {
    if (hotel) {
      setHotelInfoForm({
        hotel_name: hotel.hotel_name || '',
        hotel_phone: hotel.hotel_phone || '',
        hotel_address: hotel.hotel_address || '',
        city: hotel.city || '',
        country: hotel.country || '',
      })

      setBusinessForm({
        timezone: hotel.timezone || 'UTC',
        currency: hotel.currency || 'USD',
        tax_rate: typeof hotel.tax_rate === 'number' ? hotel.tax_rate : 0.1,
        service_charge:
          typeof hotel.service_charge === 'number'
            ? hotel.service_charge
            : 0.05,
      })
    }
  }, [hotel])

  const handleSaveHotelInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!hotel?.id) {
      toast.error('Hotel ID is required')
      return
    }

    setIsSavingHotelInfo(true)

    try {
      await dispatch(
        updateHotelProfile({
          hotelId: hotel.id,
          ...hotelInfoForm,
        }),
      ).unwrap()

      toast.success('Hotel general information updated successfully')
    } catch (error: any) {
      console.error('Hotel info update error:', error)
      toast.error(error?.message || 'Failed to update hotel information')
    } finally {
      setIsSavingHotelInfo(false)
    }
  }

  const handleSaveBusinessSettings = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()

    if (!hotel?.id) {
      toast.error('Hotel ID is required')
      return
    }

    setIsSavingBusinessSettings(true)

    try {
      await dispatch(
        updateHotelProfile({
          hotelId: hotel.id,
          ...businessForm,
        }),
      ).unwrap()

      toast.success('Business settings updated successfully')
    } catch (error: any) {
      console.error('Business settings update error:', error)
      toast.error(error?.message || 'Failed to update business settings')
    } finally {
      setIsSavingBusinessSettings(false)
    }
  }




  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.trim() || !hotel?.id) return

    await dispatch(
      addPaymentMethod({
        hotelId: hotel.id,
        method_name: newPaymentMethod.trim(),
      }),
    )

    setNewPaymentMethod('')
  }

  const handleTogglePaymentMethod = async (method: PaymentMethod) => {
    await dispatch(
      updatePaymentMethod({
        id: method.id,
        is_enabled: !method.is_enabled,
      }),
    )
  }

  const handleDeletePaymentMethod = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      await dispatch(deletePaymentMethod(id))
    }
  }

  const tabs = [
    {
      id: 'general_info',
      label: 'General Info',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: 'business_settings',
      label: 'Business Settings',
      icon: <Building className="h-4 w-4" />,
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      id: 'payment_methods',
      label: 'Payment Methods',
      icon: <CreditCard className="h-4 w-4" />,
    },
  ]

  return (
    <>
      <div className="space-y-6 z-100">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold mb-2">Settings</h1>
              <p className="text-blue-100">
                Manage hotel information, business settings and security
              </p>
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
            {activeTab === 'general_info' && (
              <form onSubmit={handleSaveHotelInfo} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Hotel General Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Update hotel name, contact and location details.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hotel Name *
                    </label>
                    <div className="relative">
                      <Building className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={hotelInfoForm.hotel_name}
                        onChange={(e) =>
                          setHotelInfoForm({
                            ...hotelInfoForm,
                            hotel_name: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSavingHotelInfo}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={hotelInfoForm.hotel_phone}
                        onChange={(e) =>
                          setHotelInfoForm({
                            ...hotelInfoForm,
                            hotel_phone: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSavingHotelInfo}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={hotelInfoForm.hotel_address}
                        onChange={(e) =>
                          setHotelInfoForm({
                            ...hotelInfoForm,
                            hotel_address: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSavingHotelInfo}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={hotelInfoForm.city}
                      onChange={(e) =>
                        setHotelInfoForm({
                          ...hotelInfoForm,
                          city: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSavingHotelInfo}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={hotelInfoForm.country}
                      onChange={(e) =>
                        setHotelInfoForm({
                          ...hotelInfoForm,
                          country: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSavingHotelInfo}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingHotelInfo}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingHotelInfo ? 'Saving...' : 'Save General Info'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'business_settings' && (
              <form onSubmit={handleSaveBusinessSettings} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Business Settings
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure currency, timezone, tax and service charge.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <div className="relative">
                      <Globe className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={businessForm.currency}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            currency: e.target.value.toUpperCase(),
                          })
                        }
                        maxLength={3}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSavingBusinessSettings}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={businessForm.timezone}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          timezone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSavingBusinessSettings}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={businessForm.tax_rate}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          tax_rate: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSavingBusinessSettings}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Charge
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={businessForm.service_charge}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          service_charge: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSavingBusinessSettings}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingBusinessSettings}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingBusinessSettings
                      ? 'Saving...'
                      : 'Save Business Settings'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Password
                    </h3>
                    <p className="text-sm text-gray-600">
                      Change your password to keep your account secure
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Last changed: {hotel.updated_at || 'Not available'}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Change Password
                  </button>
                </div>


              </div>
            )}

            {activeTab === 'payment_methods' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment Methods
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Add and manage payment methods available for this hotel.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddPaymentMethod()
                      }
                    }}
                    placeholder="Cash, Card, Esewa, Khalti, Bank Transfer"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <button
                    onClick={handleAddPaymentMethod}
                    disabled={!newPaymentMethod.trim()}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    Add Method
                  </button>
                </div>

                <div className="space-y-3">
                  {paymentMethodsLoading ? (
                    <div className="text-center py-10 text-gray-500">
                      Loading payment methods...
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                      <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No payment methods added yet</p>
                    </div>
                  ) : (
                    paymentMethods.map((method: PaymentMethod) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {method.method_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {method.is_enabled ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={method.is_enabled}
                              onChange={() =>
                                handleTogglePaymentMethod(method)
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
                          </label>

                          <button
                            onClick={() =>
                              handleDeletePaymentMethod(method.id)
                            }
                            className="p-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        hotelSlug={hotelSlug}
        adminEmail={adminEmail}
      />


    </>
  )
}