// components/dashboard/HotelGrowthChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';
import { TrendingUp, Users, Building2 } from 'lucide-react';

interface HotelGrowthChartProps {
  data: Array<{
    month: string;
    totalHotels: number;
    newHotels: number;
    activeSubscriptions: number;
  }>;
}

export default function HotelGrowthChart({ data }: HotelGrowthChartProps) {
  // Calculate growth rate
  const growthRates = data.map((item, index) => {
    if (index === 0) return { ...item, growthRate: 0 };
    const prev = data[index - 1].totalHotels;
    const growth = prev > 0 ? ((item.totalHotels - prev) / prev) * 100 : 0;
    return { ...item, growthRate: parseFloat(growth.toFixed(1)) };
  });

  // Calculate totals
  const totalNewHotels = data.reduce((sum, item) => sum + item.newHotels, 0);
  const avgActiveSubscriptions = data.reduce((sum, item) => sum + item.activeSubscriptions, 0) / data.length;
  const latestTotal = data[data.length - 1]?.totalHotels || 0;
  const earliestTotal = data[0]?.totalHotels || 0;
  const overallGrowth = earliestTotal > 0 ? ((latestTotal - earliestTotal) / earliestTotal) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Hotel Growth</h3>
          <p className="text-sm text-gray-600">Monthly hotel acquisition and subscription trends</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">
            {overallGrowth > 0 ? '+' : ''}{overallGrowth.toFixed(1)}% overall
          </span>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={growthRates} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              formatter={(value: any, name: string | undefined) => {
                if (name === 'growthRate') return [`${value}%`, 'Growth Rate'];
                if (name === 'totalHotels') return [value, 'Total Hotels'];
                if (name === 'newHotels') return [value, 'New Hotels'];
                if (name === 'activeSubscriptions') return [value, 'Active Subs'];
                return [value, name || ''];
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="newHotels" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
              name="New Hotels"
              barSize={20}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="totalHotels"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 4, fill: '#10B981' }}
              name="Total Hotels"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="activeSubscriptions"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#8B5CF6' }}
              name="Active Subs"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="growthRate"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 3, fill: '#F59E0B' }}
              name="Growth Rate"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-gray-600">Total Hotels</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{latestTotal}</p>
          <p className="text-xs text-gray-500 mt-1">
            +{totalNewHotels} new this period
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-600" />
            <p className="text-xs text-gray-600">Active Subs</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {Math.round(avgActiveSubscriptions)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {((avgActiveSubscriptions / latestTotal) * 100).toFixed(1)}% of hotels
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-xs text-gray-600">Growth Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overallGrowth > 0 ? '+' : ''}{overallGrowth.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Period over period
          </p>
        </div>
      </div>
    </div>
  );
}