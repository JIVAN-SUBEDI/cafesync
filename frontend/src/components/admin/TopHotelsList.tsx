// components/dashboard/TopHotelsList.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Trophy, 
  Users, 
  DoorOpen,
  TrendingUp,
  Star,
  ChevronRight,
  Eye
} from 'lucide-react';

interface TopHotelsListProps {
  hotels: Array<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    staffCount: number;
    roomCount: number;
    totalRevenue: string;
    planName: string;
  }>;
}

export default function TopHotelsList({ hotels }: TopHotelsListProps) {
  const router = useRouter();
  const [hoveredHotel, setHoveredHotel] = useState<string | null>(null);

  const getMedalColor = (index: number) => {
    switch(index) {
      case 0: return 'text-yellow-500'; // Gold
      case 1: return 'text-gray-400';    // Silver
      case 2: return 'text-amber-600';   // Bronze
      default: return 'text-gray-300';
    }
  };

  const getMedalBg = (index: number) => {
    switch(index) {
      case 0: return 'bg-yellow-50';
      case 1: return 'bg-gray-50';
      case 2: return 'bg-amber-50';
      default: return 'bg-gray-50';
    }
  };

  const handleViewHotel = (hotelId: string) => {
    router.push(`/admin/hotels/${hotelId}`);
  };

  // Calculate total revenue
  const totalRevenue = hotels.reduce((sum, hotel) => sum + parseFloat(hotel.totalRevenue), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Hotels</h3>
            <p className="text-sm text-gray-500 mt-1">
              By revenue • Total ${totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-600">Top 5</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {hotels.map((hotel, index) => (
          <div
            key={hotel.id}
            className={`relative mb-3 last:mb-0 p-4 rounded-xl transition-all cursor-pointer
              ${hoveredHotel === hotel.id ? 'shadow-md scale-[1.02]' : 'hover:shadow-sm'}
              ${getMedalBg(index)}`}
            onMouseEnter={() => setHoveredHotel(hotel.id)}
            onMouseLeave={() => setHoveredHotel(null)}
            onClick={() => handleViewHotel(hotel.id)}
          >
            {/* Rank Medal */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                ${index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-amber-600' : 'bg-gray-200'}`}
              >
                <span className="text-sm font-bold text-white">#{index + 1}</span>
              </div>
            </div>

            <div className="ml-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{hotel.name}</h4>
                    {!hotel.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{hotel.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">${hotel.totalRevenue}</p>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="h-3 w-3" />
                    Staff
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{hotel.staffCount}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <DoorOpen className="h-3 w-3" />
                    Rooms
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{hotel.roomCount}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="h-3 w-3" />
                    Plan
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{hotel.planName}</p>
                </div>
              </div>

              {/* Progress Bar - Revenue Percentage */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Contribution</span>
                  <span className="font-medium text-gray-700">
                    {((parseFloat(hotel.totalRevenue) / totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                    }`}
                    style={{ 
                      width: `${(parseFloat(hotel.totalRevenue) / totalRevenue) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Hover Actions */}
              {hoveredHotel === hotel.id && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <button className="p-2 bg-white rounded-lg shadow-md text-blue-600 hover:bg-blue-50">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Link */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={() => router.push('/admin/hotels')}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-2"
        >
          View All Hotels
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}