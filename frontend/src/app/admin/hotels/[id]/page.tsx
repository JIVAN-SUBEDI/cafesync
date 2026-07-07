// // app/admin/hotels/[id]/page.tsx
// 'use client';

// import { useParams } from 'next/navigation';
// import Link from 'next/link';
// import { useGetHotelByIdQuery } from '@/store/api/hotelApi';
// import {
//   Building2,
//   ArrowLeft,
//   Edit,
//   Mail,
//   Phone,
//   MapPin,
//   Globe,
//   Calendar,
//   Users,
//   Table,
//   Menu,
//   DollarSign,
//   CreditCard,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Loader2,
//   AlertCircle,
//   Activity,
//   ShoppingCart,
//   TrendingUp,
//   RefreshCw
// } from 'lucide-react';

// export default function HotelDetailPage() {
//   const params = useParams();
//   const id = params.id as string;

//   const { data, isLoading, error } = useGetHotelByIdQuery(id);

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//     }).format(amount);
//   };

//   const formatDate = (dateString: string | null) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   const getStatusBadge = (isActive: boolean) => {
//     return isActive ? (
//       <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
//         <CheckCircle className="h-4 w-4" />
//         Active
//       </span>
//     ) : (
//       <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
//         <XCircle className="h-4 w-4" />
//         Inactive
//       </span>
//     );
//   };

//   const getVerifiedBadge = (isVerified: boolean) => {
//     return isVerified ? (
//       <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
//         <CheckCircle className="h-4 w-4" />
//         Verified
//       </span>
//     ) : (
//       <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
//         <Clock className="h-4 w-4" />
//         Pending Verification
//       </span>
//     );
//   };

//   const getSubscriptionBadge = (status: string) => {
//     const styles: Record<string, string> = {
//       active: 'bg-green-100 text-green-800',
//       trial: 'bg-blue-100 text-blue-800',
//       suspended: 'bg-yellow-100 text-yellow-800',
//       cancelled: 'bg-red-100 text-red-800',
//     };
//     return (
//       <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
//         {status}
//       </span>
//     );
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//       </div>
//     );
//   }

//   if (error || !data?.data) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-4">
//         <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
//           <div className="flex items-center gap-3 text-red-600 mb-4">
//             <AlertCircle className="h-8 w-8" />
//             <h2 className="text-xl font-semibold">Error Loading Hotel</h2>
//           </div>
//           <p className="text-gray-600 mb-6">Failed to load hotel details</p>
//           <Link
//             href="/admin/hotels"
//             className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
//           >
//             Back to Hotels
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const hotel = data.data;

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <Link
//             href="/admin/hotels"
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <ArrowLeft className="h-5 w-5" />
//           </Link>
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">{hotel.hotelName}</h1>
//             <p className="text-sm text-gray-500 mt-1">{hotel.hotelSlug}</p>
//           </div>
//         </div>

//         <Link
//           href={`/admin/hotels/${hotel.id}/edit`}
//           className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           <Edit className="h-4 w-4" />
//           Edit Hotel
//         </Link>
//       </div>

//       {/* Status Badges */}
//       <div className="flex flex-wrap gap-3">
//         {getStatusBadge(hotel.status.isActive)}
//         {getVerifiedBadge(hotel.status.isVerified)}
//         {getSubscriptionBadge(hotel.subscription.status)}
//       </div>

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left Column - Hotel Info */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Hotel Details Card */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-lg font-semibold text-gray-900 mb-4">Hotel Information</h2>
//             <div className="space-y-4">
//               <div className="flex items-start gap-3">
//                 <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
//                 <div>
//                   <p className="text-sm text-gray-500">Hotel Name</p>
//                   <p className="text-gray-900 font-medium">{hotel.hotelName}</p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
//                 <div>
//                   <p className="text-sm text-gray-500">Address</p>
//                   <p className="text-gray-900">{hotel.contact.address || 'No address provided'}</p>
//                   <p className="text-gray-600">
//                     {hotel.contact.city}, {hotel.contact.country}
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
//                 <div className="grid grid-cols-2 gap-4 flex-1">
//                   <div>
//                     <p className="text-sm text-gray-500">Timezone</p>
//                     <p className="text-gray-900">{hotel.contact.timezone}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Currency</p>
//                     <p className="text-gray-900">{hotel.contact.currency}</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
//                 <div className="grid grid-cols-2 gap-4 flex-1">
//                   <div>
//                     <p className="text-sm text-gray-500">Tax Rate</p>
//                     <p className="text-gray-900">{(hotel.contact.tax_rate * 100).toFixed(1)}%</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Service Charge</p>
//                     <p className="text-gray-900">{(hotel.contact.service_charge * 100).toFixed(1)}%</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Admin Details Card */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Information</h2>
//             <div className="space-y-4">
//               <div className="flex items-start gap-3">
//                 <Users className="h-5 w-5 text-gray-400 mt-0.5" />
//                 <div>
//                   <p className="text-sm text-gray-500">Name</p>
//                   <p className="text-gray-900 font-medium">{hotel.admin.name}</p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
//                 <div>
//                   <p className="text-sm text-gray-500">Email</p>
//                   <p className="text-gray-900">{hotel.admin.email}</p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
//                 <div>
//                   <p className="text-sm text-gray-500">Phone</p>
//                   <p className="text-gray-900">{hotel.admin.phone || 'No phone provided'}</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Usage Stats Card */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div className="bg-gray-50 rounded-lg p-4 text-center">
//                 <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
//                 <p className="text-2xl font-bold text-gray-900">{hotel.usage.staffCount}</p>
//                 <p className="text-sm text-gray-600">Staff</p>
//                 <p className="text-xs text-gray-400">of {hotel.limits.maxStaffAllowed}</p>
//               </div>

//               <div className="bg-gray-50 rounded-lg p-4 text-center">
//                 <Table className="h-6 w-6 text-green-600 mx-auto mb-2" />
//                 <p className="text-2xl font-bold text-gray-900">{hotel.usage.tableCount}</p>
//                 <p className="text-sm text-gray-600">Tables</p>
//                 <p className="text-xs text-gray-400">of {hotel.limits.maxTablesAllowed}</p>
//               </div>

//               <div className="bg-gray-50 rounded-lg p-4 text-center">
//                 <Menu className="h-6 w-6 text-purple-600 mx-auto mb-2" />
//                 <p className="text-2xl font-bold text-gray-900">{hotel.usage.menuCount}</p>
//                 <p className="text-sm text-gray-600">Menu Items</p>
//                 <p className="text-xs text-gray-400">of {hotel.limits.maxMenuItemsAllowed}</p>
//               </div>

//               <div className="bg-gray-50 rounded-lg p-4 text-center">
//                 <ShoppingCart className="h-6 w-6 text-orange-600 mx-auto mb-2" />
//                 <p className="text-2xl font-bold text-gray-900">{hotel.usage.totalOrders}</p>
//                 <p className="text-sm text-gray-600">Orders</p>
//               </div>
//             </div>

//             {/* Revenue Card */}
//             <div className="mt-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-sm opacity-90">Total Revenue</span>
//                 <TrendingUp className="h-4 w-4 opacity-90" />
//               </div>
//               <p className="text-3xl font-bold">{formatCurrency(hotel.usage.totalRevenue)}</p>
//               <p className="text-xs opacity-75 mt-1">
//                 Last order: {formatDate(hotel.usage.lastOrderDate)}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Right Column - Subscription & Activity */}
//         <div className="space-y-6">
//           {/* Subscription Card */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
            
//             <div className="space-y-4">
//               <div>
//                 <p className="text-sm text-gray-500 mb-1">Plan</p>
//                 <p className="text-lg font-semibold text-gray-900">{hotel.subscription.planName}</p>
//                 <p className="text-sm text-gray-500">{hotel.subscription.planCode}</p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500 mb-1">Price</p>
//                 <p className="text-2xl font-bold text-blue-600">
//                   {formatCurrency(hotel.subscription.pricePerMonth)}
//                   <span className="text-sm font-normal text-gray-500 ml-1">/month</span>
//                 </p>
//               </div>

//               <div className="border-t border-gray-100 pt-4">
//                 <div className="space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-600">Status</span>
//                     <span className="font-medium capitalize">{hotel.subscription.status}</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-600">Start Date</span>
//                     <span className="font-medium">{formatDate(hotel.subscription.startDate)}</span>
//                   </div>
//                   {hotel.subscription.endDate && (
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">End Date</span>
//                       <span className="font-medium">{formatDate(hotel.subscription.endDate)}</span>
//                     </div>
//                   )}
//                   {hotel.subscription.trialEndsAt && (
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">Trial Ends</span>
//                       <span className="font-medium">{formatDate(hotel.subscription.trialEndsAt)}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Limits Card */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-lg font-semibold text-gray-900 mb-4">Resource Limits</h2>
            
//             <div className="space-y-4">
//               <div>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span className="text-gray-600">Staff</span>
//                   <span className="font-medium text-gray-900">
//                     {hotel.usage.staffCount} / {hotel.limits.maxStaffAllowed}
//                   </span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-blue-600 h-2 rounded-full"
//                     style={{ width: `${(hotel.usage.staffCount / hotel.limits.maxStaffAllowed) * 100}%` }}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span className="text-gray-600">Tables</span>
//                   <span className="font-medium text-gray-900">
//                     {hotel.usage.tableCount} / {hotel.limits.maxTablesAllowed}
//                   </span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-green-600 h-2 rounded-full"
//                     style={{ width: `${(hotel.usage.tableCount / hotel.limits.maxTablesAllowed) * 100}%` }}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span className="text-gray-600">Menu Items</span>
//                   <span className="font-medium text-gray-900">
//                     {hotel.usage.menuCount} / {hotel.limits.maxMenuItemsAllowed}
//                   </span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-purple-600 h-2 rounded-full"
//                     style={{ width: `${(hotel.usage.menuCount / hotel.limits.maxMenuItemsAllowed) * 100}%` }}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Activity Card */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
            
//             <div className="space-y-3">
//               <div className="flex items-center gap-2 text-sm">
//                 <Clock className="h-4 w-4 text-gray-400" />
//                 <span className="text-gray-600">Last Login:</span>
//                 <span className="font-medium text-gray-900 ml-auto">
//                   {formatDate(hotel.activity.lastLogin)}
//                 </span>
//               </div>
              
//               <div className="flex items-center gap-2 text-sm">
//                 <Calendar className="h-4 w-4 text-gray-400" />
//                 <span className="text-gray-600">Created:</span>
//                 <span className="font-medium text-gray-900 ml-auto">
//                   {formatDate(hotel.activity.createdAt)}
//                 </span>
//               </div>
              
//               <div className="flex items-center gap-2 text-sm">
//                 <RefreshCw className="h-4 w-4 text-gray-400" />
//                 <span className="text-gray-600">Updated:</span>
//                 <span className="font-medium text-gray-900 ml-auto">
//                   {formatDate(hotel.activity.updatedAt)}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Quick Actions Card */}
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
//             <div className="space-y-2">
//               <Link
//                 href={`/admin/hotels/${hotel.id}/edit`}
//                 className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
//               >
//                 <Edit className="h-4 w-4" />
//                 Edit Hotel Details
//               </Link>
              
//               <Link
//                 href={`/admin/hotels/${hotel.id}/staff`}
//                 className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
//               >
//                 <Users className="h-4 w-4" />
//                 Manage Staff
//               </Link>
              
//               <Link
//                 href={`/admin/hotels/${hotel.id}/orders`}
//                 className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
//               >
//                 <ShoppingCart className="h-4 w-4" />
//                 View Orders
//               </Link>
              
//               <Link
//                 href={`/admin/hotels/${hotel.id}/subscription`}
//                 className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
//               >
//                 <CreditCard className="h-4 w-4" />
//                 Manage Subscription
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// app/admin/hotels/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGetHotelByIdQuery } from '@/store/api/hotelApi';
import { useHotelFromUrl } from './useHotelFromUrl';
import {
  Building2,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Users,
  Table,
  Menu,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Activity,
  ShoppingCart,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function HotelDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  // Try to get hotel data from URL first
  const passedHotelData = useHotelFromUrl();
  
  // Only fetch if we don't have data from URL
  const { data, isLoading, error } = useGetHotelByIdQuery(id, {
    skip: !!passedHotelData, // Skip API call if we have data from URL
  });
  
  // Use passed data if available, otherwise use API data
  const hotel = passedHotelData || data?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
        <CheckCircle className="h-4 w-4" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
        <XCircle className="h-4 w-4" />
        Inactive
      </span>
    );
  };

  const getVerifiedBadge = (isVerified: boolean) => {
    return isVerified ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
        <CheckCircle className="h-4 w-4" />
        Verified
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
        <Clock className="h-4 w-4" />
        Pending Verification
      </span>
    );
  };

  const getSubscriptionBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // Show loading only if we're fetching from API and don't have passed data
  if ((isLoading && !passedHotelData) || (!hotel && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if ((error || !hotel) && !passedHotelData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Error Loading Hotel</h2>
          </div>
          <p className="text-gray-600 mb-6">Failed to load hotel details</p>
          <Link
            href="/admin/hotels"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Back to Hotels
          </Link>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/hotels"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{hotel.hotelName}</h1>
            <p className="text-sm text-gray-500 mt-1">{hotel.hotelSlug}</p>
          </div>
        </div>

        <Link
          href={{
            pathname: `/admin/hotels/${hotel.id}/edit`,
            query: { data: JSON.stringify(hotel) }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="h-4 w-4" />
          Edit Hotel
        </Link>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3">
        {getStatusBadge(hotel.status.isActive)}
        {getVerifiedBadge(hotel.status.isVerified)}
        {getSubscriptionBadge(hotel.subscription.status)}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Hotel Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hotel Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hotel Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Hotel Name</p>
                  <p className="text-gray-900 font-medium">{hotel.hotelName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">{hotel.contact.address || 'No address provided'}</p>
                  <p className="text-gray-600">
                    {hotel.contact.city}, {hotel.contact.country}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <p className="text-sm text-gray-500">Timezone</p>
                    <p className="text-gray-900">{hotel.contact.timezone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Currency</p>
                    <p className="text-gray-900">{hotel.contact.currency}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <p className="text-sm text-gray-500">Tax Rate</p>
                    <p className="text-gray-900">{(hotel.contact.tax_rate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Charge</p>
                    <p className="text-gray-900">{(hotel.contact.service_charge * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-900 font-medium">{hotel.admin.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{hotel.admin.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{hotel.admin.phone || 'No phone provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{hotel.usage.staffCount}</p>
                <p className="text-sm text-gray-600">Staff</p>
                <p className="text-xs text-gray-400">of {hotel.limits.maxStaffAllowed}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Table className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{hotel.usage.tableCount}</p>
                <p className="text-sm text-gray-600">Tables</p>
                <p className="text-xs text-gray-400">of {hotel.limits.maxTablesAllowed}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Menu className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{hotel.usage.menuCount}</p>
                <p className="text-sm text-gray-600">Menu Items</p>
                <p className="text-xs text-gray-400">of {hotel.limits.maxMenuItemsAllowed}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <ShoppingCart className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{hotel.usage.totalOrders}</p>
                <p className="text-sm text-gray-600">Orders</p>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="mt-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Total Revenue</span>
                <TrendingUp className="h-4 w-4 opacity-90" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(hotel.usage.totalRevenue)}</p>
              <p className="text-xs opacity-75 mt-1">
                Last order: {formatDate(hotel.usage.lastOrderDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Subscription & Activity */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Plan</p>
                <p className="text-lg font-semibold text-gray-900">{hotel.subscription.planName}</p>
                <p className="text-sm text-gray-500">{hotel.subscription.planCode}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(hotel.subscription.pricePerMonth)}
                  <span className="text-sm font-normal text-gray-500 ml-1">/month</span>
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium capitalize">{hotel.subscription.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-medium">{formatDate(hotel.subscription.startDate)}</span>
                  </div>
                  {hotel.subscription.endDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">End Date</span>
                      <span className="font-medium">{formatDate(hotel.subscription.endDate)}</span>
                    </div>
                  )}
                  {hotel.subscription.trialEndsAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Trial Ends</span>
                      <span className="font-medium">{formatDate(hotel.subscription.trialEndsAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Limits Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resource Limits</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Staff</span>
                  <span className="font-medium text-gray-900">
                    {hotel.usage.staffCount} / {hotel.limits.maxStaffAllowed}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(hotel.usage.staffCount / hotel.limits.maxStaffAllowed) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Tables</span>
                  <span className="font-medium text-gray-900">
                    {hotel.usage.tableCount} / {hotel.limits.maxTablesAllowed}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(hotel.usage.tableCount / hotel.limits.maxTablesAllowed) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Menu Items</span>
                  <span className="font-medium text-gray-900">
                    {hotel.usage.menuCount} / {hotel.limits.maxMenuItemsAllowed}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(hotel.usage.menuCount / hotel.limits.maxMenuItemsAllowed) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Last Login:</span>
                <span className="font-medium text-gray-900 ml-auto">
                  {formatDate(hotel.activity.lastLogin)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Created:</span>
                <span className="font-medium text-gray-900 ml-auto">
                  {formatDate(hotel.activity.createdAt)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Updated:</span>
                <span className="font-medium text-gray-900 ml-auto">
                  {formatDate(hotel.activity.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-2">
              <Link
                href={{
                  pathname: `/admin/hotels/${hotel.id}/edit`,
                  query: { data: JSON.stringify(hotel) }
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Hotel Details
              </Link>
              
              <Link
                href={`/admin/hotels/${hotel.id}/staff`}
                className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="h-4 w-4" />
                Manage Staff
              </Link>
              
              <Link
                href={`/admin/hotels/${hotel.id}/orders`}
                className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                View Orders
              </Link>
              
              <Link
                href={`/admin/hotels/${hotel.id}/subscription`}
                className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Manage Subscription
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}