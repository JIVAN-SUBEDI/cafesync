// types/subscription.ts
export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_code: string;
  description: string | null;
  price_per_year: number;
  price_per_month: number;
  max_staff: number;
  max_tables: number;
  max_menu_items: number;
  features: Record<string, any>;
  display_order: number;
  is_active: boolean;
  created_at: string;
  hotels_using?: number;
  hotels?: Array<{
    id: string;
    hotel_name: string;
    subscription_status: string;
    created_at: string;
  }>;
}

export interface SubscriptionFormData {
  plan_name: string;
  plan_code: string;
  description: string;
    price_per_year: number;

  price_per_month: number | string;
  max_staff: number | string;
  max_tables: number | string;
  max_menu_items: number | string;
  features: Record<string, any>;
  display_order: number | string;
  is_active: boolean;
}

export interface SubscriptionsResponse {
  success: boolean;
  data: SubscriptionPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SubscriptionResponse {
  success: boolean;
  data: SubscriptionPlan;
  message?: string;
}

export interface SubscriptionFilters {
  page: number;
  limit: number;
  search: string;
  status: 'all' | 'active' | 'inactive';
}