// app/admin/hotels/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHotels } from '@/hooks/useHotels';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Table,
  Menu,
  DollarSign,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Star,
  Shield,
  Clock,
  Loader2,
  Power,
  PowerOff,
  UserCheck,
  Activity
} from 'lucide-react';

export default function HotelsPage() {
  const router = useRouter();
  const {
    hotels,
    pagination,
    filters,
    isLoading,
    isFetching,
    error,
    plans,
    selectedHotels,
    actionMenu,
    setActionMenu,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    isExporting,
    refetch,
    updateFilters,
    goToPage,
    handleSearch,
    handleToggleStatus,
    handleVerify,
    handleDeleteClick,
    handleDeleteConfirm,
    handleExport,
    handleSelectAll,
    handleSelectHotel,
  } = useHotels();

  console.log('this is hotels:- ', hotels)

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSubscriptionBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
        <XCircle className="h-3 w-3" />
        Inactive
      </span>
    );
  };

  const getVerifiedBadge = (isVerified: boolean) => {
    return isVerified ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
        <CheckCircle className="h-3 w-3" />
        Verified
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  };

  if (isLoading && !hotels.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all hotels across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={isFetching}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Export"
          >
            <Download className={`h-5 w-5 text-gray-600 ${isExporting ? 'animate-pulse' : ''}`} />
          </button>
          <Link
            href="/admin/hotels/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>Add Hotel</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search hotels by name, email, phone, city..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status || 'all'}
              onChange={(e) => updateFilters({ status: e.target.value as any })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.subscription_status || 'all'}
              onChange={(e) => updateFilters({ subscription_status: e.target.value as any })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.plan_id || ''}
              onChange={(e) => updateFilters({ plan_id: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="">All Plans</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.plan_name}
                </option>
              ))}
            </select>

            <select
              value={`${filters.sort_by || 'created_at'}_${filters.sort_order || 'desc'}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('_');
                updateFilters({ sort_by: sort_by as any, sort_order: sort_order as 'asc' | 'desc' });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="created_at_desc">Newest First</option>
              <option value="created_at_asc">Oldest First</option>
              <option value="hotel_name_asc">Name (A-Z)</option>
              <option value="hotel_name_desc">Name (Z-A)</option>
              <option value="total_revenue_desc">Highest Revenue</option>
              <option value="total_revenue_asc">Lowest Revenue</option>
              <option value="total_orders_desc">Most Orders</option>
              <option value="staff_count_desc">Most Staff</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg ${
                showFilters ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  placeholder="Filter by country"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Filter by city"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Revenue</label>
                <input
                  type="number"
                  placeholder="Minimum revenue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Revenue</label>
                <input
                  type="number"
                  placeholder="Maximum revenue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load hotels. Please try again.</p>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedHotels.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedHotels.length} hotel(s) selected
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Bulk Edit
              </button>
              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                Bulk Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {hotel.hotelName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{hotel.hotelName}</h3>
                    <p className="text-sm text-gray-500">{hotel.hotelSlug}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActionMenu(actionMenu === hotel.id ? null : hotel.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  </button>

                  {/* Dropdown Menu */}
{actionMenu === hotel.id && (
  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
    <Link
      href={{
        pathname: `/admin/hotels/${hotel.id}`,
        query: { data: JSON.stringify(hotel) }
      }}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      onClick={() => setActionMenu(null)}
    >
      <Eye className="h-4 w-4" />
      View Details
    </Link>
    <Link
      href={{
        pathname: `/admin/hotels/${hotel.id}/edit`,
        query: { data: JSON.stringify(hotel) }
      }}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      onClick={() => setActionMenu(null)}
    >
      <Edit className="h-4 w-4" />
      Edit Hotel
    </Link>
    <button
      onClick={() => handleToggleStatus(hotel.id)}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      {hotel.status.isActive ? (
        <>
          <PowerOff className="h-4 w-4" />
          Deactivate
        </>
      ) : (
        <>
          <Power className="h-4 w-4" />
          Activate
        </>
      )}
    </button>
    <div className="border-t border-gray-100 my-1"></div>
    <button
      onClick={() => handleDeleteClick(hotel.id)}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
      Delete Hotel
    </button>
  </div>
)}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {getStatusBadge(hotel.status.isActive)}
                {getVerifiedBadge(hotel.status.isVerified)}
                {getSubscriptionBadge(hotel.subscription.status)}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Location */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-600">
                  {hotel.contact.city}, {hotel.contact.country}
                </span>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{hotel.admin.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{hotel.contact.hotelPhone || 'No phone'}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3 w-3" />
                    Staff
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{hotel.usage.staffCount}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Table className="h-3 w-3" />
                    Tables
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{hotel.usage.tableCount}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Activity className="h-3 w-3" />
                    Orders
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{hotel.usage.totalOrders}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <DollarSign className="h-3 w-3" />
                    Revenue
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(hotel.usage.totalRevenue)}
                  </p>
                </div>
              </div>

              {/* Plan Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Current Plan</span>
                  <span className="text-xs font-medium text-blue-600">
                    {hotel.subscription.planName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(hotel.subscription.pricePerMonth)}/mo
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 text-xs text-gray-400 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {formatDate(hotel.activity.createdAt)}
                </div>
                 <Link
    href={{
      pathname: `/admin/hotels/${hotel.id}`,
      query: { data: JSON.stringify(hotel) }
    }}
    className="text-blue-600 hover:text-blue-800 font-medium"
  >
    View Details →
  </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {hotels.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hotels found</h3>
          <p className="text-gray-500 mb-6">
            {filters.search || filters.status !== 'all' || filters.subscription_status !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first hotel'}
          </p>
          {filters.search || filters.status !== 'all' || filters.subscription_status !== 'all' ? (
            <button
              onClick={() => {
                updateFilters({ search: '', status: 'all', subscription_status: 'all', plan_id: '' });
                setSearchInput('');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          ) : (
            <Link
              href="/admin/hotels/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Hotel
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} hotels
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Hotel</h3>
              <p className="text-gray-500 mt-2">
                Are you sure you want to delete this hotel? This action cannot be undone and will remove all associated data.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}