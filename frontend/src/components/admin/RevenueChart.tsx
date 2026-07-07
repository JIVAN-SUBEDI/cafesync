// components/dashboard/RevenueChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: string;
    transactions: number;
    uniqueHotels: number;
  }>;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'cumulative'>('daily');
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate cumulative revenue
  const cumulativeData = data.reduce((acc, curr, index) => {
    const prevRevenue = index > 0 ? parseFloat(acc[index - 1].revenue) : 0;
    const currentRevenue = parseFloat(curr.revenue);
    acc.push({
      ...curr,
      revenue: (prevRevenue + currentRevenue).toFixed(2)
    });
    return acc;
  }, [] as typeof data);

  const chartData = timeframe === 'daily' ? data : cumulativeData;

  // Calculate trend
  const firstValue = parseFloat(chartData[0]?.revenue || '0');
  const lastValue = parseFloat(chartData[chartData.length - 1]?.revenue || '0');
  const trend = lastValue - firstValue;
  const trendPercentage = firstValue > 0 ? (trend / firstValue) * 100 : 0;

  const getTrendIcon = () => {
    if (trendPercentage > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trendPercentage < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-yellow-600" />;
  };

  const getTrendColor = () => {
    if (trendPercentage > 5) return 'text-green-600';
    if (trendPercentage < -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  // Calculate total and average
  const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.revenue), 0);
  const avgRevenue = totalRevenue / data.length;
  const totalTransactions = data.reduce((sum, item) => sum + item.transactions, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">${totalRevenue.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-600">
              Avg: <span className="font-semibold">${avgRevenue.toFixed(2)}/day</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          {/* Trend Indicator */}
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
            </span>
          </div>

          {/* Timeframe Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                timeframe === 'daily'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeframe('cumulative')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                timeframe === 'cumulative'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cumulative
            </button>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={(value: any) => `$${value}`}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelFormatter={(label) => typeof label === 'string' ? formatDate(label) : label}
              formatter={(value: any, name: string | undefined) => {
                if (name === 'revenue') return [`$${parseFloat(value).toFixed(2)}`, 'Revenue'];
                if (name === 'transactions') return [value, 'Transactions'];
                return [value, name];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="transactions"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 2, fill: '#10B981', strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              name="Transactions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Footer */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-500">Total Transactions</p>
          <p className="text-lg font-semibold text-gray-900">{totalTransactions}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Peak Revenue</p>
          <p className="text-lg font-semibold text-gray-900">
            ${Math.max(...data.map(d => parseFloat(d.revenue))).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Transaction</p>
          <p className="text-lg font-semibold text-gray-900">
            ${totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>
    </div>
  );
}