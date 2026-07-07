// app/admin/terms/[id]/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Users,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchTermsById,
  deleteTerms,
  clearCurrentTerm,
  clearTermsError,
} from "@/store/slices/termsSlice";

function TermDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
    </div>
  );
}

function TermDetailContent() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const termId = params.id as string;

  const { currentTerm, loading, error, actionLoading } = useSelector(
    (state: RootState) => state.terms
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (termId) {
      dispatch(fetchTermsById(termId));
    }

    return () => {
      dispatch(clearCurrentTerm());
    };
  }, [dispatch, termId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearTermsError());
    }
  }, [error, dispatch]);

  const handleEdit = () => {
    router.push(`/admin/terms/${termId}/edit`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this term? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await dispatch(deleteTerms(termId)).unwrap();
      toast.success("Term deleted successfully");
      router.push("/admin/terms");
    } catch (err: any) {
      toast.error(err || "Failed to delete term");
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    router.push("/admin/terms");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTermTypeConfig = (type: string) => {
    const config = {
      platform: {
        color: "bg-blue-100 text-blue-800",
        icon: <Globe className="h-4 w-4" />,
        label: "Platform Terms",
      },
      privacy: {
        color: "bg-purple-100 text-purple-800",
        icon: <Shield className="h-4 w-4" />,
        label: "Privacy Policy",
      },
      cancellation: {
        color: "bg-red-100 text-red-800",
        icon: <AlertCircle className="h-4 w-4" />,
        label: "Cancellation Policy",
      },
    };
    return config[type as keyof typeof config] || config.platform;
  };

  if (loading) {
    return <TermDetailLoading />;
  }

  if (!currentTerm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Term not found</h3>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Terms
          </button>
        </div>
      </div>
    );
  }

  const termTypeConfig = getTermTypeConfig(currentTerm.type);

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

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${termTypeConfig.color}`}
                >
                  {termTypeConfig.icon}
                  {termTypeConfig.label}
                </span>
                {!currentTerm.is_active && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </span>
                )}
                {currentTerm.is_mandatory && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    <AlertCircle className="h-3 w-3" />
                    Mandatory
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentTerm.title}
              </h1>
              <p className="text-gray-600 mt-1">Version {currentTerm.version}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Meta Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Effective From</p>
              <p className="text-gray-900 flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDate(currentTerm.effective_from)}
              </p>
            </div>
            {currentTerm.effective_until && (
              <div>
                <p className="text-sm text-gray-500">Effective Until</p>
                <p className="text-gray-900 flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(currentTerm.effective_until)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Applies To</p>
              <p className="text-gray-900 capitalize mt-1">
                {currentTerm.applies_to === "all"
                  ? "All Users"
                  : currentTerm.applies_to === "hotels"
                  ? "Hotels"
                  : currentTerm.applies_to === "staff"
                  ? "Staff"
                  : "Customers"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="text-gray-900 mt-1">{formatDate(currentTerm.created_at)}</p>
            </div>
            {currentTerm.created_by_name && (
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="text-gray-900 mt-1">{currentTerm.created_by_name}</p>
              </div>
            )}
            {currentTerm.acceptance_count !== undefined && (
              <div>
                <p className="text-sm text-gray-500">Total Acceptances</p>
                <p className="text-gray-900 mt-1">{currentTerm.acceptance_count}</p>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
          <div className="prose max-w-none">
            {currentTerm.content.split("\n").map((paragraph, index) =>
              paragraph.trim() ? (
                <p key={index} className="mb-4 text-gray-700">
                  {paragraph}
                </p>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TermDetailPage() {
  return (
    <Suspense fallback={<TermDetailLoading />}>
      <TermDetailContent />
    </Suspense>
  );
}