// app/admin/terms/create/page.tsx
// app/admin/terms/[id]/edit/page.tsx (reuse the same component)

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Shield,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchTermsById,
  createTerms,
  updateTerms,
  clearCurrentTerm,
  clearTermsError,
  clearTermsSuccess,
} from "@/store/slices/termsSlice";

interface TermFormData {
  title: string;
  content: string;
  version: string;
  type: "platform" | "hotel" | "privacy" | "cancellation";
  applies_to: "all" | "hotels" | "customers" | "staff";
  is_active: boolean;
  is_mandatory: boolean;
  effective_from: string;
  effective_until: string;
}

const initialFormData: TermFormData = {
  title: "",
  content: "",
  version: "1.0.0",
  type: "platform",
  applies_to: "all",
  is_active: true,
  is_mandatory: true,
  effective_from: new Date().toISOString().split("T")[0],
  effective_until: "",
};

const termTypeOptions = [
  { value: "platform", label: "Platform Terms", icon: Globe, color: "blue" },
  { value: "hotel", label: "Hotel Terms", icon: Building2, color: "green" },
  { value: "privacy", label: "Privacy Policy", icon: Shield, color: "purple" },
  { value: "cancellation", label: "Cancellation Policy", icon: AlertTriangle, color: "red" },
];

function TermFormLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
    </div>
  );
}

function TermFormContent() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const isEdit = params?.id && params.id !== "create";
  const termId = isEdit ? (params.id as string) : null;

  const { currentTerm, loading, actionLoading, error, success } = useSelector(
    (state: RootState) => state.terms
  );

  const [formData, setFormData] = useState<TermFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && termId) {
      dispatch(fetchTermsById(termId));
    }

    return () => {
      dispatch(clearCurrentTerm());
    };
  }, [dispatch, isEdit, termId]);

  useEffect(() => {
    if (currentTerm && isEdit) {
      setFormData({
        title: currentTerm.title,
        content: currentTerm.content,
        version: currentTerm.version,
        type: currentTerm.type,
        applies_to: currentTerm.applies_to,
        is_active: currentTerm.is_active,
        is_mandatory: currentTerm.is_mandatory,
        effective_from: currentTerm.effective_from.split("T")[0],
        effective_until: currentTerm.effective_until
          ? currentTerm.effective_until.split("T")[0]
          : "",
      });
    }
  }, [currentTerm, isEdit]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearTermsError());
    }
    if (success) {
      toast.success(success);
      dispatch(clearTermsSuccess());
      router.push("/admin/terms");
    }
  }, [error, success, dispatch, router]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    if (!formData.content.trim()) {
      errors.content = "Content is required";
    }
    if (!formData.version.trim()) {
      errors.version = "Version is required";
    }
    if (!formData.effective_from) {
      errors.effective_from = "Effective date is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      title: formData.title,
      content: formData.content,
      version: formData.version,
      type: formData.type,
      applies_to: formData.applies_to,
      is_active: formData.is_active,
      is_mandatory: formData.is_mandatory,
      effective_from: formData.effective_from,
      effective_until: formData.effective_until || null,
    };

    if (isEdit && termId) {
      await dispatch(updateTerms({ id: termId, data: submitData })).unwrap();
    } else {
      await dispatch(createTerms(submitData)).unwrap();
    }
  };

  const handleBack = () => {
    router.push("/admin/terms");
  };

  if (loading && isEdit) {
    return <TermFormLoading />;
  }

  const getTermTypeIcon = (type: string) => {
    const option = termTypeOptions.find((opt) => opt.value === type);
    if (option) {
      const Icon = option.icon;
      return <Icon className="h-5 w-5" />;
    }
    return <Globe className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Terms
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "Edit Term" : "Create New Term"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit
              ? "Update the terms and conditions"
              : "Add a new term or policy"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.title ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g., Terms of Service"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version *
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.version ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="1.0.0"
                  />
                  {formErrors.version && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.version}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as TermFormData["type"],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {termTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) =>
                      setFormData({ ...formData, effective_from: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.effective_from
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.effective_from && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.effective_from}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.effective_until}
                    onChange={(e) =>
                      setFormData({ ...formData, effective_until: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applies To *
                </label>
                <select
                  value={formData.applies_to}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applies_to: e.target.value as TermFormData["applies_to"],
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="hotels">Hotels Only</option>
                  <option value="staff">Staff Only</option>
                  <option value="customers">Customers Only</option>
                </select>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_mandatory}
                    onChange={(e) =>
                      setFormData({ ...formData, is_mandatory: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Mandatory (users must accept)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Content *
            </h2>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={15}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                formErrors.content ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter the full terms and conditions content here..."
            />
            {formErrors.content && (
              <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Tip: Use paragraphs with blank lines for better readability. HTML
              tags are not supported.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {isEdit ? "Update Term" : "Create Term"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TermFormPage() {
  return (
    <Suspense fallback={<TermFormLoading />}>
      <TermFormContent />
    </Suspense>
  );
}