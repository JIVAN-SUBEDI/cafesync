// hooks/useTerms.ts
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import {
  fetchActiveTerms,
  acceptTerms,
  checkTermsAcceptance,
  clearTermsError,
  clearTermsSuccess,
} from '@/store/slices/termsSlice';

export const useTerms = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    platformTerms,
    privacyPolicy,
    cancellationPolicy,
    loading,
    actionLoading,
    error,
    success,
  } = useSelector((state: RootState) => state.terms);

  // Fetch all active terms on mount
  useEffect(() => {
    const fetchAllActiveTerms = async () => {
      await dispatch(fetchActiveTerms({ type: 'platform' }));
      await dispatch(fetchActiveTerms({ type: 'privacy' }));
      await dispatch(fetchActiveTerms({ type: 'cancellation' }));
    };
    
    fetchAllActiveTerms();
  }, [dispatch]);

  const handleAcceptTerms = useCallback(async (
    termId: string,
    userType: 'hotel_admin' | 'staff' | 'customer'
  ) => {
    return dispatch(acceptTerms({ termId, userType })).unwrap();
  }, [dispatch]);

  const handleCheckAcceptance = useCallback(async (termId: string) => {
    return dispatch(checkTermsAcceptance(termId)).unwrap();
  }, [dispatch]);

  const clearMessages = useCallback(() => {
    dispatch(clearTermsError());
    dispatch(clearTermsSuccess());
  }, [dispatch]);

    const refetch = () => {
    dispatch(fetchActiveTerms());
  };

  return {
    // State
    platformTerms,
    privacyPolicy,
    cancellationPolicy,
    loading,
    actionLoading,
    error,
    success,
    refetch,
    // Actions
    acceptTerms: handleAcceptTerms,
    checkAcceptance: handleCheckAcceptance,
    clearMessages,
  };
};