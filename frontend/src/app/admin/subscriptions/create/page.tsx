// app/admin/subscriptions/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { createSubscription } from '@/store/slices/adminSubscription';
import { 
  Save, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle,
  Users,
  Table,
  Menu,
  DollarSign,
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_code: '',
    description: '',
    price_per_month: '',
    price_per_year: '',
    max_staff: '5',
    max_tables: '10',
    max_menu_items: '50',
    display_order: '0',
    is_active: true,
    features: {
      online_ordering: true,
      basic_reports: true,
      email_support: true,
      table_reservations: false,
      advanced_reports: false,
      priority_support: false
    }
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.plan_name.trim()) {
      newErrors.plan_name = 'Plan name is required';
    }

    if (!formData.plan_code.trim()) {
      newErrors.plan_code = 'Plan code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.plan_code)) {
      newErrors.plan_code = 'Plan code must contain only uppercase letters, numbers, and underscores';
    }

    if (!formData.price_per_month) {
      newErrors.price_per_month = 'Price is required';
    } else if (parseFloat(formData.price_per_month) < 0) {
      newErrors.price_per_month = 'Price cannot be negative';
    }

    if (formData.price_per_year && parseFloat(formData.price_per_year) < 0) {
      newErrors.price_per_year = 'Price cannot be negative';
    }

    if (parseInt(formData.max_staff) < 1) {
      newErrors.max_staff = 'Max staff must be at least 1';
    }

    if (parseInt(formData.max_tables) < 1) {
      newErrors.max_tables = 'Max tables must be at least 1';
    }

    if (parseInt(formData.max_menu_items) < 1) {
      newErrors.max_menu_items = 'Max menu items must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        price_per_month: parseFloat(formData.price_per_month),
        price_per_year: formData.price_per_year ? parseFloat(formData.price_per_year) : 0,
        max_staff: parseInt(formData.max_staff),
        max_tables: parseInt(formData.max_tables),
        max_menu_items: parseInt(formData.max_menu_items),
        display_order: parseInt(formData.display_order)
      };
      const result = await dispatch(createSubscription(submissionData)).unwrap();
      if (result.success) {
        router.push('/admin/subscriptions');
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: checked
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/subscriptions"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Subscription Plan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a new subscription plan for hotels
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plan_name"
                value={formData.plan_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.plan_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Premium Plan"
              />
              {errors.plan_name && (
                <p className="mt-1 text-xs text-red-500">{errors.plan_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plan_code"
                value={formData.plan_code}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.plan_code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., PREMIUM_2024"
              />
              {errors.plan_code && (
                <p className="mt-1 text-xs text-red-500">{errors.plan_code}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the plan features and benefits..."
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Month <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="price_per_month"
                  value={formData.price_per_month}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price_per_month ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="29.99"
                />
              </div>
              {errors.price_per_month && (
                <p className="mt-1 text-xs text-red-500">{errors.price_per_month}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Year
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="price_per_year"
                  value={formData.price_per_year}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price_per_year ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="299.99"
                />
              </div>
              {errors.price_per_year && (
                <p className="mt-1 text-xs text-red-500">{errors.price_per_year}</p>
              )}
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="inline h-4 w-4 mr-1" />
                Max Staff
              </label>
              <input
                type="number"
                name="max_staff"
                value={formData.max_staff}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.max_staff ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.max_staff && (
                <p className="mt-1 text-xs text-red-500">{errors.max_staff}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Table className="inline h-4 w-4 mr-1" />
                Max Tables
              </label>
              <input
                type="number"
                name="max_tables"
                value={formData.max_tables}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.max_tables ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.max_tables && (
                <p className="mt-1 text-xs text-red-500">{errors.max_tables}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Menu className="inline h-4 w-4 mr-1" />
                Max Menu Items
              </label>
              <input
                type="number"
                name="max_menu_items"
                value={formData.max_menu_items}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.max_menu_items ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.max_menu_items && (
                <p className="mt-1 text-xs text-red-500">{errors.max_menu_items}</p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.features).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => handleFeatureChange(key, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                name="display_order"
                value={formData.display_order}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active (available for selection)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/subscriptions"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Plan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}