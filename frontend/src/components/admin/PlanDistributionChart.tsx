// components/dashboard/PlanDistributionChart.tsx
"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Users,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
} from "lucide-react";

interface PlanDistributionChartProps {
  distribution: Array<{
    name: string;
    count: number;
    revenue: string;
  }>;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function PlanDistributionChart({
  distribution,
}: PlanDistributionChartProps) {
  const [view, setView] = useState<"count" | "revenue">("count");

  // Filter out plans with zero subscribers for cleaner chart
  const chartData = (distribution ?? []).filter((d) => d.count > 0);

  // Calculate totals
  const totalSubscribers = chartData.reduce((sum, d) => sum + d.count, 0);
  const totalRevenue = chartData.reduce(
    (sum, d) => sum + parseFloat(d.revenue),
    0,
  );

  // Prepare data based on view
  const displayData = chartData.map((d) => ({
    name: d.name,
    value: view === "count" ? d.count : parseFloat(d.revenue),
    originalCount: d.count,
    originalRevenue: parseFloat(d.revenue),
  }));

  const formatValue = (value: number) => {
    if (view === "count") {
      return `${value} subscribers`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    const total = view === "count" ? totalSubscribers : totalRevenue;
    return ((value / total) * 100).toFixed(1);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{data.name}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              Subscribers:{" "}
              <span className="font-semibold">{data.originalCount}</span>
            </p>
            <p className="text-sm text-gray-600">
              Revenue:{" "}
              <span className="font-semibold">
                ${data.originalRevenue.toFixed(2)}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Share:{" "}
              <span className="font-semibold">
                {formatPercentage(data.value)}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="mt-4 space-y-2">
        {payload.map((entry: any, index: number) => {
          const data = chartData[index];
          return (
            <li
              key={`legend-${index}`}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{data.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-gray-900">
                  {view === "count"
                    ? data.count
                    : `$${parseFloat(data.revenue).toFixed(2)}`}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  (
                  {formatPercentage(
                    view === "count" ? data.count : parseFloat(data.revenue),
                  )}
                  %)
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Plan Distribution
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {view === "count"
              ? `${totalSubscribers} total subscribers`
              : `$${totalRevenue.toFixed(2)} total revenue`}
          </p>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView("count")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === "count"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="h-3 w-3" />
            Subscribers
          </button>
          <button
            onClick={() => setView("revenue")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === "revenue"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <DollarSign className="h-3 w-3" />
            Revenue
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <PieChartIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No subscription data available</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {displayData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            {renderLegend({
              payload: displayData.map((d, i) => ({
                color: COLORS[i % COLORS.length],
                value: d.value,
              })),
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Most Popular</p>
              <p className="text-sm font-semibold text-gray-900">
                {
                  chartData.reduce(
                    (max, d) => (d.count > max.count ? d : max),
                    chartData[0],
                  ).name
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Highest Revenue</p>
              <p className="text-sm font-semibold text-gray-900">
                {
                  chartData.reduce(
                    (max, d) =>
                      parseFloat(d.revenue) > parseFloat(max.revenue) ? d : max,
                    chartData[0],
                  ).name
                }
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
