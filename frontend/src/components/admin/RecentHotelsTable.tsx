// components/dashboard/RecentHotelsTable.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';

interface RecentHotelsTableProps {
  hotels: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    city: string;
    country: string;
    subscriptionStatus: string;
    planName: string;
    createdAt: string;
  }>;
}

export default function RecentHotelsTable({ hotels }: RecentHotelsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);

  // Filter hotels
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = 
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? hotel.isActive :
      statusFilter === 'inactive' ? !hotel.isActive :
      statusFilter === 'subscribed' ? hotel.subscriptionStatus === 'active' : true;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHotels.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedHotels = filteredHotels.slice(startIndex, startIndex + rowsPerPage);

  const handleViewHotel = (hotelId: string) => {
    router.push(`/admin/hotels/${hotelId}`);
  };

  const handleEditHotel = (hotelId: string) => {
    router.push(`/admin/hotels/${hotelId}/edit`);
  };

  const handleToggleStatus = (hotelId: string, currentStatus: boolean) => {
    // Implement status toggle API call
    console.log('Toggle status for hotel:', hotelId, 'to', !currentStatus);
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Inactive</span>;
    }
    
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
      case 'trial':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Trial</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Expired</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">No Subscription</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Hotels</h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search hotels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="subscribed">Subscribed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedHotels.map((hotel) => (
              <tr 
                key={hotel.id} 
                className="hover:bg-gray-50 transition-colors relative"
                onMouseEnter={() => setSelectedHotel(hotel.id)}
                onMouseLeave={() => setSelectedHotel(null)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                      <div className="text-sm text-gray-500">ID: {hotel.id.slice(0,8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    {hotel.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    {hotel.phone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    {hotel.city}, {hotel.country}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{hotel.planName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(hotel.subscriptionStatus, hotel.isActive)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(hotel.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {selectedHotel === hotel.id && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewHotel(hotel.id)}
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditHotel(hotel.id)}
                        className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Edit Hotel"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(hotel.id, hotel.isActive)}
                        className={`p-1 rounded ${
                          hotel.isActive 
                            ? 'text-gray-600 hover:text-red-600 hover:bg-red-50' 
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={hotel.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {hotel.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredHotels.length)} of {filteredHotels.length} hotels
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}