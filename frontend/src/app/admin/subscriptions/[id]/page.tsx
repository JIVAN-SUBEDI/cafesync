// // app/admin/subscriptions/[id]/edit/page.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter, useParams } from 'next/navigation';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/store';
// import {
//   fetchSubscriptionById,
//   updateSubscription,
//   clearCurrentPlan
// } from '@/store/slices/adminSubscription';
// import {
//   Save,
//   ArrowLeft,
//   AlertCircle,
//   CheckCircle,
//   Users,
//   Table,
//   Menu,
//   DollarSign,
//   Loader2
// } from 'lucide-react';
// import Link from 'next/link';

// export default function EditSubscriptionPage() {
//   const router = useRouter();
//   const params = useParams();
//   const id = params.id as string;
//   console.log('this is the id:- ', id)
//   const dispatch = useDispatch<AppDispatch>();

//   const { currentPlan, status, actionStatus, error } = useSelector(
//     (state: RootState) => state.adminSubscription
//   );

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [formData, setFormData] = useState({
//     plan_name: '',
//     plan_code: '',
//     description: '',
//     price_per_month: '',
//     max_staff: '',
//     max_tables: '',
//     max_menu_items: '',
//     display_order: '',
//     is_active: true,
//     features: {} as Record<string, boolean>
//   });

//   useEffect(() => {
//     if (id) {
//       dispatch(fetchSubscriptionById(id));
//     }

//     return () => {
//       dispatch(clearCurrentPlan());
//     };
//   }, [dispatch, id]);

//   useEffect(() => {
//     if (currentPlan) {
//       setFormData({
//         plan_name: currentPlan.plan_name || '',
//         plan_code: currentPlan.plan_code || '',
//         description: currentPlan.description || '',
//         price_per_month: currentPlan.price_per_month?.toString() || '',
//         max_staff: currentPlan.max_staff?.toString() || '5',
//         max_tables: currentPlan.max_tables?.toString() || '10',
//         max_menu_items: currentPlan.max_menu_items?.toString() || '50',
//         display_order: currentPlan.display_order?.toString() || '0',
//         is_active: currentPlan.is_active,
//         features: currentPlan.features || {}
//       });
//     }
//   }, [currentPlan]);

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.plan_name.trim()) {
//       newErrors.plan_name = 'Plan name is required';
//     }

//     if (!formData.plan_code.trim()) {
//       newErrors.plan_code = 'Plan code is required';
//     } else if (!/^[A-Z0-9_]+$/.test(formData.plan_code)) {
//       newErrors.plan_code = 'Plan code must contain only uppercase letters, numbers, and underscores';
//     }

//     if (!formData.price_per_month) {
//       newErrors.price_per_month = 'Price is required';
//     } else if (parseFloat(formData.price_per_month) < 0) {
//       newErrors.price_per_month = 'Price cannot be negative';
//     }

//     if (parseInt(formData.max_staff) < 1) {
//       newErrors.max_staff = 'Max staff must be at least 1';
//     }

//     if (parseInt(formData.max_tables) < 1) {
//       newErrors.max_tables = 'Max tables must be at least 1';
//     }

//     if (parseInt(formData.max_menu_items) < 1) {
//       newErrors.max_menu_items = 'Max menu items must be at least 1';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;

//     setIsSubmitting(true);
//     try {
//       const result = await dispatch(updateSubscription({
//         id,
//         data: formData
//       })).unwrap();
      
//       if (result.success) {
//         router.push(`/admin/subscriptions/${id}`);
//       }
//     } catch (error) {
//       console.error('Failed to update subscription:', error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
//     }));
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handleFeatureChange = (feature: string, checked: boolean) => {
//     setFormData(prev => ({
//       ...prev,
//       features: {
//         ...prev.features,
//         [feature]: checked
//       }
//     }));
//   };

//   if (status === 'loading' || !currentPlan) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-4">
//         <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
//           <div className="flex items-center gap-3 text-red-600 mb-4">
//             <AlertCircle className="h-8 w-8" />
//             <h2 className="text-xl font-semibold">Error Loading Plan</h2>
//           </div>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <button
//             onClick={() => router.push('/admin/subscriptions')}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
//           >
//             Back to Subscriptions
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center gap-4">
//         <Link
//           href={`/admin/subscriptions/${id}`}
//           className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//         >
//           <ArrowLeft className="h-5 w-5" />
//         </Link>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Edit Subscription Plan</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             Update plan details for {currentPlan.plan_name}
//           </p>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Basic Information */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Plan Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 name="plan_name"
//                 value={formData.plan_name}
//                 onChange={handleChange}
//                 className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   errors.plan_name ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {errors.plan_name && (
//                 <p className="mt-1 text-xs text-red-500">{errors.plan_name}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Plan Code <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 name="plan_code"
//                 value={formData.plan_code}
//                 onChange={handleChange}
//                 className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   errors.plan_code ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {errors.plan_code && (
//                 <p className="mt-1 text-xs text-red-500">{errors.plan_code}</p>
//               )}
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Description
//               </label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 rows={3}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Pricing */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
//           <div className="max-w-xs">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Price per Month <span className="text-red-500">*</span>
//             </label>
//             <div className="relative">
//               <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="number"
//                 name="price_per_month"
//                 value={formData.price_per_month}
//                 onChange={handleChange}
//                 step="0.01"
//                 min="0"
//                 className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   errors.price_per_month ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//             </div>
//             {errors.price_per_month && (
//               <p className="mt-1 text-xs text-red-500">{errors.price_per_month}</p>
//             )}
//           </div>
//         </div>

//         {/* Limits */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Limits</h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <Users className="inline h-4 w-4 mr-1" />
//                 Max Staff
//               </label>
//               <input
//                 type="number"
//                 name="max_staff"
//                 value={formData.max_staff}
//                 onChange={handleChange}
//                 min="1"
//                 className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   errors.max_staff ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {errors.max_staff && (
//                 <p className="mt-1 text-xs text-red-500">{errors.max_staff}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <Table className="inline h-4 w-4 mr-1" />
//                 Max Tables
//               </label>
//               <input
//                 type="number"
//                 name="max_tables"
//                 value={formData.max_tables}
//                 onChange={handleChange}
//                 min="1"
//                 className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   errors.max_tables ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {errors.max_tables && (
//                 <p className="mt-1 text-xs text-red-500">{errors.max_tables}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <Menu className="inline h-4 w-4 mr-1" />
//                 Max Menu Items
//               </label>
//               <input
//                 type="number"
//                 name="max_menu_items"
//                 value={formData.max_menu_items}
//                 onChange={handleChange}
//                 min="1"
//                 className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   errors.max_menu_items ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {errors.max_menu_items && (
//                 <p className="mt-1 text-xs text-red-500">{errors.max_menu_items}</p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Features */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {formData.features && Object.entries(formData.features).map(([key, value]) => (
//               <label key={key} className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={value}
//                   onChange={(e) => handleFeatureChange(key, e.target.checked)}
//                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="text-sm text-gray-700 capitalize">
//                   {key.replace(/_/g, ' ')}
//                 </span>
//               </label>
//             ))}
//           </div>
//         </div>

//         {/* Settings */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Display Order
//               </label>
//               <input
//                 type="number"
//                 name="display_order"
//                 value={formData.display_order}
//                 onChange={handleChange}
//                 min="0"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Status
//               </label>
//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   name="is_active"
//                   checked={formData.is_active}
//                   onChange={handleChange}
//                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="text-sm text-gray-700">Active (available for selection)</span>
//               </label>
//             </div>
//           </div>
//         </div>

//         {/* Submit Buttons */}
//         <div className="flex justify-end gap-3">
//           <Link
//             href={`/admin/subscriptions/${id}`}
//             className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             Cancel
//           </Link>
//           <button
//             type="submit"
//             disabled={isSubmitting || actionStatus === 'loading'}
//             className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
//           >
//             {isSubmitting ? (
//               <>
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 Saving...
//               </>
//             ) : (
//               <>
//                 <Save className="h-4 w-4" />
//                 Save Changes
//               </>
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }










// // app/admin/subscriptions/[id]/page.tsx
// 'use client';

// import { useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { useSubscription } from '@/hooks/useSubscription';
// import {
//   ArrowLeft,
//   Edit,
//   Trash2,
//   CheckCircle,
//   XCircle,
//   DollarSign,
//   Users,
//   Table,
//   Menu,
//   Calendar,
//   Building2,
//   Clock,
//   Shield,
//   Activity,
//   Download,
//   Mail,
//   Phone,
//   MapPin,
//   MoreVertical,
//   AlertCircle,
//   RefreshCw,
//   ChevronRight,
//   Star,
//   TrendingUp,
//   Package,
//   Loader2
// } from 'lucide-react';

// export default function SubscriptionDetailPage() {
//   const router = useRouter();
//   const params = useParams();
//   const id = params.id as string;
  
//   const {
//     subscription,
//     isLoading,
//     error,
//     isDeleting,
//     isToggling,
//     showDeleteModal,
//     setShowDeleteModal,
//     handleDelete,
//     handleToggleStatus,
//     refetch,
//   } = useSubscription(id);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//       </div>
//     );
//   }

//   if (error || !subscription) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-4">
//         <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
//           <div className="flex items-center gap-3 text-red-600 mb-4">
//             <AlertCircle className="h-8 w-8" />
//             <h2 className="text-xl font-semibold">Error Loading Plan</h2>
//           </div>
//           <p className="text-gray-600 mb-6">Failed to load subscription details</p>
//           <button
//             onClick={() => router.push('/admin/subscriptions')}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
//           >
//             Back to Subscriptions
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(amount);
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <Link
//             href="/admin/subscriptions"
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <ArrowLeft className="h-5 w-5" />
//           </Link>
//           <div>
//             <div className="flex items-center gap-3">
//               <h1 className="text-2xl font-bold text-gray-900">{subscription.plan_name}</h1>
//               {subscription.is_active ? (
//                 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
//                   <CheckCircle className="h-3 w-3" />
//                   Active
//                 </span>
//               ) : (
//                 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
//                   <XCircle className="h-3 w-3" />
//                   Inactive
//                 </span>
//               )}
//             </div>
//             <div className="flex items-center gap-2 mt-1">
//               <span className="text-sm text-gray-500">Code: {subscription.plan_code}</span>
//               <span className="text-gray-300">•</span>
//               <span className="text-sm text-gray-500">Created: {formatDate(subscription.created_at)}</span>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleToggleStatus}
//             disabled={isToggling}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
//               subscription.is_active
//                 ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
//                 : 'border-green-300 text-green-700 hover:bg-green-50'
//             } disabled:opacity-50`}
//           >
//             {isToggling ? (
//               <Loader2 className="h-4 w-4 animate-spin" />
//             ) : subscription.is_active ? (
//               <>
//                 <XCircle className="h-4 w-4" />
//                 Deactivate
//               </>
//             ) : (
//               <>
//                 <CheckCircle className="h-4 w-4" />
//                 Activate
//               </>
//             )}
//           </button>

//           <Link
//             href={`/admin/subscriptions/${id}/edit`}
//             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             <Edit className="h-4 w-4" />
//             Edit Plan
//           </Link>

//           <button
//             onClick={() => setShowDeleteModal(true)}
//             disabled={isDeleting}
//             className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
//           >
//             <Trash2 className="h-5 w-5 text-gray-600" />
//           </button>

//           <button
//             onClick={() => refetch()}
//             className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//             title="Refresh"
//           >
//             <RefreshCw className="h-5 w-5 text-gray-600" />
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-blue-100 rounded-lg">
//               <DollarSign className="h-5 w-5 text-blue-600" />
//             </div>
//             <span className="text-sm text-gray-600">Monthly Price</span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900">{formatCurrency(subscription.price_per_month)}</p>
//           <p className="text-xs text-gray-500 mt-1">per month</p>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-green-100 rounded-lg">
//               <Building2 className="h-5 w-5 text-green-600" />
//             </div>
//             <span className="text-sm text-gray-600">Hotels Using</span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900">{subscription.hotels_using || 0}</p>
//           <p className="text-xs text-gray-500 mt-1">active subscriptions</p>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-purple-100 rounded-lg">
//               <Users className="h-5 w-5 text-purple-600" />
//             </div>
//             <span className="text-sm text-gray-600">Staff Limit</span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900">{subscription.max_staff}</p>
//           <p className="text-xs text-gray-500 mt-1">max employees</p>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-orange-100 rounded-lg">
//               <Table className="h-5 w-5 text-orange-600" />
//             </div>
//             <span className="text-sm text-gray-600">Table Limit</span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900">{subscription.max_tables}</p>
//           <p className="text-xs text-gray-500 mt-1">max tables</p>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-pink-100 rounded-lg">
//               <Menu className="h-5 w-5 text-pink-600" />
//             </div>
//             <span className="text-sm text-gray-600">Menu Items</span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900">{subscription.max_menu_items}</p>
//           <p className="text-xs text-gray-500 mt-1">max items</p>
//         </div>
//       </div>

//       {/* Plan Details */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Main Info */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Description */}
//           {subscription.description && (
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//               <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
//               <p className="text-gray-600">{subscription.description}</p>
//             </div>
//           )}

//           {/* Features */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {subscription.features && Object.entries(subscription.features).map(([key, value]) => (
//                 <div key={key} className="flex items-center gap-2">
//                   {value ? (
//                     <CheckCircle className="h-5 w-5 text-green-500" />
//                   ) : (
//                     <XCircle className="h-5 w-5 text-gray-300" />
//                   )}
//                   <span className="text-sm text-gray-700 capitalize">
//                     {key.replace(/_/g, ' ')}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Hotels Using This Plan */}
//           {subscription.hotels && subscription.hotels.length > 0 && (
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900">Hotels Using This Plan</h3>
//                 <button
//                   onClick={() => {}}
//                   className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
//                 >
//                   <Download className="h-4 w-4" />
//                   Export
//                 </button>
//               </div>
//               <div className="space-y-3">
//                 {subscription.hotels.slice(0, 5).map((hotel) => (
//                   <Link
//                     key={hotel.id}
//                     href={`/admin/hotels/${hotel.id}`}
//                     className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                         <Building2 className="h-5 w-5 text-blue-600" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-900">{hotel.hotel_name}</p>
//                         <p className="text-xs text-gray-500">
//                           Since {new Date(hotel.created_at).toLocaleDateString()}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                         hotel.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
//                         hotel.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' :
//                         'bg-gray-100 text-gray-800'
//                       }`}>
//                         {hotel.subscription_status}
//                       </span>
//                       <ChevronRight className="h-4 w-4 text-gray-400" />
//                     </div>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Sidebar */}
//         <div className="space-y-6">
//           {/* Plan Metadata */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Information</h3>
//             <dl className="space-y-3">
//               <div>
//                 <dt className="text-sm text-gray-500">Plan ID</dt>
//                 <dd className="text-sm font-medium text-gray-900 mt-1">{subscription.id}</dd>
//               </div>
//               <div>
//                 <dt className="text-sm text-gray-500">Plan Code</dt>
//                 <dd className="text-sm font-medium text-gray-900 mt-1">{subscription.plan_code}</dd>
//               </div>
//               <div>
//                 <dt className="text-sm text-gray-500">Display Order</dt>
//                 <dd className="text-sm font-medium text-gray-900 mt-1">{subscription.display_order}</dd>
//               </div>
//               <div>
//                 <dt className="text-sm text-gray-500">Created At</dt>
//                 <dd className="text-sm font-medium text-gray-900 mt-1">
//                   {new Date(subscription.created_at).toLocaleString()}
//                 </dd>
//               </div>
//             </dl>
//           </div>

//           {/* Usage Stats */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
//             <div className="space-y-4">
//               <div>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span className="text-gray-600">Staff Usage</span>
//                   <span className="font-medium text-gray-900">0 / {subscription.max_staff}</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
//                 </div>
//               </div>
//               <div>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span className="text-gray-600">Table Usage</span>
//                   <span className="font-medium text-gray-900">0 / {subscription.max_tables}</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
//                 </div>
//               </div>
//               <div>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span className="text-gray-600">Menu Items Usage</span>
//                   <span className="font-medium text-gray-900">0 / {subscription.max_menu_items}</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
//             <div className="space-y-2">
//               <Link
//                 href={`/admin/subscriptions/${id}/edit`}
//                 className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
//               >
//                 <Edit className="h-4 w-4" />
//                 Edit Plan Details
//               </Link>
//               <button
//                 onClick={handleToggleStatus}
//                 className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
//               >
//                 {subscription.is_active ? (
//                   <>
//                     <XCircle className="h-4 w-4" />
//                     Deactivate Plan
//                   </>
//                 ) : (
//                   <>
//                     <CheckCircle className="h-4 w-4" />
//                     Activate Plan
//                   </>
//                 )}
//               </button>
//               <button
//                 onClick={() => setShowDeleteModal(true)}
//                 className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//               >
//                 <Trash2 className="h-4 w-4" />
//                 Delete Plan
//               </button>
//             </div>
//           </div>
//         </div>
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
//                 Are you sure you want to delete "{subscription.plan_name}"? This action cannot be undone.
//                 {subscription.hotels_using && subscription.hotels_using > 0 && (
//                   <span className="block mt-2 text-yellow-600">
//                     Warning: {subscription.hotels_using} hotel(s) are currently using this plan.
//                   </span>
//                 )}
//               </p>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowDeleteModal(false)}
//                 className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                 disabled={isDeleting}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDelete}
//                 disabled={isDeleting}
//                 className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
//               >
//                 {isDeleting ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Deleting...
//                   </>
//                 ) : (
//                   'Delete Plan'
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }















// app/admin/subscriptions/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Table,
  Menu,
  DollarSign,
  Loader2,
  HelpCircle
} from 'lucide-react';

interface FormData {
  plan_name: string;
  plan_code: string;
  description: string;
  price_per_month: string;
  max_staff: string;
  max_tables: string;
  max_menu_items: string;
  display_order: string;
  is_active: boolean;
  features: Record<string, boolean>;
}

export default function EditSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { subscription, isLoading, handleUpdate, isUpdating } = useSubscription(id);
  
  const [formData, setFormData] = useState<FormData>({
    plan_name: '',
    plan_code: '',
    description: '',
    price_per_month: '',
    max_staff: '5',
    max_tables: '10',
    max_menu_items: '50',
    display_order: '0',
    is_active: true,
    features: {
      online_ordering: true,
      basic_reports: true,
      email_support: true,
      table_reservations: false,
      advanced_reports: false,
      priority_support: false,
      multi_branch: false,
      custom_branding: false,
      api_access: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load subscription data
  useEffect(() => {
    if (subscription) {
      setFormData({
        plan_name: subscription.plan_name || '',
        plan_code: subscription.plan_code || '',
        description: subscription.description || '',
        price_per_month: subscription.price_per_month?.toString() || '',
        max_staff: subscription.max_staff?.toString() || '5',
        max_tables: subscription.max_tables?.toString() || '10',
        max_menu_items: subscription.max_menu_items?.toString() || '50',
        display_order: subscription.display_order?.toString() || '0',
        is_active: subscription.is_active,
        features: subscription.features || formData.features
      });
    }
  }, [subscription]);

  // Validation
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'plan_name':
        return !value ? 'Plan name is required' : 
               value.length < 3 ? 'Plan name must be at least 3 characters' : '';
      case 'plan_code':
        if (!value) return 'Plan code is required';
        if (!/^[A-Z0-9_]+$/.test(value)) 
          return 'Plan code must contain only uppercase letters, numbers, and underscores';
        return '';
      case 'price_per_month':
        if (!value) return 'Price is required';
        const price = parseFloat(value);
        if (isNaN(price)) return 'Price must be a number';
        if (price < 0) return 'Price cannot be negative';
        return '';
      case 'max_staff':
      case 'max_tables':
      case 'max_menu_items':
        const num = parseInt(value);
        if (isNaN(num)) return 'Must be a number';
        if (num < 1) return 'Must be at least 1';
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(key => {
      if (key !== 'description' && key !== 'features' && key !== 'is_active') {
        const error = validateField(key, formData[key as keyof FormData]);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: checked
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      const allTouched: Record<string, boolean> = {};
      Object.keys(formData).forEach(key => {
        if (key !== 'description' && key !== 'features') {
          allTouched[key] = true;
        }
      });
      setTouched(allTouched);
      return;
    }

    try {
      const result = await handleUpdate(formData);
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Plan Not Found</h2>
          </div>
          <p className="text-gray-600 mb-6">The subscription plan you're trying to edit doesn't exist.</p>
          <Link
            href="/admin/subscriptions"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Back to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/subscriptions/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Subscription Plan</h1>
            <p className="text-sm text-gray-500 mt-1">
              Update details for {subscription.plan_name}
            </p>
          </div>
        </div>

        {/* Save Status */}
        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span>Changes saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plan_name"
                value={formData.plan_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.plan_name && touched.plan_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.plan_name && touched.plan_name && (
                <p className="mt-1 text-xs text-red-500">{errors.plan_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plan_code"
                value={formData.plan_code}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.plan_code && touched.plan_code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., PREMIUM_2024"
              />
              {errors.plan_code && touched.plan_code && (
                <p className="mt-1 text-xs text-red-500">{errors.plan_code}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the plan features and benefits..."
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Month <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                name="price_per_month"
                value={formData.price_per_month}
                onChange={handleChange}
                onBlur={handleBlur}
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price_per_month && touched.price_per_month ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.price_per_month && touched.price_per_month && (
              <p className="mt-1 text-xs text-red-500">{errors.price_per_month}</p>
            )}
          </div>
        </div>

        {/* Limits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="inline h-4 w-4 mr-1" />
                Max Staff
              </label>
              <input
                type="number"
                name="max_staff"
                value={formData.max_staff}
                onChange={handleChange}
                onBlur={handleBlur}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.max_staff && touched.max_staff ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.max_staff && touched.max_staff && (
                <p className="mt-1 text-xs text-red-500">{errors.max_staff}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Table className="inline h-4 w-4 mr-1" />
                Max Tables
              </label>
              <input
                type="number"
                name="max_tables"
                value={formData.max_tables}
                onChange={handleChange}
                onBlur={handleBlur}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.max_tables && touched.max_tables ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.max_tables && touched.max_tables && (
                <p className="mt-1 text-xs text-red-500">{errors.max_tables}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Menu className="inline h-4 w-4 mr-1" />
                Max Menu Items
              </label>
              <input
                type="number"
                name="max_menu_items"
                value={formData.max_menu_items}
                onChange={handleChange}
                onBlur={handleBlur}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.max_menu_items && touched.max_menu_items ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.max_menu_items && touched.max_menu_items && (
                <p className="mt-1 text-xs text-red-500">{errors.max_menu_items}</p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Features</h2>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <HelpCircle className="h-3 w-3" />
              <span>Check all features included in this plan</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(formData.features).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleFeatureChange(key, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                name="display_order"
                value={formData.display_order}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === true}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === false}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Inactive</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/subscriptions/${id}`}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-w-[120px] justify-center"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}