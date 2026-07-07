
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import {
  fetchDashboardData,
  refreshDashboardData,
  exportDashboardData,
  setFilters,
  clearError
} from '@/store/slices/adminDashboardSlice';
import { DashboardFilters } from '@/types/dashboard';

export const useDashboard = (autoFetch = true) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const adminDashboardState = useSelector((state: RootState) => state.adminDashboard);
  
  const {
    data = null,
    filters = { range: '30d' },
    status = 'idle',
    error = null,
    lastFetched = null,
    exportStatus = 'idle'
  } = adminDashboardState || {};

  const isLoading = status === 'loading';
  const isError = status === 'failed';
  const isSuccess = status === 'succeeded';
  const isExporting = exportStatus === 'loading';

  const fetchData = useCallback((newFilters?: DashboardFilters) => {
    return dispatch(fetchDashboardData(newFilters)).unwrap();
  }, [dispatch]);

  const refresh = useCallback(() => {
    return dispatch(refreshDashboardData()).unwrap();
  }, [dispatch]);

  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const exportData = useCallback((type: 'hotels' | 'transactions') => {
    return dispatch(exportDashboardData({ type })).unwrap();
  }, [dispatch]);

  const resetError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (autoFetch && filters) {
      fetchData(filters);
    }
  }, [autoFetch, filters, fetchData]);

  return {
    data,
    filters: filters || { range: '30d' },
    isLoading,
    isError,
    isSuccess,
    isExporting,
    error,
    lastFetched,
    fetchData,
    refresh,
    updateFilters,
    exportData,
    resetError
  };
};