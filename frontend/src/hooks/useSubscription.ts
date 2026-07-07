// // hooks/useSubscription.ts
// import { useEffect, useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   useGetSubscriptionsQuery,
//   useGetSubscriptionByIdQuery,
//   useCreateSubscriptionMutation,
//   useUpdateSubscriptionMutation,
//   useDeleteSubscriptionMutation,
//   useToggleSubscriptionStatusMutation,
// } from '@/services/subscriptionApi';
// import { SubscriptionFilters, SubscriptionFormData } from '@/types/subscription';

// export const useSubscriptions = (initialFilters?: Partial<SubscriptionFilters>) => {
//   const [filters, setFilters] = useState<Partial<SubscriptionFilters>>(initialFilters || {});
  
//   const {
//     data,
//     error,
//     isLoading,
//     isFetching,
//     refetch
//   } = useGetSubscriptionsQuery(filters, {
//     // Don't refetch on window focus to reduce API calls
//     refetchOnFocus: false,
//     // Keep cached data for 5 minutes
//     // staleTime: 5 * 60 * 1000,
//   });

//   const updateFilters = useCallback((newFilters: Partial<SubscriptionFilters>) => {
//     setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
//   }, []);

//   const goToPage = useCallback((page: number) => {
//     setFilters(prev => ({ ...prev, page }));
//   }, []);

//   return {
//     subscriptions: data?.data || [],
//     pagination: data?.pagination,
//     filters,
//     isLoading,
//     isFetching,
//     error,
//     refetch,
//     updateFilters,
//     goToPage,
//   };
// };

// export const useSubscription = (id: string) => {
//   const router = useRouter();
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
  
//   const {
//     data,
//     error,
//     isLoading,
//     refetch
//   } = useGetSubscriptionByIdQuery(id, {
//     // Skip if no id
//     skip: !id,
//     // Keep cached data for 5 minutes
//     // staleTime: 5 * 60 * 1000,
//   });

//   const [deleteSubscription, { isLoading: isDeleting }] = useDeleteSubscriptionMutation();
//   const [toggleStatus, { isLoading: isToggling }] = useToggleSubscriptionStatusMutation();
//   const [updateSubscription, { isLoading: isUpdating }] = useUpdateSubscriptionMutation();

//   const subscription = data?.data;

//   const handleDelete = async () => {
//     try {
//       const result = await deleteSubscription(id).unwrap();
//       if (result.success) {
//         router.push('/admin/subscriptions');
//       }
//       setShowDeleteModal(false);
//     } catch (error) {
//       console.error('Failed to delete subscription:', error);
//     }
//   };

//   const handleToggleStatus = async () => {
//     try {
//       await toggleStatus(id).unwrap();
//     } catch (error) {
//       console.error('Failed to toggle status:', error);
//     }
//   };

//   const handleUpdate = async (formData: Partial<SubscriptionFormData>) => {
//     try {
//       const result = await updateSubscription({ id, data: formData }).unwrap();
//       return result;
//     } catch (error) {
//       throw error;
//     }
//   };

//   return {
//     subscription,
//     isLoading,
//     error,
//     isDeleting,
//     isToggling,
//     isUpdating,
//     showDeleteModal,
//     setShowDeleteModal,
//     handleDelete,
//     handleToggleStatus,
//     handleUpdate,
//     refetch,
//   };
// };

// export const useCreateSubscription = () => {
//   const router = useRouter();
//   const [createSubscription, { isLoading, error }] = useCreateSubscriptionMutation();

//   const handleCreate = async (formData: SubscriptionFormData) => {
//     try {
//       const result = await createSubscription(formData).unwrap();
//       if (result.success) {
//         router.push('/admin/subscriptions');
//       }
//       return result;
//     } catch (error) {
//       throw error;
//     }
//   };

//   return {
//     createSubscription: handleCreate,
//     isLoading,
//     error,
//   };
// };










// hooks/useSubscription.ts
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetSubscriptionsQuery,
  useGetSubscriptionByIdQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useToggleSubscriptionStatusMutation,
} from '@/store/api/subscriptionApi';
import { SubscriptionFilters, SubscriptionFormData } from '@/types/subscription';

export const useSubscriptions = (initialFilters?: Partial<SubscriptionFilters>) => {
  const [filters, setFilters] = useState<Partial<SubscriptionFilters>>(initialFilters || {});
  
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch
  } = useGetSubscriptionsQuery(filters, {
    refetchOnFocus: false,
    // staleTime: 5 * 60 * 1000,
  });

  const updateFilters = useCallback((newFilters: Partial<SubscriptionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  return {
    subscriptions: data?.data || [],
    pagination: data?.pagination,
    filters,
    isLoading,
    isFetching,
    error,
    refetch,
    updateFilters,
    goToPage,
  };
};

export const useSubscription = (id: string) => {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const {
    data,
    error,
    isLoading,
    refetch
  } = useGetSubscriptionByIdQuery(id, {
    skip: !id,
    // staleTime: 5 * 60 * 1000,
  });

  const [deleteSubscription, { isLoading: isDeleting }] = useDeleteSubscriptionMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleSubscriptionStatusMutation();
  const [updateSubscription, { isLoading: isUpdating }] = useUpdateSubscriptionMutation();

  const subscription = data?.data;

  const handleDelete = async () => {
    try {
      const result = await deleteSubscription(id).unwrap();
      if (result.success) {
        router.push('/admin/subscriptions');
      }
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await toggleStatus(id).unwrap();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleUpdate = async (formData: Partial<SubscriptionFormData>) => {
    try {
      const result = await updateSubscription({ id, data: formData }).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    subscription,
    isLoading,
    error,
    isDeleting,
    isToggling,
    isUpdating,
    showDeleteModal,
    setShowDeleteModal,
    handleDelete,
    handleToggleStatus,
    handleUpdate,
    refetch,
  };
};

// New hook for delete operation
export const useDeleteSubscription = () => {
  const [deleteSubscription, { isLoading: isDeleting }] = useDeleteSubscriptionMutation();

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteSubscription(id).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      throw error;
    }
  };

  return {
    deleteSubscription: handleDelete,
    isDeleting,
  };
};

export const useCreateSubscription = () => {
  const router = useRouter();
  const [createSubscription, { isLoading, error }] = useCreateSubscriptionMutation();

  const handleCreate = async (formData: SubscriptionFormData) => {
    try {
      const result = await createSubscription(formData).unwrap();
      if (result.success) {
        router.push('/admin/subscriptions');
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    createSubscription: handleCreate,
    isLoading,
    error,
  };
};