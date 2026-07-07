"use client";

import { useCallback, useMemo, useState } from "react";
import {
  hotelRegistrationService,
  type HotelRegistrationForm,
  type RegistrationType,
  type SubscriptionPlan,
} from "@/services/hotelRegistration.service";

export function useHotelRegistration(params: {
  registrationType: RegistrationType;
  initialPlanId?: string;
  plans: SubscriptionPlan[];
  platformTerms?: any;
  privacyPolicy?: any;
  cancellationPolicy?: any;
}) {
  const {
    registrationType,
    initialPlanId = "",
    plans,
    platformTerms,
    privacyPolicy,
    cancellationPolicy,
  } = params;

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<HotelRegistrationForm>({
    hotel_name: "",
    hotel_slug: "",
    admin_email: "",
    admin_password: "",
    admin_confirm_password: "",
    admin_name: "",
    admin_phone: "",
    hotel_phone: "",
    hotel_address: "",
    image: null,
    city: "",
    country: "",
    timezone: "",
    currency: "",
    tax_rate: 10,
    service_charge: 5,
    subscription_plan_id: initialPlanId,
    billing_cycle: "yearly",
    payment_method: "esewa",
    accept_terms: false,
    accept_marketing: false,
    accepted_terms_ids: [],
  });

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === formData.subscription_plan_id),
    [plans, formData.subscription_plan_id],
  );

  const setFieldError = useCallback((field: string, message: string) => {
    setFormErrors((prev) => {
      if (prev[field] === message) return prev;
      return { ...prev, [field]: message };
    });
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const updateFormData = useCallback(
    (field: keyof HotelRegistrationForm, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      clearFieldError(field);
    },
    [clearFieldError],
  );

  const validateStep = useCallback(
    (step: number) => {
      const errors: Record<string, string> = {};

      switch (step) {
        case 1:
          if (!formData.hotel_name.trim()) errors.hotel_name = "Hotel name is required";
          if (!formData.hotel_slug.trim()) errors.hotel_slug = "URL slug is required";
          break;

        case 2:
          if (!formData.admin_name.trim()) errors.admin_name = "Admin name is required";
          if (!formData.admin_email.trim()) errors.admin_email = "Email is required";
          if (!formData.admin_password.trim()) errors.admin_password = "Password is required";
          if (formData.admin_password !== formData.admin_confirm_password) {
            errors.admin_confirm_password = "Passwords do not match";
          }
          break;

        case 3:
          if (!formData.hotel_phone.trim()) errors.hotel_phone = "Hotel phone number is required";
          if (!formData.hotel_address.trim()) errors.hotel_address = "Address is required";
          if (!formData.city.trim()) errors.city = "City is required";
          if (!formData.country.trim()) errors.country = "Country is required";
          break;

        case 4:
          if (!formData.timezone.trim()) errors.timezone = "Timezone is required";
          if (!formData.currency.trim()) errors.currency = "Currency is required";
          break;

        case 5:
          if (!formData.subscription_plan_id) errors.subscription_plan_id = "Please select a plan";
          if (!formData.billing_cycle) errors.billing_cycle = "Please select billing cycle";
          if (!formData.payment_method) errors.payment_method = "Please select payment method";
          break;

        case 6: {
          if (!formData.accept_terms) {
            errors.accept_terms = "You must accept the terms of service";
          }

          const allTermIds = [
            platformTerms?.id,
            privacyPolicy?.id,
            cancellationPolicy?.id,
          ].filter(Boolean);

          if (
            allTermIds.length > 0 &&
            formData.accepted_terms_ids.length < allTermIds.length
          ) {
            errors.accept_terms = "Please accept all terms and conditions";
          }
          break;
        }
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    },
    [formData, platformTerms, privacyPolicy, cancellationPolicy],
  );

  const handleNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
    }
  }, [currentStep, validateStep]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmitRegistration = useCallback(async () => {
    for (let step = 1; step <= 6; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        throw new Error("Please complete all required fields correctly");
      }
    }

    setSubmitting(true);
    try {
      return await hotelRegistrationService.startRegistration({
        hotel_name: formData.hotel_name,
        hotel_slug: formData.hotel_slug,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        admin_name: formData.admin_name,
        admin_phone: formData.admin_phone,
        image: formData.image,
        hotel_phone: formData.hotel_phone,
        hotel_address: formData.hotel_address,
        city: formData.city,
        country: formData.country,
        timezone: formData.timezone,
        currency: formData.currency,
        tax_rate: formData.tax_rate,
        service_charge: formData.service_charge,
        subscription_plan_id: formData.subscription_plan_id,
        billing_cycle: formData.billing_cycle,
        payment_method: formData.payment_method,
        accept_marketing: formData.accept_marketing,
        registration_type: registrationType,
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, registrationType, validateStep]);

  return {
    formData,
    formErrors,
    currentStep,
    submitting,
    selectedPlan,
    setCurrentStep,
    setFieldError,
    clearFieldError,
    updateFormData,
    validateStep,
    handleNextStep,
    handlePrevStep,
    handleSubmitRegistration,
  };
}