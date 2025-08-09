import {imageAPI} from './axiosServer';
import {EngineType, ImageSize} from '@src/types/image';
import {PlanType} from '@src/types/user';

export interface PlanFeatures {
  privateImages: boolean;
  prioritySupport: boolean;
  batchCount: number;
  highResolution: boolean;
  storage: {
    available: boolean;
    limit: number;
  };
}

export interface AvailableOptions {
  engines: EngineType[];
  aspectRatios: string[];
  sizes: ImageSize[];
  features: PlanFeatures;
}

export interface OptionsResponse {
  isAuthenticated: boolean;
  userPlan: PlanType | null;
  options: AvailableOptions;
}

class OptionsService {
  private cachedOptions: OptionsResponse | null = null;
  private lastFetch: number = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getAvailableOptions(forceRefresh = false): Promise<OptionsResponse> {
    const now = Date.now();

    // Return cached data if available and not expired
    if (
      !forceRefresh &&
      this.cachedOptions &&
      now - this.lastFetch < this.cacheTimeout
    ) {
      console.log('Returning cached options');
      return this.cachedOptions;
    }

    try {
      console.log('Fetching available options from server');
      const response = await imageAPI.getAvailableOptions();

      if (response.data.success && response.data.data) {
        this.cachedOptions = response.data.data;
        this.lastFetch = now;
        console.log('Options fetched successfully:', this.cachedOptions);
        if (this.cachedOptions) {
          return this.cachedOptions;
        } else {
          throw new Error('Failed to fetch options');
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch options');
      }
    } catch (error: any) {
      console.error('Failed to fetch available options:', error);

      // Return fallback options if API fails
      const fallbackOptions: OptionsResponse = {
        isAuthenticated: false,
        userPlan: 'free',
        options: {
          engines: ['quantum'],
          aspectRatios: ['1:1', '3:2', '4:5'],
          sizes: ['small', 'medium'],
          features: {
            privateImages: false,
            prioritySupport: false,
            batchCount: 2,
            highResolution: false,
            storage: {
              available: true,
              limit: 1024,
            },
          },
        },
      };

      console.log('Using fallback options due to API error');
      return fallbackOptions;
    }
  }

  clearCache(): void {
    this.cachedOptions = null;
    this.lastFetch = 0;
  }

  // Helper methods to check specific features
  isFeatureAvailable(feature: keyof PlanFeatures): boolean {
    if (!this.cachedOptions) return false;

    const featureValue = this.cachedOptions.options.features[feature];
    return typeof featureValue === 'boolean' ? featureValue : false;
  }

  isEngineAvailable(engine: EngineType): boolean {
    if (!this.cachedOptions) return false;
    return this.cachedOptions.options.engines.includes(engine);
  }

  isAspectRatioAvailable(ratio: string): boolean {
    if (!this.cachedOptions) return false;
    return this.cachedOptions.options.aspectRatios.includes(ratio);
  }

  isSizeAvailable(size: ImageSize): boolean {
    if (!this.cachedOptions) return false;
    return this.cachedOptions.options.sizes.includes(size);
  }

  getMaxBatchCount(): number {
    if (!this.cachedOptions) return 1;
    return this.cachedOptions.options.features.batchCount;
  }
}

export default new OptionsService();
