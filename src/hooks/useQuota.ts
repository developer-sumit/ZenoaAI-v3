import {useState, useEffect, useCallback} from 'react';
import {userAPI} from '@src/services/axiosServer';
import {useAuthStore} from '@src/store/authStore';

interface QuotaData {
  imagesRemaining: number;
  apiCallsRemaining: number;
  refreshAt: string;
}

export const useQuota = () => {
  const {user} = useAuthStore();
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const fetchQuota = useCallback(async () => {
    if (!isAuthenticated) {
      setQuota(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await userAPI.checkQuota();

      if (response.data.success) {
        setQuota(response.data.quota);
      } else {
        throw new Error(response.data.message || 'Failed to fetch quota');
      }
    } catch (err: any) {
      console.error('Failed to fetch quota:', err);
      setError(err.message || 'Failed to fetch quota');

      // Set default quota for fallback
      setQuota({
        imagesRemaining: 0,
        apiCallsRemaining: 0,
        refreshAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refetch = useCallback(() => {
    return fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Check if user has quota for image generation
  const hasImageQuota = quota ? quota.imagesRemaining > 0 : false;
  const hasApiQuota = quota ? quota.apiCallsRemaining > 0 : false;

  return {
    quota,
    isLoading,
    error,
    hasImageQuota,
    hasApiQuota,
    refetch,
  };
};
