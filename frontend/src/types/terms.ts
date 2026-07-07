// types/terms.ts
export interface TermsAndConditions {
  id: string;
  title: string;
  content: string;
  version: string;
  type: 'platform' | 'hotel' | 'privacy' | 'cancellation';
  applies_to: 'all' | 'hotels' | 'customers' | 'staff';
  is_active: boolean;
  is_mandatory: boolean;
  effective_from: string;
  effective_until: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  languages: Record<string, boolean>;
  attachments: any[];
  hotel_id: string | null;
  acceptance_count?: number;
  created_by_email?: string;
  created_by_name?: string;
}

export interface TermsAcceptance {
  id: string;
  term_id: string;
  user_id: string;
  user_type: 'hotel_admin' | 'staff' | 'customer' | 'main_admin';
  hotel_id: string | null;
  accepted_at: string;
  ip_address: string;
  user_agent: string;
  user_name?: string;
}

export interface TermsFilters {
  page?: number;
  limit?: number;
  type?: string;
  is_active?: boolean;
  hotel_id?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface TermsResponse {
  success: boolean;
  data: TermsAndConditions[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TermsAcceptanceResponse {
  success: boolean;
  data: TermsAcceptance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ActiveTermsResponse {
  success: boolean;
  data: TermsAndConditions | null;
}