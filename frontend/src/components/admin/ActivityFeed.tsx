// // components/dashboard/ActivityFeed.tsx
// 'use client';

// import { useState } from 'react';
// import { 
//   Activity, 
//   UserPlus, 
//   CreditCard, 
//   Building2, 
//   Settings,
//   AlertCircle,
//   CheckCircle,
//   Clock,
//   Filter,
//   RefreshCw,
//   MoreHorizontal,
//   Globe,
//   Shield,
//   Mail
// } from 'lucide-react';

// interface ActivityFeedProps {
//   activities: Array<{
//     id: string;
//     action: string;
//     resourceType: string;
//     resourceName: string;
//     details: Record<string, any>;
//     ipAddress: string;
//     createdAt: string;
//   }>;
// }

// export default function ActivityFeed({ activities }: ActivityFeedProps) {
//   const [filter, setFilter] = useState<string>('all');
//   const [showFilters, setShowFilters] = useState(false);

//   const getActionIcon = (action: string) => {
//     const actionLower = action.toLowerCase();
//     if (actionLower.includes('login')) return <Shield className="h-4 w-4 text-blue-500" />;
//     if (actionLower.includes('create') || actionLower.includes('add')) return <UserPlus className="h-4 w-4 text-green-500" />;
//     if (actionLower.includes('payment') || actionLower.includes('transaction')) return <CreditCard className="h-4 w-4 text-purple-500" />;
//     if (actionLower.includes('hotel')) return <Building2 className="h-4 w-4 text-orange-500" />;
//     if (actionLower.includes('update') || actionLower.includes('edit')) return <Settings className="h-4 w-4 text-yellow-500" />;
//     if (actionLower.includes('delete')) return <AlertCircle className="h-4 w-4 text-red-500" />;
//     if (actionLower.includes('success')) return <CheckCircle className="h-4 w-4 text-green-500" />;
//     return <Activity className="h-4 w-4 text-gray-500" />;
//   };

//   const getActionColor = (action: string) => {
//     const actionLower = action.toLowerCase();
//     if (actionLower.includes('login')) return 'bg-blue-50';
//     if (actionLower.includes('create') || actionLower.includes('add')) return 'bg-green-50';
//     if (actionLower.includes('payment') || actionLower.includes('transaction')) return 'bg-purple-50';
//     if (actionLower.includes('hotel')) return 'bg-orange-50';
//     if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-yellow-50';
//     if (actionLower.includes('delete')) return 'bg-red-50';
//     if (actionLower.includes('success')) return 'bg-green-50';
//     return 'bg-gray-50';
//   };

//   const formatTimeAgo = (dateString: string) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
//     if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
//     return `${Math.floor(diffInSeconds / 86400)} days ago`;
//   };

//   const formatDateTime = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit'
//     });
//   };

//   const filteredActivities = filter === 'all' 
//     ? activities 
//     : activities.filter(a => a.action.toLowerCase().includes(filter.toLowerCase()));

//   const uniqueActions = [...new Set(activities.map(a => a.action))];

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200">
//       <div className="p-6 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
//             <p className="text-sm text-gray-500 mt-1">
//               Latest actions from across the platform
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className={`p-2 rounded-lg border ${
//                 showFilters ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
//               }`}
//             >
//               <Filter className="h-4 w-4 text-gray-600" />
//             </button>
//             <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
//               <RefreshCw className="h-4 w-4 text-gray-600" />
//             </button>
//           </div>
//         </div>

//         {/* Filters */}
//         {showFilters && (
//           <div className="mt-4 flex flex-wrap gap-2">
//             <button
//               onClick={() => setFilter('all')}
//               className={`px-3 py-1 text-xs font-medium rounded-full ${
//                 filter === 'all'
//                   ? 'bg-blue-100 text-blue-800'
//                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//               }`}
//             >
//               All
//             </button>
//             {uniqueActions.slice(0, 5).map(action => (
//               <button
//                 key={action}
//                 onClick={() => setFilter(action)}
//                 className={`px-3 py-1 text-xs font-medium rounded-full ${
//                   filter === action
//                     ? 'bg-blue-100 text-blue-800'
//                     : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                 }`}
//               >
//                 {action}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
//         {filteredActivities.length === 0 ? (
//           <div className="p-8 text-center">
//             <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
//             <p className="text-gray-500">No activities found</p>
//           </div>
//         ) : (
//           filteredActivities.map((activity, index) => (
//             <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
//               <div className="flex items-start gap-3">
//                 {/* Icon */}
//                 <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${getActionColor(activity.action)} flex items-center justify-center`}>
//                   {getActionIcon(activity.action)}
//                 </div>

//                 {/* Content */}
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center justify-between">
//                     <p className="text-sm font-medium text-gray-900">
//                       {activity.action}
//                     </p>
//                     <span className="text-xs text-gray-500">
//                       {formatTimeAgo(activity.createdAt)}
//                     </span>
//                   </div>
                  
//                   <p className="text-sm text-gray-600 mt-0.5">
//                     <span className="font-medium">{activity.resourceName || activity.resourceType}</span>
//                     {activity.details && Object.keys(activity.details).length > 0 && (
//                       <span className="text-gray-500">
//                         {' • '}{Object.entries(activity.details)
//                           .map(([key, val]) => `${key}: ${val}`)
//                           .join(', ')}
//                       </span>
//                     )}
//                   </p>

//                   {/* Meta Info */}
//                   <div className="flex items-center gap-3 mt-2">
//                     <div className="flex items-center gap-1 text-xs text-gray-400">
//                       <Globe className="h-3 w-3" />
//                       {activity.ipAddress}
//                     </div>
//                     <div className="flex items-center gap-1 text-xs text-gray-400">
//                       <Clock className="h-3 w-3" />
//                       {formatDateTime(activity.createdAt)}
//                     </div>
//                     {activity.resourceType && (
//                       <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
//                         {activity.resourceType}
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 {/* Action Menu */}
//                 <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded">
//                   <MoreHorizontal className="h-4 w-4 text-gray-400" />
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* Footer */}
//       <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
//         <div className="flex items-center justify-between text-xs text-gray-500">
//           <span>{filteredActivities.length} activities</span>
//           <button className="text-blue-600 hover:text-blue-800 font-medium">
//             View All Activity
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }








// components/dashboard/ActivityFeed.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  UserPlus, 
  CreditCard, 
  Building2, 
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Globe,
  Shield,
  Mail,
  Download,
  Eye,
  Trash2,
  Check,
  X,
  Bell,
  BellOff,
  Flag,
  Archive,
  ExternalLink
} from 'lucide-react';

interface ActivityFeedProps {
  activities: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceName: string;
    details: Record<string, any>;
    ipAddress: string;
    createdAt: string;
    resourceId?: string;        // optional id used in navigation/links
    userType?: string;
    userId?: string;
    isRead?: boolean;
  }>;
  onRefresh?: () => Promise<void>;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onExport?: () => void;
  onViewDetails?: (activity: any) => void;
}

export default function ActivityFeed({ 
  activities = [], 
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onExport,
  onViewDetails 
}: ActivityFeedProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [filteredActivities, setFilteredActivities] = useState(activities);

  // Get unique actions for filter buttons
  const uniqueActions = [...new Set(activities.map(a => a.action))];

  // Filter activities based on selected filters
  useEffect(() => {
    let filtered = [...activities];

    // Apply action filter
    if (filter !== 'all') {
      filtered = filtered.filter(a => 
        a.action.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Apply date range filter
    const now = new Date();
    switch(dateRange) {
      case 'today':
        filtered = filtered.filter(a => 
          new Date(a.createdAt).toDateString() === now.toDateString()
        );
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        filtered = filtered.filter(a => new Date(a.createdAt) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        filtered = filtered.filter(a => new Date(a.createdAt) >= monthAgo);
        break;
      default:
        break;
    }

    setFilteredActivities(filtered);
  }, [activities, filter, dateRange]);

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return <Shield className="h-4 w-4 text-blue-500" />;
    if (actionLower.includes('create') || actionLower.includes('add')) return <UserPlus className="h-4 w-4 text-green-500" />;
    if (actionLower.includes('payment') || actionLower.includes('transaction')) return <CreditCard className="h-4 w-4 text-purple-500" />;
    if (actionLower.includes('hotel')) return <Building2 className="h-4 w-4 text-orange-500" />;
    if (actionLower.includes('update') || actionLower.includes('edit')) return <Settings className="h-4 w-4 text-yellow-500" />;
    if (actionLower.includes('delete')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (actionLower.includes('success')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (actionLower.includes('export')) return <Download className="h-4 w-4 text-indigo-500" />;
    if (actionLower.includes('view')) return <Eye className="h-4 w-4 text-cyan-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return 'bg-blue-50';
    if (actionLower.includes('create') || actionLower.includes('add')) return 'bg-green-50';
    if (actionLower.includes('payment') || actionLower.includes('transaction')) return 'bg-purple-50';
    if (actionLower.includes('hotel')) return 'bg-orange-50';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-yellow-50';
    if (actionLower.includes('delete')) return 'bg-red-50';
    if (actionLower.includes('success')) return 'bg-green-50';
    if (actionLower.includes('export')) return 'bg-indigo-50';
    if (actionLower.includes('view')) return 'bg-cyan-50';
    return 'bg-gray-50';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDateTime(dateString);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      // Simulate refresh if no callback
      setTimeout(() => setIsRefreshing(false), 1000);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAsRead = (id: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
    setShowMenuFor(null);
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export functionality
      const csvContent = [
        ['ID', 'Action', 'Resource', 'Details', 'IP Address', 'Date'].join(','),
        ...filteredActivities.map(a => [
          a.id,
          a.action,
          a.resourceName || a.resourceType,
          JSON.stringify(a.details),
          a.ipAddress,
          a.createdAt
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_log_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleViewDetails = (activity: any) => {
    if (onViewDetails) {
      onViewDetails(activity);
    } else {
      // Default: navigate to resource
      if (activity.resourceType && activity.resourceId) {
        router.push(`/admin/${activity.resourceType}s/${activity.resourceId}`);
      }
    }
    setShowMenuFor(null);
  };

  const handleNavigateToResource = (activity: any) => {
    if (activity.resourceType && activity.resourceId) {
      router.push(`/admin/${activity.resourceType}s/${activity.resourceId}`);
    }
  };

  const handleDismissActivity = (id: string) => {
    // This could be connected to a hide/dismiss functionality
    console.log('Dismiss activity:', id);
    setShowMenuFor(null);
  };

  const unreadCount = activities.filter(a => !a.isRead).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="h-6 w-6 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{unreadCount}</span>
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-500">
                Latest actions from across the platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mark all as read button */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                title="Mark all as read"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}

            {/* Export button */}
            <button
              onClick={handleExport}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export activities"
            >
              <Download className="h-4 w-4 text-gray-600" />
            </button>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
              }`}
              title="Toggle filters"
            >
              <Filter className={`h-4 w-4 ${showFilters ? 'text-blue-600' : 'text-gray-600'}`} />
            </button>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 space-y-3">
            {/* Action filters */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Filter by action</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {uniqueActions.slice(0, 8).map(action => (
                  <button
                    key={action}
                    onClick={() => setFilter(action)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      filter === action
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range filter */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Date range</p>
              <div className="flex gap-2">
                {[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'all', label: 'All Time' }
                ].map(range => (
                  <button
                    key={range.value}
                    onClick={() => setDateRange(range.value as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      dateRange === range.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filters summary */}
            {(filter !== 'all' || dateRange !== 'all') && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-gray-500">Active filters:</span>
                {filter !== 'all' && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Action: {filter}
                  </span>
                )}
                {dateRange !== 'all' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                    {dateRange === 'today' ? 'Today' : 
                     dateRange === 'week' ? 'This Week' : 'This Month'}
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilter('all');
                    setDateRange('all');
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No activities found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or check back later
            </p>
            {(filter !== 'all' || dateRange !== 'all') && (
              <button
                onClick={() => {
                  setFilter('all');
                  setDateRange('all');
                }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div 
              key={activity.id} 
              className={`relative p-4 hover:bg-gray-50 transition-colors group
                ${!activity.isRead ? 'bg-blue-50/30' : ''}`}
              onMouseEnter={() => setSelectedActivity(activity.id)}
              onMouseLeave={() => {
                setSelectedActivity(null);
                if (showMenuFor !== activity.id) {
                  setShowMenuFor(null);
                }
              }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${getActionColor(activity.action)} flex items-center justify-center`}>
                  {getActionIcon(activity.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.action}
                        </p>
                        {!activity.isRead && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-medium rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        <span 
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => handleNavigateToResource(activity)}
                        >
                          {activity.resourceName || activity.resourceType}
                        </span>
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <span className="text-gray-500">
                            {' • '}
                            {Object.entries(activity.details)
                              .filter(([_, val]) => val && typeof val !== 'object')
                              .map(([key, val]) => `${key}: ${val}`)
                              .join(', ')}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Globe className="h-3 w-3" />
                      {activity.ipAddress || '127.0.0.1'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(activity.createdAt)}
                    </div>
                    {activity.userType && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {activity.userType}
                      </span>
                    )}
                    {activity.resourceType && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                        {activity.resourceType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Menu */}
                {(selectedActivity === activity.id || showMenuFor === activity.id) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenuFor(showMenuFor === activity.id ? null : activity.id)}
                      className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-600" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenuFor === activity.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <button
                          onClick={() => handleViewDetails(activity)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        
                        {activity.resourceType && activity.resourceId && (
                          <button
                            onClick={() => handleNavigateToResource(activity)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Go to {activity.resourceType}
                          </button>
                        )}
                        
                        {!activity.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(activity.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Check className="h-4 w-4" />
                            Mark as Read
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDismissActivity(activity.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {filteredActivities.length} of {activities.length} activities
            </span>
            {unreadCount > 0 && (
              <span className="text-xs text-blue-600">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/admin/activity')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All Activity
              <ExternalLink className="h-3 w-3" />
            </button>
            
            {/* Quick actions */}
            <div className="flex items-center gap-1 ml-4">
              <button
                onClick={() => setFilter('error')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Show errors only"
              >
                <AlertCircle className="h-3 w-3 text-gray-500" />
              </button>
              <button
                onClick={() => setFilter('success')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Show success only"
              >
                <CheckCircle className="h-3 w-3 text-gray-500" />
              </button>
              <button
                onClick={() => {
                  setFilter('all');
                  setDateRange('all');
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="Reset filters"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}