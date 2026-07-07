import axios from "axios";

export type BillingCycle = "monthly" | "yearly";
export type PaymentMethod = "esewa" | "khalti" | "fonepay";
export type RegistrationType = "trial" | "subscription";

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_code?: string;
  description?: string;
  price_per_month: number | string;
  price_per_year: number | string;
  max_staff: number;
  max_tables: number;
  max_menu_items: number;
  display_order: number;
  is_active?: boolean;
  features?: Record<string, boolean>;
}

export interface HotelRegistrationForm {
  hotel_name: string;
  hotel_slug: string;
  admin_email: string;
  admin_password: string;
  admin_confirm_password: string;
  admin_name: string;
  admin_phone: string;
  image: File | null;
  hotel_phone: string;
  hotel_address: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  tax_rate: number;
  service_charge: number;
  subscription_plan_id: string;
  billing_cycle: BillingCycle;
  payment_method: PaymentMethod;
  accept_terms: boolean;
  accept_marketing: boolean;
  accepted_terms_ids: string[];
}

export interface StartRegistrationPayload {
  hotel_name: string;
  hotel_slug: string;
  admin_email: string;
  admin_password: string;
  admin_name: string;
  admin_phone: string;
  image: File | null;
  hotel_phone: string;
  hotel_address: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  tax_rate: number;
  service_charge: number;
  subscription_plan_id: string;
  billing_cycle: BillingCycle;
  payment_method: PaymentMethod;
  accept_marketing: boolean;
  registration_type: RegistrationType;
}

export interface StartRegistrationResponse {
  success: boolean;
  message: string;
  provider?: string;
  payment_method?: PaymentMethod;
  checkout_url?: string;
  payment_url?: string;
  redirect_url?: string;
  pending_registration_id?: string;
  hotel?: {
    hotel_slug?: string;
    hotel_name?: string;
  };
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
});

export const hotelRegistrationService = {
  async startRegistration(
    payload: StartRegistrationPayload,
  ): Promise<StartRegistrationResponse> {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (key === "image") return;
      formData.append(key, String(value));
    });

    if (payload.image) {
      formData.append("image", payload.image);
    }

    const res = await api.post("/api/hotel/register/start", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  getPlanPrice(plan: SubscriptionPlan | undefined, billingCycle: BillingCycle) {
    if (!plan) return 0;
    return Number(
      billingCycle === "monthly" ? plan.price_per_month : plan.price_per_year,
    );
  },

  getBillingLabel(billingCycle: BillingCycle) {
    return billingCycle === "monthly" ? "/month" : "/year";
  },

  getPaymentMethodLabel(method: PaymentMethod) {
    switch (method) {
      case "esewa":
        return "eSewa";
      case "khalti":
        return "Khalti";
      case "fonepay":
        return "Fonepay";
      default:
        return method;
    }
  },

  formatPrice(value: number | string) {
    const num = Number(value || 0);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  },
};