// types/dashboard.ts
export interface DashboardSummary {
  totalHotels: number;
  activeHotels: number;
  inactiveHotels: number;
  newHotels: number;
  activePercentage: number;
  
  totalRevenue: string;
  revenueInPeriod: string;
  revenueThisMonth: string;
  revenueGrowth: number;
  
  mrr: string;
  averageSubscriptionValue: string;
  payingHotels: number;
  
  totalStaff: number;
  avgStaffPerHotel: number;
  activeStaff30d: number;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  trial: number;
  cancelled: number;
  planDistribution: Array<{
    name: string;
    count: number;
    revenue: string;
  }>;
}

export interface ChartData {
  revenue: Array<{
    date: string;
    revenue: string;
    transactions: number;
    uniqueHotels: number;
  }>;
  hotelGrowth: Array<{
    month: string;
    totalHotels: number;
    newHotels: number;
    activeSubscriptions: number;
  }>;
}

export interface RecentHotel {
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
}

export interface RecentTransaction {
  id: string;
  amount: string;
  status: string;
  paymentMethod: string;
  hotelName: string;
  hotelId: string;
  planName: string;
  createdAt: string;
}

export interface TopHotel {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  staffCount: number;
  roomCount: number;
  totalRevenue: string;
  planName: string;
}

export interface SystemHealth {
  hotelsLast24h: number;
  transactionsLast24h: number;
  failedJobs24h: number;
  activityLastHour: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  resourceType: string;
  resourceName: string;
  details: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

export interface DashboardMetadata {
  timeRange: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  adminId: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  subscriptions: SubscriptionStats;
  charts: ChartData;
  recentHotels: RecentHotel[];
  recentTransactions: RecentTransaction[];
  topHotels: TopHotel[];
  systemHealth: SystemHealth;
  recentActivity: RecentActivity[];
  metadata: DashboardMetadata;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export interface DashboardFilters {
  range: '7d' | '30d' | '90d' | '1y';
}