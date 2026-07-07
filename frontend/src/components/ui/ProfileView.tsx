// components/dashboard/views/ProfileView.tsx
'use client'

import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-hot-toast'
import type { AppDispatch } from '@/store'
// import { updateProo } from '@/store/slices/dashboardSlice'
import { updateMyProfile } from '@/store/slices/hotelAuthSlice'
import {
  Edit,
  X,
  Save,
  User,
  Mail,
  Camera,
  Calendar,
  Settings,
  Phone,
} from 'lucide-react'

interface UserProfileInfo {
  id: string
  full_name?: string
  email?: string
  phone_number?: string
  profile_image?: string
  created_at?: string
  updated_at?: string
}



interface ProfileViewProps {
  dashboardData: UserProfileInfo
}

export default function ProfileView({ dashboardData }: ProfileViewProps) {
  const user = dashboardData
  const dispatch = useDispatch<AppDispatch>()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    profile_image: null as File | null,
  })

  useEffect(() => {
    if (user) {
      console.log(user)
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        profile_image: null,
      })

      setPreviewImage(user.profile_image || null)
    }
  }, [user])

  const resetForm = () => {
    if (!user) return

    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      profile_image: null,
    })

    setPreviewImage(user.profile_image || null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFormData({ ...formData, profile_image: file })
    setPreviewImage(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user?.id) {
      toast.error('User ID is required')
      return
    }

    setIsSaving(true)

    try {
      const updateData = new FormData()

      updateData.append('id', user.id)
      updateData.append('full_name', formData.full_name)
      updateData.append('email', formData.email)
      updateData.append('phone', formData.phone_number)

      if (formData.profile_image) {
        updateData.append('profile_image', formData.profile_image)
      }

      await dispatch(updateMyProfile(updateData as any)).unwrap()

      toast.success('User profile updated successfully')
      setIsEditing(false)
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error(error?.message || 'Failed to update user profile')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A'

    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900">
          No user profile available
        </h3>
        <p className="text-gray-600 mt-2">
          Please refresh the page or check your connection
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">User Profile</h1>
            <p className="text-blue-100">
              Manage your full name, profile image, email and phone
            </p>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit User Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  resetForm()
                }}
                disabled={isSaving}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="submit"
                form="user-profile-form"
                disabled={isSaving}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              User Profile
            </h3>
          </div>

          {isEditing ? (
            <form
              id="user-profile-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="h-28 w-28 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  <label className="absolute bottom-0 right-0 h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isSaving}
                    />
                  </label>
                </div>

                <p className="text-sm text-gray-500">
                  Click camera icon to change profile image
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start">
                <div className="h-28 w-28 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </label>
                  <p className="text-gray-900 font-medium">
                    {user.full_name || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-gray-900">
                    {user.email || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <p className="text-gray-900">
                    {user.phone_number || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-900">
                    {formatDate(user.created_at)} {formatTime(user.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="text-gray-900">
                    {formatDate(user.updated_at)} {formatTime(user.updated_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">User ID</p>
                  <p className="text-gray-900 font-mono text-xs truncate">
                    {user.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}