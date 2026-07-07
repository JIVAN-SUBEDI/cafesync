// app/admin/terms/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchAllTerms,
  deleteTerms,
  setTermsFilters,
  resetTermsFilters,
  clearTermsError,
  clearTermsSuccess,
} from "@/store/slices/termsSlice";
import { TermsAndConditions } from "@/types/terms";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Globe,
  Lock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// Loading component
function TermsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading terms...</p>
      </div>
    </div>
  );
}

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

// Term Type Badge
const TermTypeBadge = ({ type }: { type: string }) => {
  const config = {
    platform: {
      color: "bg-blue-100 text-blue-800",
      icon: <Globe className="h-3 w-3" />,
      label: "Platform Terms",
    },
    privacy: {
      color: "bg-purple-100 text-purple-800",
      icon: <Shield className="h-3 w-3" />,
      label: "Privacy Policy",
    },
    cancellation: {
      color: "bg-red-100 text-red-800",
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "Cancellation Policy",
    },
  };

  const { color, icon, label } =
    config[type as keyof typeof config] || config.platform;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}
    >
      {icon}
      {label}
    </span>
  );
};

// Status Badge
const StatusBadge = ({
  isActive,
  isMandatory,
}: {
  isActive: boolean;
  isMandatory: boolean;
}) => {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <XCircle className="h-3 w-3" />
        Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="h-3 w-3" />
      Active
      {isMandatory && (
        <span className="ml-1 text-xs font-bold">(Mandatory)</span>
      )}
    </span>
  );
};

// Main Terms Content Component
function TermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const { terms, loading, error, success, pagination, filters } = useSelector(
    (state: RootState) => state.terms
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>(
    searchParams?.get("type") || ""
  );
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Update type filter from URL
  useEffect(() => {
    const typeParam = searchParams?.get("type");
    if (typeParam && typeParam !== selectedType) {
      setSelectedType(typeParam);
      dispatch(setTermsFilters({ type: typeParam, page: 1 }));
    }
  }, [searchParams, dispatch, selectedType]);

  // Fetch terms when filters change
  useEffect(() => {
    dispatch(fetchAllTerms(filters));
  }, [dispatch, filters]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        dispatch(setTermsFilters({ search: searchTerm, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch, filters.search]);

  // Handle type filter
  useEffect(() => {
    dispatch(setTermsFilters({ type: selectedType || undefined, page: 1 }));
  }, [selectedType, dispatch]);

  // Show toast for errors and success
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearTermsError());
    }
    if (success) {
      toast.success(success);
      dispatch(clearTermsSuccess());
    }
  }, [error, success, dispatch]);

  const handlePageChange = (newPage: number) => {
    dispatch(setTermsFilters({ page: newPage }));
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this term? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await dispatch(deleteTerms(id)).unwrap();
      toast.success("Term deleted successfully");
    } catch (err: any) {
      toast.error(err || "Failed to delete term");
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (id: string) => {
    router.push(`/admin/terms/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/terms/${id}/edit`);
  };

  const handleCreate = () => {
    router.push("/admin/terms/create");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    dispatch(resetTermsFilters());
  };

  const handleRefresh = () => {
    dispatch(fetchAllTerms(filters));
  };

  const totalPages = pagination?.pages || 1;
  const currentPage = pagination?.page || 1;

  // Filter terms by type for display
  const filteredTerms = selectedType
    ? terms.filter((term) => term.type === selectedType)
    : terms;

  const getTypeTitle = () => {
    switch (selectedType) {
      case "platform":
        return "Platform Terms";
      case "privacy":
        return "Privacy Policy";
      case "cancellation":
        return "Cancellation Policy";
      default:
        return "All Terms";
    }
  };

  const getTypeDescription = () => {
    switch (selectedType) {
      case "platform":
        return "Manage platform terms of service and user agreements";
      case "privacy":
        return "Manage privacy policy and data protection terms";
      case "cancellation":
        return "Manage cancellation and refund policy terms";
      default:
        return "Manage all terms and conditions including platform terms, privacy policy, and cancellation policy";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getTypeTitle()}
              </h1>
              <p className="mt-2 text-gray-600">{getTypeDescription()}</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
            >
              <Plus className="h-5 w-5" />
              Create New Term
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or content..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="h-5 w-5 text-gray-500" />
                  Filters
                </button>

                <button
                  onClick={handleRefresh}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="h-5 w-5 text-gray-500" />
                </button>

                {(searchTerm || selectedType) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Extended Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Term Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Types</option>
                      <option value="platform">Platform Terms</option>
                      <option value="privacy">Privacy Policy</option>
                      <option value="cancellation">Cancellation Policy</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terms Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading && filteredTerms.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No terms found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first term
              </p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700"
              >
                <Plus className="h-5 w-5" />
                Create Term
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title & Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Effective From
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applies To
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTerms.map((term: TermsAndConditions) => (
                      <tr
                        key={term.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {term.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                Version {term.version}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                {term.content.substring(0, 100)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <TermTypeBadge type={term.type} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            isActive={term.is_active}
                            isMandatory={term.is_mandatory}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(term.effective_from)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {term.applies_to === "all"
                              ? "All Users"
                              : term.applies_to === "hotels"
                              ? "Hotels"
                              : term.applies_to === "staff"
                              ? "Staff"
                              : "Customers"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(term.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(term.id)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(term.id)}
                              disabled={deletingId === term.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === term.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * (pagination?.limit || 10) + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * (pagination?.limit || 10),
                        pagination?.total || 0
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination?.total || 0}</span>{" "}
                    results
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? "bg-blue-500 text-white"
                                  : "border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Export with Suspense boundary
export default function TermsPage() {
  return (
    <Suspense fallback={<TermsLoading />}>
      <TermsContent />
    </Suspense>
  );
}