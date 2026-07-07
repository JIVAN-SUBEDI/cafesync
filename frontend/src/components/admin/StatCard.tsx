// components/dashboard/StatCard.tsx
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  percentage?: number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'pink' | 'teal' | 'cyan';
  size?: 'normal' | 'small';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  pink: 'bg-pink-50 text-pink-600',
  teal: 'bg-teal-50 text-teal-600',
  cyan: 'bg-cyan-50 text-cyan-600',
};

export default function StatCard({ 
  title, 
  value, 
  change, 
  percentage, 
  subtitle,
  icon: Icon, 
  color,
  size = 'normal'
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`font-bold text-gray-900 ${size === 'normal' ? 'text-2xl' : 'text-xl'}`}>
            {value}
          </p>
          {change && (
            <p className="text-sm text-green-600 mt-1">{change}</p>
          )}
          {percentage !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`rounded-full h-2 ${
                    color === 'blue' ? 'bg-blue-600' :
                    color === 'green' ? 'bg-green-600' :
                    color === 'purple' ? 'bg-purple-600' :
                    'bg-orange-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}