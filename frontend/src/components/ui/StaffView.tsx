
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/index'
import {
  fetchStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  deleteStaff
} from '@/store/slices/dashboardSlice'
import { Plus, Edit, Users, UserCheck, UserX, Trash2 } from 'lucide-react'
import StaffModal from './StaffModal'
import ConfirmModal from './ConfirmModal'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'

interface StaffViewProps {
  hotelSlug: string
}

export default function StaffView({ hotelSlug }: StaffViewProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { staffList, loading } = useSelector((state: RootState) => state.dashboard)

  const staffArray = useMemo(
    () => (Array.isArray(staffList) ? staffList : []),
    [staffList]
  )

  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (hotelSlug) {
      dispatch(fetchStaff(hotelSlug))
    }
  }, [hotelSlug, dispatch])

  const mapToBackend = (staffData: any) => {
    return {
      full_name: staffData.full_name,
      role: staffData.role,
      phone_number: staffData.phone || null,
      email: staffData.email || null,
      password: staffData.password || null,
      permissions: staffData.permissions,
      is_active: staffData.is_active,
      image: staffData.image, // Include image file
    }
  }

  const isValidPhone = (phone?: string | null) => {
    if (!phone) return true; // allow empty
    return /^\d{10}$/.test(phone);
  };

  const handleCreateStaff = async (staffData: any) => {
    if (!isValidPhone(staffData.phone)) {
      toast.error('Phone number must be exactly 10 digits')
      return
    }
    try {
      await dispatch(
        createStaff({ hotelSlug, staffData: mapToBackend(staffData) })
      ).unwrap()
      toast.success('Staff created successfully')
      setShowStaffModal(false)
    } catch (error: any) {
      toast.error(error || 'Failed to create staff')
    }
  }

  const handleUpdateStaff = async (staffData: any) => {
    if (!editingStaff?.id) return

    if (!isValidPhone(staffData.phone)) {
      toast.error('Phone number must be exactly 10 digits')
      return
    }

    try {
      await dispatch(
        updateStaff({
          hotelSlug,
          staffId: editingStaff.id,
          staffData: mapToBackend(staffData),
        })
      ).unwrap()

      toast.success('Staff updated successfully')
      setShowStaffModal(false)
      setEditingStaff(null)
    } catch (error: any) {
      toast.error(error || 'Failed to update staff')
    }
  }

  const handleDeleteStaff = async () => {
    if (!selectedStaff?.id) return

    try {
      await dispatch(
        deleteStaff({ hotelSlug, staffId: selectedStaff.id })
      ).unwrap()

      toast.success('Staff deleted successfully')
      setShowDeleteModal(false)
      setSelectedStaff(null)
    } catch (error: any) {
      toast.error(error || 'Failed to delete staff')
    }
  }

  const handleToggleStaffStatus = async () => {
    if (!selectedStaff?.id) return

    try {
      await dispatch(
        toggleStaffStatus({ hotelSlug, staffId: selectedStaff.id })
      ).unwrap()

      toast.success(
        `Staff ${selectedStaff.status === 'active' ? 'deactivated' : 'activated'} successfully`
      )
      setShowStatusModal(false)
      setSelectedStaff(null)
    } catch (error: any) {
      toast.error(error || 'Failed to update staff status')
    }
  }
const getRoleLabel = (role: string) => {
  switch (role) {
    case 'hotel_admin':
      return 'Hotel Admin'
    case 'waiter':
      return 'Waiter'
    case 'kitchen':
      return 'Kitchen'
    case 'billing':
      return 'Billing'
    default:
      return role
        ?.replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
  }
}
const getRoleColor = (role: string) => {
  switch (role) {
    case 'hotel_admin':
      return 'bg-purple-100 text-purple-800'
    case 'waiter':
      return 'bg-blue-100 text-blue-800'
    case 'kitchen':
      return 'bg-amber-100 text-amber-800'
    case 'billing':
      return 'bg-emerald-100 text-emerald-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredStaff = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    return staffArray.filter((staff: any) => {
      const matchesRole = filterRole === 'all' || staff.role === filterRole
      const matchesStatus = filterStatus === 'all' || staff.status === filterStatus
      const matchesSearch =
        !q ||
        (staff.name || '').toLowerCase().includes(q) ||
        (staff.staff_code || '').toLowerCase().includes(q) ||
        (staff.role || '').toLowerCase().includes(q) ||
        (staff.email || '').toLowerCase().includes(q)

      return matchesRole && matchesStatus && matchesSearch
    })
  }, [staffArray, filterRole, filterStatus, searchTerm])

  const activeStaffCount = useMemo(
    () => staffArray.filter((s: any) => s.status === 'active').length,
    [staffArray]
  )

  const inactiveStaffCount = useMemo(
    () => staffArray.filter((s: any) => s.status === 'inactive').length,
    [staffArray]
  )

  // Helper function to get image URL
const getStaffImageUrl = (staff: any) => {
  if (!staff?.profile_image) return null;

  // Already full URL
  if (staff.profile_image.startsWith("http")) {
    return staff.profile_image;
  }

  // Fix relative path
  return staff.profile_image
};

  if (loading && staffArray.length === 0) {
    return <LoadingSpinner />
  }

  console.log('Staff List:', staffArray)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Staff Management</h1>
            <p className="text-blue-100">Manage your hotel staff and their permissions</p>
          </div>

          <button
            onClick={() => {
              setEditingStaff(null)
              setShowStaffModal(true)
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{staffArray.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeStaffCount}</p>
            </div>
          </div>
        </div>

  

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <UserX className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{inactiveStaffCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900">All Staff Members</h3>

            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <option value="all">All Roles</option>
                <option value="hotel_admin">Hotel Admin</option>
                <option value="waiter">Waiter</option>
                <option value="kitchen">Kitchen</option>
                <option value="billing">Billing</option>

              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-600">
                <th className="p-4 font-medium">Staff Member</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Today's Orders</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff: any) => {
                  const imageUrl = getStaffImageUrl(staff);
                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-gray-50 ${
                        staff.status === 'inactive' ? 'opacity-70' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={staff.full_name}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const fallbackDiv = document.createElement('div');
                                  fallbackDiv.className = 'h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold';
                                  fallbackDiv.textContent = (staff.full_name || 'U').charAt(0).toUpperCase();
                                  parent.insertBefore(fallbackDiv, e.currentTarget);
                                  e.currentTarget.remove();
                                }
                              }}
                            />
                          ) : null}
                          {!imageUrl && (
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {(staff.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{staff.full_name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                            staff.role
                          )}`}
                        >
                          {getRoleLabel(staff.role)}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          {staff.phone && <p className="text-sm text-gray-700">{staff.phone}</p>}
                          {staff.email && (
                            <p className="text-sm text-gray-600 truncate max-w-[200px]">
                              {staff.email}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            staff.status
                          )}`}
                        >
                          {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="font-medium text-gray-900">{staff.today_orders ?? 0}</p>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingStaff({
                                ...staff,
                                full_name: staff.full_name,
                                phone: staff.phone ?? '',
                                profile_img: staff.profile_img, // Include existing image
                              })
                              setShowStaffModal(true)
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit staff"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {staff.status === 'active' ? (
                            <button
                              onClick={() => {
                                setSelectedStaff(staff)
                                setShowStatusModal(true)
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Deactivate staff"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedStaff(staff)
                                setShowStatusModal(true)
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Activate staff"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedStaff(staff)
                              setShowDeleteModal(true)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete staff"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600">No staff members found</p>
                    <button
                      onClick={() => {
                        setEditingStaff(null)
                        setShowStaffModal(true)
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Add your first staff member
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      <StaffModal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false)
          setEditingStaff(null)
        }}
        onSubmit={editingStaff ? handleUpdateStaff : handleCreateStaff}
        initialData={editingStaff}
      />

      {/* Status Toggle Modal */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false)
          setSelectedStaff(null)
        }}
        onConfirm={handleToggleStaffStatus}
        title={selectedStaff?.status === 'active' ? 'Deactivate Staff' : 'Activate Staff'}
        message={
          selectedStaff?.status === 'active'
            ? `Are you sure you want to deactivate ${selectedStaff?.name || ''}? They will no longer be able to log in or work until reactivated.`
            : `Are you sure you want to activate ${selectedStaff?.name || ''}? They will be able to log in and work again.`
        }
        confirmText={selectedStaff?.status === 'active' ? 'Deactivate' : 'Activate'}
        confirmButtonClass={selectedStaff?.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedStaff(null)
        }}
        onConfirm={handleDeleteStaff}
        title="Delete Staff"
        message={`Are you sure you want to delete ${selectedStaff?.name || ''}? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}

