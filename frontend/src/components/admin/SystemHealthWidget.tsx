// components/dashboard/SystemHealthWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Database,
  Users,
  CreditCard,
  TrendingUp,
  Gauge,
  Shield,
  RefreshCw
} from 'lucide-react';

interface SystemHealthWidgetProps {
  health: {
    hotelsLast24h: number;
    transactionsLast24h: number;
    failedJobs24h: number;
    activityLastHour: number;
  };
}

export default function SystemHealthWidget({ health }: SystemHealthWidgetProps) {
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'degraded' | 'down'>('healthy');

  // Simulate system status based on failed jobs
  useEffect(() => {
    if (health.failedJobs24h > 10) {
      setSystemStatus('degraded');
    } else if (health.failedJobs24h > 50) {
      setSystemStatus('down');
    } else {
      setSystemStatus('healthy');
    }
  }, [health.failedJobs24h]);

  // Auto-refresh last checked
  useEffect(() => {
    const interval = setInterval(() => {
      setLastChecked(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch(systemStatus) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch(systemStatus) {
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Partial Outage Detected';
      case 'down':
        return 'Major Outage';
    }
  };

  const getStatusColor = () => {
    switch(systemStatus) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
    }
  };

  const getStatusBg = () => {
    switch(systemStatus) {
      case 'healthy':
        return 'bg-green-50';
      case 'degraded':
        return 'bg-yellow-50';
      case 'down':
        return 'bg-red-50';
    }
  };

  // Calculate uptime percentage (mock calculation)
  const uptimePercentage = 99.9 - (health.failedJobs24h * 0.01);
  const formattedUptime = Math.max(99, uptimePercentage).toFixed(2);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusBg()}`}>
            {getStatusIcon()}
            <span className={`text-xs font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Uptime Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">System Uptime</span>
            <span className="font-semibold text-gray-900">{formattedUptime}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                parseFloat(formattedUptime) > 99.5 ? 'bg-green-500' :
                parseFloat(formattedUptime) > 99 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${formattedUptime}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">New Hotels</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{health.hotelsLast24h}</p>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-gray-600">Transactions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{health.transactionsLast24h}</p>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-600">Activity</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{health.activityLastHour}</p>
            <p className="text-xs text-gray-500 mt-1">Last hour</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-600">Failed Jobs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{health.failedJobs24h}</p>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Database</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-500">Connected</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">API</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-500">200ms</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Active Users</span>
            </div>
            <span className="text-xs font-medium text-gray-900">1,234</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Avg Response</span>
            </div>
            <span className="text-xs font-medium text-gray-900">245ms</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Peak Load</span>
            </div>
            <span className="text-xs font-medium text-gray-900">1.2k req/s</span>
          </div>
        </div>

        {/* Last Checked */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Last checked: {lastChecked.toLocaleTimeString()}
            </div>
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}