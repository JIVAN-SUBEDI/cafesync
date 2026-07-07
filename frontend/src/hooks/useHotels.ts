// hooks/useHotels.ts
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useGetHotelsQuery,
  useGetSubscriptionPlansQuery,
  useToggleHotelStatusMutation,
  useVerifyHotelMutation,
  useDeleteHotelMutation,
  useExportHotelsMutation,
  HotelFilters,
} from "@/store/api/hotelApi";
import { debounce } from "lodash";

export const useHotels = (initialFilters?: Partial<HotelFilters>) => {
  const router = useRouter();
  const [filters, setFilters] = useState<Partial<HotelFilters>>(
    initialFilters || {},
  );
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const { data, error, isLoading, isFetching, refetch } = useGetHotelsQuery(
    filters,
    {
      refetchOnFocus: false,
      // staleTime: 5 * 60 * 1000,
    },
  );

  const { data: plansData } = useGetSubscriptionPlansQuery(undefined, {
    // staleTime: 10 * 60 * 1000,
  });

  const [toggleStatus, { isLoading: isToggling }] =
    useToggleHotelStatusMutation();
  const [verifyHotel, { isLoading: isVerifying }] = useVerifyHotelMutation();
  const [deleteHotel, { isLoading: isDeleting }] = useDeleteHotelMutation();
  const [exportHotels, { isLoading: isExporting }] = useExportHotelsMutation();

  const hotels = data?.data || [];
  const pagination = data?.pagination;
  const plans = plansData?.data || [];

  const updateFilters = useCallback((newFilters: Partial<HotelFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        updateFilters({ search: value });
      }, 500),
    [updateFilters],
  );

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatus(id).unwrap();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await verifyHotel(id).unwrap();
    } catch (error) {
      console.error("Failed to verify hotel:", error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setHotelToDelete(id);
    setShowDeleteModal(true);
    setActionMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (hotelToDelete) {
      try {
        await deleteHotel(hotelToDelete).unwrap();
        setShowDeleteModal(false);
        setHotelToDelete(null);
        setSelectedHotels((prev) => prev.filter((id) => id !== hotelToDelete));
      } catch (error) {
        console.error("Failed to delete hotel:", error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportHotels(filters).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hotels_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export hotels:", error);
    }
  };

  const handleSelectAll = useCallback(() => {
    if (selectedHotels.length === hotels.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels(hotels.map((h) => h.id));
    }
  }, [hotels, selectedHotels]);

  const handleSelectHotel = useCallback((id: string) => {
    setSelectedHotels((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  }, []);

  return {
    hotels,
    pagination,
    filters,
    isLoading,
    isFetching,
    error,
    plans,
    selectedHotels,
    actionMenu,
    setActionMenu,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    isToggling,
    isVerifying,
    isExporting,
    refetch,
    updateFilters,
    goToPage,
    handleSearch,
    handleToggleStatus,
    handleVerify,
    handleDeleteClick,
    handleDeleteConfirm,
    handleExport,
    handleSelectAll,
    handleSelectHotel,
  };
};
