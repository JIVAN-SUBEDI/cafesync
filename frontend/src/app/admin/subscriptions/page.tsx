// // app/admin/subscriptions/page.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/store';
// import {
//   fetchSubscriptions,
//   deleteSubscription,
//   toggleSubscriptionStatus,
//   setFilters,
//   resetActionStatus
// } from '@/store/slices/adminSubscription';
// import {
//   Plus,
//   Search,
//   Filter,
//   Edit,
//   Trash2,
//   Eye,
//   MoreHorizontal,
//   ChevronLeft,
//   ChevronRight,
//   Download,
//   RefreshCw,
//   AlertCircle,
//   CheckCircle,
//   XCircle,
//   DollarSign,
//   Users,
//   Table,
//   Menu,
//   CreditCard
// } from 'lucide-react';
// import Link from 'next/link';
// import { feDisplacementMap } from 'framer-motion/client';

// export default function SubscriptionsPage() {
//   const router = useRouter();
//   const dispatch = useDispatch<AppDispatch>();
//   const { plans, filters, pagination, status, actionStatus, error } = useSelector(
//     (state: RootState) => state.adminSubscription
//   );

//   const [searchInput, setSearchInput] = useState(filters.search);
//   const [showFilters, setShowFilters] = useState(false);
//   const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [planToDelete, setPlanToDelete] = useState<string | null>(null);

//   useEffect(() => {
//     dispatch(fetchSubscriptions(searchInput ? { search: searchInput } : undefined));
//   }, [dispatch]);

//   useEffect(() => {
//     if (actionStatus === 'succeeded') {
//       dispatch(resetActionStatus());
//     }
//   }, [actionStatus, dispatch]);

//   const handleSearch = () => {
//     dispatch(setFilters({ search: searchInput, page: 1 }));
//     dispatch(fetchSubscriptions({ search: searchInput, page: 1 }));
//   };

//   const handleFilterChange = (key: string, value: any) => {
//     dispatch(setFilters({ [key]: value, page: 1 }));
//     dispatch(fetchSubscriptions({ [key]: value, page: 1 }));
//   };

//   const handlePageChange = (newPage: number) => {
//     dispatch(setFilters({ page: newPage }));
//     dispatch(fetchSubscriptions({ page: newPage }));
//   };

//   const handleDelete = async (id: string) => {
//     setPlanToDelete(id);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = async () => {
//     if (planToDelete) {
//       await dispatch(deleteSubscription(planToDelete));
//       setShowDeleteModal(false);
//       setPlanToDelete(null);
//     }
//   };

//   const handleToggleStatus = async (id: string) => {
//     await dispatch(toggleSubscriptionStatus(id));
//   };

//   const handleExport = () => {
//     // Implement export functionality
//     console.log('Export subscriptions');
//   };

//   const handleRefresh = () => {
//     dispatch(fetchSubscriptions());
//   };

//   const handleSelectAll = () => {
//     if (selectedPlans.length === plans.length) {
//       setSelectedPlans([]);
//     } else {
//       setSelectedPlans(plans.map(p => p.id));
//     }
//   };

//   const handleSelectPlan = (id: string) => {
//     setSelectedPlans(prev =>
//       prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
//     );
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(amount);
//   };

//   if (status === 'loading' && plans.length === 0) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   const handleClick = () => {
//     console.log('Button clicked, fetching subscriptions again...');
//     dispatch(fetchSubscriptions());
//     console.log('fetchig finished')
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             Manage all subscription plans across the platform
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleRefresh}
//             className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//             title="Refresh"
//           >
//             <RefreshCw className="h-5 w-5 text-gray-600" />
//           </button>
//           <button
//             onClick={handleExport}
//             className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//             title="Export"
//           >
//             <Download className="h-5 w-5 text-gray-600" />
//           </button>
//           <Link
//             href="/admin/subscriptions/create"
//             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             <Plus className="h-5 w-5" />
//             <span>New Plan</span>
//           </Link>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//         <div className="flex flex-col sm:flex-row gap-4">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search plans by name or code..."
//               value={searchInput}
//               onChange={(e) => setSearchInput(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <div className="flex gap-2">
//             <select
//               value={filters.status}
//               onChange={(e) => handleFilterChange('status', e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>
//             <select
//               value={filters.limit}
//               onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="10">10 per page</option>
//               <option value="25">25 per page</option>
//               <option value="50">50 per page</option>
//               <option value="100">100 per page</option>
//             </select>
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className={`p-2 border rounded-lg ${
//                 showFilters ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
//               }`}
//             >
//               <Filter className="h-5 w-5 text-gray-600" />
//             </button>
//           </div>
//         </div>

//         {/* Advanced Filters */}
//         {showFilters && (
//           <div className="mt-4 pt-4 border-t border-gray-200">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Price Range
//                 </label>
//                 <div className="flex gap-2">
//                   <input
//                     type="number"
//                     placeholder="Min"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg"
//                   />
//                   <input
//                     type="number"
//                     placeholder="Max"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Max Staff
//                 </label>
//                 <input
//                   type="number"
//                   placeholder="Min staff count"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Sort By
//                 </label>
//                 <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
//                   <option>Price: Low to High</option>
//                   <option>Price: High to Low</option>
//                   <option>Most Popular</option>
//                   <option>Newest First</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-xl p-4">
//           <div className="flex items-center gap-2 text-red-600">
//             <AlertCircle className="h-5 w-5" />
//             <p>{error}</p>
//           </div>
//         </div>
//       )}

//       {/* Bulk Actions */}
//       {selectedPlans.length > 0 && (
//         <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//           <div className="flex items-center justify-between">
//             <span className="text-sm text-blue-700">
//               {selectedPlans.length} plan(s) selected
//             </span>
//             <div className="flex gap-2">
//               <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                 Bulk Edit
//               </button>
//               <button className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
//                 Bulk Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Table */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="w-12 px-6 py-3">
//                   <input
//                     type="checkbox"
//                     checked={selectedPlans.length === plans.length && plans.length > 0}
//                     onChange={handleSelectAll}
//                     className="rounded border-gray-300"
//                   />
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Plan Details
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Pricing
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Limits
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Usage
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {plans.map((plan) => (
//                 <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-6 py-4">
//                     <input
//                       type="checkbox"
//                       checked={selectedPlans.includes(plan.id)}
//                       onChange={() => handleSelectPlan(plan.id)}
//                       className="rounded border-gray-300"
//                     />
//                   </td>
//                   <td className="px-6 py-4">
//                     <div>
//                       <div className="font-medium text-gray-900">{plan.plan_name}</div>
//                       <div className="text-sm text-gray-500">{plan.plan_code}</div>
//                       {plan.description && (
//                         <div className="text-xs text-gray-400 mt-1 line-clamp-1">
//                           {plan.description}
//                         </div>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="font-bold text-gray-900">
//                       {formatCurrency(plan.price_per_month)}
//                     </div>
//                     <div className="text-xs text-gray-500">per month</div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="space-y-1">
//                       <div className="flex items-center gap-1 text-sm">
//                         <Users className="h-3 w-3 text-gray-400" />
//                         <span>{plan.max_staff} staff</span>
//                       </div>
//                       <div className="flex items-center gap-1 text-sm">
//                         <Table className="h-3 w-3 text-gray-400" />
//                         <span>{plan.max_tables} tables</span>
//                       </div>
//                       <div className="flex items-center gap-1 text-sm">
//                         <Menu className="h-3 w-3 text-gray-400" />
//                         <span>{plan.max_menu_items} menu items</span>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div>
//                       <span className="text-lg font-semibold text-gray-900">
//                         {plan.hotels_using || 0}
//                       </span>
//                       <span className="text-sm text-gray-500 ml-1">hotels</span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     {plan.is_active ? (
//                       <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
//                         <CheckCircle className="h-3 w-3" />
//                         Active
//                       </span>
//                     ) : (
//                       <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
//                         <XCircle className="h-3 w-3" />
//                         Inactive
//                       </span>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 text-right">
//                     <div className="flex items-center justify-end gap-2">
//                       <Link
//                         href={`/admin/subscriptions/${plan.id}`}
//                         className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
//                         title="View Details"
//                       >
//                         <Eye className="h-4 w-4" />
//                       </Link>
//                       <Link
//                         href={`/admin/subscriptions/${plan.id}/edit`}
//                         className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
//                         title="Edit Plan"
//                       >
//                         <Edit className="h-4 w-4" />
//                       </Link>
//                       <button
//                         onClick={() => handleToggleStatus(plan.id)}
//                         className={`p-1 rounded ${
//                           plan.is_active
//                             ? 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
//                             : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
//                         }`}
//                         title={plan.is_active ? 'Deactivate' : 'Activate'}
//                       >
//                         {plan.is_active ? (
//                           <XCircle className="h-4 w-4" />
//                         ) : (
//                           <CheckCircle className="h-4 w-4" />
//                         )}
//                       </button>
//                       <button
//                         onClick={() => handleDelete(plan.id)}
//                         className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
//                         title="Delete Plan"
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </button>
//                       <button className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
//                         <MoreHorizontal className="h-4 w-4" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Empty State */}
//         {plans.length === 0 && (
//           <div className="p-12 text-center">
//             <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
//             <h3 className="text-lg font-medium text-gray-900 mb-1">No subscription plans</h3>
//             <p className="text-gray-500 mb-4">Get started by creating your first subscription plan</p>
//             <Link
//               href="/admin/subscriptions/create"
//               className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               <Plus className="h-5 w-5" />
//               Create Plan
//             </Link>
//           </div>
//         )}

//         {/* Pagination */}
//         {pagination && pagination.pages > 1 && (
//           <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
//             <div className="text-sm text-gray-500">
//               Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
//               {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} plans
//             </div>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => handlePageChange(pagination.page - 1)}
//                 disabled={pagination.page === 1}
//                 className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </button>
//               {[...Array(pagination.pages)].slice(0, 5).map((_, i) => {
//                 const pageNum = i + 1;
//                 return (
//                   <button
//                     key={pageNum}
//                     onClick={() => handlePageChange(pageNum)}
//                     className={`px-3 py-1 rounded-lg ${
//                       pagination.page === pageNum
//                         ? 'bg-blue-600 text-white'
//                         : 'hover:bg-gray-50'
//                     }`}
//                   >
//                     {pageNum}
//                   </button>
//                 );
//               })}
//               {pagination.pages > 5 && <span className="px-2">...</span>}
//               <button
//                 onClick={() => handlePageChange(pagination.page + 1)}
//                 disabled={pagination.page === pagination.pages}
//                 className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Delete Confirmation Modal */}
//       {showDeleteModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
//             <div className="text-center mb-6">
//               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <AlertCircle className="h-8 w-8 text-red-600" />
//               </div>
//               <h3 className="text-xl font-bold text-gray-900">Delete Subscription Plan</h3>
//               <p className="text-gray-500 mt-2">
//                 Are you sure you want to delete this subscription plan? This action cannot be undone.
//               </p>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowDeleteModal(false)}
//                 className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmDelete}
//                 className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <button onClick={handleClick} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Click</button>
//     </div>
//   );
// }



// // app/admin/subscriptions/page.tsx
// 'use client';

// import { useState, useMemo, useCallback } from 'react';
// import Link from 'next/link';
// import { useSubscriptions } from '@/hooks/useSubscription';
// import {
//   Plus,
//   Search,
//   Filter,
//   Edit,
//   Trash2,
//   Eye,
//   MoreHorizontal,
//   ChevronLeft,
//   ChevronRight,
//   Download,
//   RefreshCw,
//   AlertCircle,
//   CheckCircle,
//   XCircle,
//   DollarSign,
//   Users,
//   Table,
//   Menu,
//   Loader2
// } from 'lucide-react';
// import { debounce } from 'lodash';

// export default function SubscriptionsPage() {
//   const {
//     subscriptions,
//     pagination,
//     filters,
//     isLoading,
//     isFetching,
//     error,
//     refetch,
//     updateFilters,
//     goToPage,
//   } = useSubscriptions();

//   const [searchInput, setSearchInput] = useState(filters.search || '');
//   const [showFilters, setShowFilters] = useState(false);
//   const [selectedPlans, setSelectedPlans] = useState<string[]>([]);

//   // Debounced search to reduce API calls
//   const debouncedSearch = useMemo(
//     () => debounce((value: string) => {
//       updateFilters({ search: value });
//     }, 500),
//     [updateFilters]
//   );

//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setSearchInput(value);
//     debouncedSearch(value);
//   };

//   const handleStatusFilter = useCallback((status: string) => {
//     updateFilters({ status: status as any });
//   }, [updateFilters]);

//   const handleLimitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
//     updateFilters({ limit: parseInt(e.target.value) });
//   }, [updateFilters]);

//   const handleRefresh = useCallback(() => {
//     refetch();
//   }, [refetch]);

//   const handleSelectAll = useCallback(() => {
//     if (selectedPlans.length === subscriptions.length) {
//       setSelectedPlans([]);
//     } else {
//       setSelectedPlans(subscriptions.map(p => p.id));
//     }
//   }, [subscriptions, selectedPlans]);

//   const handleSelectPlan = useCallback((id: string) => {
//     setSelectedPlans(prev =>
//       prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
//     );
//   }, []);

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(amount);
//   };

//   if (isLoading && !subscriptions.length) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             Manage all subscription plans across the platform
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleRefresh}
//             disabled={isFetching}
//             className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
//             title="Refresh"
//           >
//             <RefreshCw className={`h-5 w-5 text-gray-600 ${isFetching ? 'animate-spin' : ''}`} />
//           </button>
//           <button
//             onClick={() => {}}
//             className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//             title="Export"
//           >
//             <Download className="h-5 w-5 text-gray-600" />
//           </button>
//           <Link
//             href="/admin/subscriptions/create"
//             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             <Plus className="h-5 w-5" />
//             <span>New Plan</span>
//           </Link>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//         <div className="flex flex-col sm:flex-row gap-4">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search plans by name or code..."
//               value={searchInput}
//               onChange={handleSearchChange}
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <div className="flex gap-2">
//             <select
//               value={filters.status || 'all'}
//               onChange={(e) => handleStatusFilter(e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>
//             <select
//               value={filters.limit || 10}
//               onChange={handleLimitChange}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="10">10 per page</option>
//               <option value="25">25 per page</option>
//               <option value="50">50 per page</option>
//               <option value="100">100 per page</option>
//             </select>
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className={`p-2 border rounded-lg ${
//                 showFilters ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
//               }`}
//             >
//               <Filter className="h-5 w-5 text-gray-600" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-xl p-4">
//           <div className="flex items-center gap-2 text-red-600">
//             <AlertCircle className="h-5 w-5" />
//             <p>Failed to load subscriptions. Please try again.</p>
//           </div>
//         </div>
//       )}

//       {/* Bulk Actions */}
//       {selectedPlans.length > 0 && (
//         <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//           <div className="flex items-center justify-between">
//             <span className="text-sm text-blue-700">
//               {selectedPlans.length} plan(s) selected
//             </span>
//             <div className="flex gap-2">
//               <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                 Bulk Edit
//               </button>
//               <button className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
//                 Bulk Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Table */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="w-12 px-6 py-3">
//                   <input
//                     type="checkbox"
//                     checked={selectedPlans.length === subscriptions.length && subscriptions.length > 0}
//                     onChange={handleSelectAll}
//                     className="rounded border-gray-300"
//                   />
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Plan Details
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Pricing
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Limits
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Usage
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {subscriptions.map((plan) => (
//                 <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-6 py-4">
//                     <input
//                       type="checkbox"
//                       checked={selectedPlans.includes(plan.id)}
//                       onChange={() => handleSelectPlan(plan.id)}
//                       className="rounded border-gray-300"
//                     />
//                   </td>
//                   <td className="px-6 py-4">
//                     <Link href={`/admin/subscriptions/${plan.id}`} className="block hover:text-blue-600">
//                       <div className="font-medium text-gray-900">{plan.plan_name}</div>
//                       <div className="text-sm text-gray-500">{plan.plan_code}</div>
//                       {plan.description && (
//                         <div className="text-xs text-gray-400 mt-1 line-clamp-1">
//                           {plan.description}
//                         </div>
//                       )}
//                     </Link>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="font-bold text-gray-900">
//                       {formatCurrency(plan.price_per_month)}
//                     </div>
//                     <div className="text-xs text-gray-500">per month</div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="space-y-1">
//                       <div className="flex items-center gap-1 text-sm">
//                         <Users className="h-3 w-3 text-gray-400" />
//                         <span>{plan.max_staff}</span>
//                       </div>
//                       <div className="flex items-center gap-1 text-sm">
//                         <Table className="h-3 w-3 text-gray-400" />
//                         <span>{plan.max_tables}</span>
//                       </div>
//                       <div className="flex items-center gap-1 text-sm">
//                         <Menu className="h-3 w-3 text-gray-400" />
//                         <span>{plan.max_menu_items}</span>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className="text-lg font-semibold text-gray-900">
//                       {plan.hotels_using || 0}
//                     </span>
//                     <span className="text-sm text-gray-500 ml-1">hotels</span>
//                   </td>
//                   <td className="px-6 py-4">
//                     {plan.is_active ? (
//                       <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
//                         <CheckCircle className="h-3 w-3" />
//                         Active
//                       </span>
//                     ) : (
//                       <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
//                         <XCircle className="h-3 w-3" />
//                         Inactive
//                       </span>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 text-right">
//                     <div className="flex items-center justify-end gap-2">
//                       <Link
//                         href={`/admin/subscriptions/${plan.id}`}
//                         className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
//                         title="View Details"
//                       >
//                         <Eye className="h-4 w-4" />
//                       </Link>
//                       <Link
//                         href={`/admin/subscriptions/${plan.id}/edit`}
//                         className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
//                         title="Edit Plan"
//                       >
//                         <Edit className="h-4 w-4" />
//                       </Link>
//                       <button className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
//                         <MoreHorizontal className="h-4 w-4" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Empty State */}
//         {subscriptions.length === 0 && !isLoading && (
//           <div className="p-12 text-center">
//             <div className="text-gray-400 mb-3">📊</div>
//             <h3 className="text-lg font-medium text-gray-900 mb-1">No subscription plans</h3>
//             <p className="text-gray-500 mb-4">Get started by creating your first subscription plan</p>
//             <Link
//               href="/admin/subscriptions/create"
//               className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               <Plus className="h-5 w-5" />
//               Create Plan
//             </Link>
//           </div>
//         )}

//         {/* Pagination */}
//         {pagination && pagination.pages > 1 && (
//           <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
//             <div className="text-sm text-gray-500">
//               Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
//               {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} plans
//             </div>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => goToPage(pagination.page - 1)}
//                 disabled={pagination.page === 1}
//                 className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </button>
//               <span className="text-sm text-gray-700">
//                 Page {pagination.page} of {pagination.pages}
//               </span>
//               <button
//                 onClick={() => goToPage(pagination.page + 1)}
//                 disabled={pagination.page === pagination.pages}
//                 className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }







'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSubscriptions, useDeleteSubscription } from '@/hooks/useSubscription';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
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
  Loader2,
  Copy,
} from 'lucide-react';
import { debounce } from 'lodash';

export default function SubscriptionsPage() {
  const router = useRouter();
  const {
    subscriptions,
    pagination,
    filters,
    isLoading,
    isFetching,
    error,
    refetch,
    updateFilters,
    goToPage,
  } = useSubscriptions();

  const { deleteSubscription, isDeleting } = useDeleteSubscription();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const actionMenuRef = useRef<HTMLTableCellElement | null>(null);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionMenu &&
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenu]);

  // Debounced search to reduce API calls
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        updateFilters({ search: value });
      }, 500),
    [updateFilters]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleStatusFilter = useCallback(
    (status: string) => {
      updateFilters({ status: status as any });
    },
    [updateFilters]
  );

  const handleLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateFilters({ limit: parseInt(e.target.value) });
    },
    [updateFilters]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSelectAll = useCallback(() => {
    if (selectedPlans.length === subscriptions.length) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans(subscriptions.map((p) => p.id));
    }
  }, [subscriptions, selectedPlans]);

  const handleSelectPlan = useCallback((id: string) => {
    setSelectedPlans((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPlanToDelete(id);
    setShowDeleteModal(true);
    setActionMenu(null);
  };

  const handleEditClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/admin/subscriptions/${id}`);
    setActionMenu(null);
  };

  const handleViewClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/admin/subscriptions/${id}`);
    setActionMenu(null);
  };

  const handleDuplicate = (plan: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const duplicateData = {
      ...plan,
      plan_name: `${plan.plan_name} (Copy)`,
      plan_code: `${plan.plan_code}_COPY`,
    };
    localStorage.setItem('duplicatePlan', JSON.stringify(duplicateData));
    router.push('/admin/subscriptions/create');
    setActionMenu(null);
  };

  const confirmDelete = async () => {
    if (planToDelete) {
      await deleteSubscription(planToDelete);
      setShowDeleteModal(false);
      setPlanToDelete(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading && !subscriptions.length) {
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
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all subscription plans across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`h-5 w-5 text-gray-600 ${isFetching ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => {}}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Export"
          >
            <Download className="h-5 w-5 text-gray-600" />
          </button>
          <Link
            href="/admin/subscriptions/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>New Plan</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans by name or code..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filters.limit || 10}
              onChange={handleLimitChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
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

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Most Popular</option>
                  <option>Newest First</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load subscriptions. Please try again.</p>
          </div>
        </div>
      )}

      {selectedPlans.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedPlans.length} plan(s) selected
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedPlans.length === subscriptions.length && subscriptions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((plan) => (
                <tr
                  key={plan.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/subscriptions/${plan.id}`)}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedPlans.includes(plan.id)}
                      onChange={() => handleSelectPlan(plan.id)}
                      className="rounded border-gray-300"
                    />
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{plan.plan_name}</div>
                      <div className="text-sm text-gray-500">{plan.plan_code}</div>
                      {plan.description && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {plan.description}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(Number(plan?.price_per_month ?? 0))}
                    </div>
                    <div className="text-xs text-gray-500">per month</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span>{plan.max_staff}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Table className="h-3 w-3 text-gray-400" />
                        <span>{plan.max_tables}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Menu className="h-3 w-3 text-gray-400" />
                        <span>{plan.max_menu_items}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <span className="text-lg font-semibold text-gray-900">
                        {plan.hotels_using || 0}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">hotels</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {plan.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>

                  <td
                    ref={actionMenu === plan.id ? actionMenuRef : null}
                    className="px-6 py-4 text-right relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleViewClick(plan.id, e)}
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={(e) => handleEditClick(plan.id, e)}
                        className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Edit Plan"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActionMenu(actionMenu === plan.id ? null : plan.id);
                        }}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {actionMenu === plan.id && (
                        <div className="absolute right-0 top-10 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={(e) => handleEditClick(plan.id, e)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Plan
                          </button>

                          <button
                            onClick={(e) => handleDuplicate(plan, e)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </button>

                          <div className="border-t border-gray-100 my-1"></div>

                          <button
                            onClick={(e) => handleDeleteClick(plan.id, e)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Plan
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subscriptions.length === 0 && !isLoading && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No subscription plans</h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first subscription plan
            </p>
            <Link
              href="/admin/subscriptions/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Create Plan
            </Link>
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} plans
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
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Subscription Plan</h3>
              <p className="text-gray-500 mt-2">
                Are you sure you want to delete this plan? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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