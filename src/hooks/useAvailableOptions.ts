import {useState, useEffect, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import optionsService, {OptionsResponse} from '@src/services/optionsService';
import {useAuthStore} from '@src/store/authStore';

export const useAvailableOptions = () => {
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {user} = useAuthStore();

  const fetchOptions = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await optionsService.getAvailableOptions(forceRefresh);
      setOptions(data);
    } catch (err: any) {
      console.error('Error fetching options:', err);
      setError(err.message || 'Failed to fetch options');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch options when component mounts or user changes
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions, user?.uid]);

  // Refresh options when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (options) {
        // Only refresh if we have stale data (older than 5 minutes)
        const now = Date.now();
        const lastFetch = optionsService['lastFetch'] || 0;
        const isStale = now - lastFetch > 5 * 60 * 1000;

        if (isStale) {
          fetchOptions(true);
        }
      }
    }, [fetchOptions, options]),
  );

  const refreshOptions = useCallback(() => {
    fetchOptions(true);
  }, [fetchOptions]);

  return {
    options,
    loading,
    error,
    refreshOptions,
    // Helper methods
    isFeatureAvailable: (feature: string) =>
      optionsService.isFeatureAvailable(feature as any),
    isEngineAvailable: (engine: string) =>
      optionsService.isEngineAvailable(engine as any),
    isAspectRatioAvailable: (ratio: string) =>
      optionsService.isAspectRatioAvailable(ratio),
    isSizeAvailable: (size: string) =>
      optionsService.isSizeAvailable(size as any),
    getMaxBatchCount: () => optionsService.getMaxBatchCount(),
  };
};
