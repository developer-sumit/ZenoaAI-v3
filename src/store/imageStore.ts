import {create} from 'zustand';

import {useAuthStore} from './authStore';
import {GeneratedImage} from '@src/types/image';
import imageService from '@src/services/imageService';
import {ImageGenerationRequest} from '@src/types/image';

interface ImageState {
  images: GeneratedImage[];
  publicImages: GeneratedImage[];
  popularImages: GeneratedImage[];
  trendingImages: GeneratedImage[];
  favoriteImages: GeneratedImage[];
  isLoading: boolean;
  isLoadingPublic: boolean;
  isLoadingMore: boolean;
  isLoadingMoreFavorites: boolean;
  error: string | null;
  hasMoreImages: boolean;
  currentPage: number;
  hasMoreFavoriteImages: boolean;
  favoriteCurrentPage: number;

  // Actions
  fetchImages: (
    page?: number,
    limit?: number,
    reset?: boolean,
  ) => Promise<void>;
  loadMoreImages: () => Promise<void>;
  fetchPublicImages: (
    page?: number,
    limit?: number,
    filter?: string,
  ) => Promise<void>;
  fetchFavoriteImages: (
    page?: number,
    limit?: number,
    reset?: boolean,
  ) => Promise<void>;
  loadMoreFavoriteImages: () => Promise<void>;
  generateImage: (settings: ImageGenerationRequest) => Promise<{
    success: boolean;
    data: GeneratedImage | null;
    message: string;
  }>;
  deleteImage: (imageId: string) => Promise<boolean>;
  toggleFavorite: (imageId: string) => Promise<boolean>;
  updatePrivacy: (imageId: string, isPrivate: boolean) => Promise<boolean>;
  flagImage: (imageId: string, reasons: string[]) => Promise<boolean>;
  clearImages: () => void;

  // Add helper methods
  getAvailableQuota: () => number;
  validateBatchGeneration: (requestedCount: number) => {
    canGenerate: boolean;
    adjustedCount: number;
    message?: string;
  };
}

// Debounce utility (simple version)
let favoriteTimeouts: {[key: string]: NodeJS.Timeout} = {};

export const useImageStore = create<ImageState>()((set, get) => ({
  images: [],
  publicImages: [],
  popularImages: [],
  trendingImages: [],
  favoriteImages: [],
  isLoading: false,
  isLoadingPublic: false,
  isLoadingMore: false,
  isLoadingMoreFavorites: false,
  error: null,
  hasMoreImages: true,
  currentPage: 1,
  hasMoreFavoriteImages: true,
  favoriteCurrentPage: 1,

  fetchImages: async (
    page: number = 1,
    limit: number = 20,
    reset: boolean = true,
  ) => {
    try {
      if (reset) {
        set({isLoading: true, error: null, currentPage: 1});
      } else {
        set({isLoadingMore: true, error: null});
      }

      const {success, data, message} = await imageService.getUserImages({
        page,
        limit,
      });

      if (!success || !data) {
        set({error: message || 'Failed to fetch images'});
        return;
      }

      set(state => ({
        images: reset ? data : [...state.images, ...data],
        hasMoreImages: data.length === limit, // If we get less than limit, no more images
        currentPage: page,
      }));
      console.log('🏪 Store: Images state updated successfully');
    } catch (error: any) {
      console.error('🏪 Store: Failed to fetch images:', error);
      const message = error?.message || 'Failed to fetch images';
      set({error: message});
    } finally {
      set({isLoading: false, isLoadingMore: false});
    }
  },

  loadMoreImages: async () => {
    const state = get();
    if (state.isLoadingMore || !state.hasMoreImages) {
      return;
    }

    const nextPage = state.currentPage + 1;
    await get().fetchImages(nextPage, 20, false);
  },

  fetchPublicImages: async (
    page: number = 1,
    limit: number = 20,
    filter: string = 'latest',
  ) => {
    try {
      set({isLoadingPublic: true, error: null});

      const {success, data, message} = await imageService.getPublicImages(
        page,
        limit,
        filter,
      );

      if (!success || !data) {
        set({error: message || 'Failed to fetch public images'});
        return;
      }

      // Handle different filters
      if (page === 1) {
        if (filter === 'popular') {
          set({popularImages: data});
        } else if (filter === 'trending') {
          set({trendingImages: data});
        } else {
          set({publicImages: data});
        }
      } else {
        if (filter === 'popular') {
          set(state => ({
            popularImages: [...state.popularImages, ...data],
          }));
        } else if (filter === 'trending') {
          set(state => ({
            trendingImages: [...state.trendingImages, ...data],
          }));
        } else {
          set(state => ({
            publicImages: [...state.publicImages, ...data],
          }));
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch public images:', error);
      const message = error?.message || 'Failed to fetch public images';
      set({error: message});
    } finally {
      set({isLoadingPublic: false});
    }
  },

  fetchFavoriteImages: async (
    page: number = 1,
    limit: number = 20,
    reset: boolean = true,
  ) => {
    try {
      if (reset) {
        set({
          isLoadingMoreFavorites: true,
          error: null,
          favoriteCurrentPage: 1,
        });
      } else {
        set({isLoadingMoreFavorites: true, error: null});
      }

      const {success, data, message} = await imageService.getFavoriteImages(
        page,
        limit,
      );

      if (!success || !data) {
        set({error: message || 'Failed to fetch favorite images'});
        return;
      }

      set(state => ({
        favoriteImages: reset ? data : [...state.favoriteImages, ...data],
        hasMoreFavoriteImages: data.length === limit,
        favoriteCurrentPage: page,
      }));
    } catch (error: any) {
      console.error('Failed to fetch favorite images:', error);
      const message = error?.message || 'Failed to fetch favorite images';
      set({error: message});
    } finally {
      set({isLoadingMoreFavorites: false});
    }
  },

  loadMoreFavoriteImages: async () => {
    const state = get();
    if (state.isLoadingMoreFavorites || !state.hasMoreFavoriteImages) {
      return;
    }
    const nextPage = state.favoriteCurrentPage + 1;
    await get().fetchFavoriteImages(nextPage, 20, false);
  },

  // Helper to get current available quota
  getAvailableQuota: () => {
    const user = useAuthStore.getState().user;
    return Math.max(0, user?.quota?.imagesRemaining || 0);
  },

  // Validate and adjust batch generation count
  validateBatchGeneration: (requestedCount: number) => {
    const availableQuota = get().getAvailableQuota();

    if (availableQuota <= 0) {
      return {
        canGenerate: false,
        adjustedCount: 0,
        message:
          'No image quota remaining. Please upgrade your plan or wait for quota reset.',
      };
    }

    if (requestedCount <= availableQuota) {
      return {
        canGenerate: true,
        adjustedCount: requestedCount,
      };
    }

    return {
      canGenerate: true,
      adjustedCount: availableQuota,
      message: `Adjusted from ${requestedCount} to ${availableQuota} images based on your remaining quota.`,
    };
  },

  generateImage: async (settings: ImageGenerationRequest) => {
    set({error: null});

    try {
      const {success, data, message} =
        await imageService.generateImage(settings);

      if (!success || !data) {
        set({error: message || 'Failed to generate image'});
        return {
          success: false,
          data: null,
          message: message || 'Failed to generate image',
        };
      }

      // Add the new image(s) to the store
      const imagesToAdd = Array.isArray(data.images)
        ? data.images
        : [data.images];
      set(state => ({
        images: [...imagesToAdd, ...state.images], // Add new images at the beginning
        error: null,
      }));

      if (data.user) {
        useAuthStore.getState().updateUser(data.user);
      } else {
        const user = useAuthStore.getState().user;
        if (user) {
          useAuthStore.getState().updateUser({
            statistics: {
              ...user.statistics,
              imagesGenerated: (user.statistics?.imagesGenerated || 0) + 1,
            },
            quota: {
              ...user.quota,
              imagesRemaining: (user.quota?.imagesRemaining || 0) + 1,
            },
          });
        }
      }

      return {
        success: true,
        data: data.images,
        message: 'Image generated successfully',
      };
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      set({error: 'Failed to generate image'});
      return {
        success: false,
        data: null,
        message: 'Failed to generate image',
      };
    }
  },

  deleteImage: async (imageId: string) => {
    try {
      const success = await imageService.deleteImage(imageId);

      if (success) {
        set(state => ({
          images: state.images.filter(img => img.id !== imageId),
        }));
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      const message = error?.message || 'Failed to delete image';
      set({error: message});
      return false;
    }
  },

  toggleFavorite: async (imageId: string) => {
    const currentImage =
      get().images.find(img => img.id === imageId) ||
      get().publicImages.find(img => img.id === imageId) ||
      get().popularImages.find(img => img.id === imageId) ||
      get().trendingImages.find(img => img.id === imageId) ||
      get().favoriteImages.find(img => img.id === imageId);

    if (!currentImage) {
      console.warn('Image not found for toggling favorite:', imageId);
      return false;
    }

    const wasFavorite = currentImage.isFavorite;

    // Helper to update favorite in all arrays
    const updateFavoriteInArrays = (state: ImageState, revert = false) => {
      const update = (img: GeneratedImage) => {
        if (img.id === imageId) {
          const newIsFavorite = revert ? wasFavorite : !wasFavorite;
          let newFavoriteCount = img.favoriteCount || 0;

          if (revert) {
            // Revert: if it was favorited, decrement. If it was unfavorited, increment.
            newFavoriteCount = wasFavorite
              ? newFavoriteCount - 1
              : newFavoriteCount + 1;
          } else {
            // Optimistic: if it was favorited, decrement. If it was unfavorited, increment.
            newFavoriteCount = wasFavorite
              ? newFavoriteCount - 1
              : newFavoriteCount + 1;
          }
          // Ensure count doesn't go below zero
          newFavoriteCount = Math.max(0, newFavoriteCount);

          return {
            ...img,
            isFavorite: newIsFavorite,
            favoriteCount: newFavoriteCount,
          };
        }
        return img;
      };

      const updatedImages = state.images.map(update);
      const updatedPublicImages = state.publicImages.map(update);
      const updatedTrendingImages = state.trendingImages.map(update);
      const updatedPopularImages = state.popularImages.map(update);
      // For favoriteImages, if we are unfavoriting, we should remove it from the list
      const updatedFavoriteImages = revert
        ? state.favoriteImages.map(update)
        : wasFavorite
          ? state.favoriteImages.filter(img => img.id !== imageId)
          : [
              ...state.favoriteImages,
              {
                ...currentImage,
                isFavorite: true,
                favoriteCount: (currentImage.favoriteCount || 0) + 1,
              },
            ];
      // When adding to favorites, ensure we don't add duplicates and update if already there
      if (!revert && !wasFavorite) {
        const existingFavoriteIndex = updatedFavoriteImages.findIndex(
          img => img.id === imageId,
        );
        if (existingFavoriteIndex === -1) {
          updatedFavoriteImages.push({
            ...currentImage,
            isFavorite: true,
            favoriteCount: (currentImage.favoriteCount || 0) + 1,
          });
        } else {
          updatedFavoriteImages[existingFavoriteIndex] = {
            ...currentImage,
            isFavorite: true,
            favoriteCount: (currentImage.favoriteCount || 0) + 1,
          };
        }
      }

      return {
        images: updatedImages,
        publicImages: updatedPublicImages,
        popularImages: updatedPopularImages,
        favoriteImages: updatedFavoriteImages,
        trendingImages: updatedTrendingImages,
      };
    };

    // Optimistic UI update
    set(state => updateFavoriteInArrays(state));

    // Debounce backend requests per imageId
    if (favoriteTimeouts[imageId]) {
      clearTimeout(favoriteTimeouts[imageId]);
    }

    return new Promise<boolean>(resolve => {
      favoriteTimeouts[imageId] = setTimeout(async () => {
        try {
          const result = await imageService.toggleFavorite(imageId);

          if (!result.success) {
            // Revert UI if backend fails
            set(state => updateFavoriteInArrays(state, true));
            resolve(false);
          } else {
            // If the backend call was successful, and we were trying to unfavorite,
            // we should remove it from the favoriteImages list if it's there.
            if (wasFavorite) {
              set(state => ({
                favoriteImages: state.favoriteImages.filter(
                  img => img.id !== imageId,
                ),
                // Also update favorite count in other arrays based on the backend's final state if needed,
                // but the optimistic update should generally align. If there's a discrepancy, a full refresh
                // of favorite images might be a more robust approach here after a successful toggle.
              }));
            }
            resolve(true);
          }
        } catch (error) {
          // Revert UI on error
          set(state => updateFavoriteInArrays(state, true));
          resolve(false);
        } finally {
          // Clear the timeout reference after the operation is complete
          delete favoriteTimeouts[imageId];
        }
      }, 600); // 600ms debounce
    });
  },

  updatePrivacy: async (imageId: string, isPrivate: boolean) => {
    set(state => ({
      images: state.images.map(img =>
        img.id === imageId ? {...img, isPrivate: !isPrivate} : img,
      ),
    }));

    try {
      const {success} = await imageService.updatePrivacy(imageId, isPrivate);

      if (!success) {
        set(state => ({
          images: state.images.map(img =>
            img.id === imageId ? {...img, isPrivate: !isPrivate} : img,
          ),
        }));
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Failed to update privacy:', error);
      const message = error?.message || 'Failed to update privacy';
      set({error: message});
      return false;
    }
  },

  flagImage: async (imageId: string, reasons: string[]) => {
    set({error: null});
    try {
      // Optimistically update the image's flagged status in the store
      set(state => ({
        images: state.images.map(img =>
          img.id === imageId ? {...img, isFlagged: true} : img,
        ),
        // Filter out the flagged image from public and popular lists immediately
        publicImages: state.publicImages.filter(img => img.id !== imageId),
        popularImages: state.popularImages.filter(img => img.id !== imageId),
        trendingImages: state.trendingImages.filter(img => img.id !== imageId),
      }));

      const {success, message} = await imageService.flagImage(imageId, reasons);

      if (!success) {
        // Revert UI on failure: mark as not flagged and potentially re-add to public/popular if it was there
        set(state => {
          const originalImage = state.images.find(img => img.id === imageId);
          const updatedImages = state.images.map(img =>
            img.id === imageId ? {...img, isFlagged: false} : img,
          );

          let publicImagesToRevert = state.publicImages;
          let popularImagesToRevert = state.popularImages;

          if (originalImage && !originalImage.isPrivate) {
            // Only re-add if it was public before
            const publicIndex = publicImagesToRevert.findIndex(
              img => img.id === imageId,
            );
            if (publicIndex === -1) {
              publicImagesToRevert = [...publicImagesToRevert, originalImage];
            }
            const popularIndex = popularImagesToRevert.findIndex(
              img => img.id === imageId,
            );
            if (popularIndex === -1) {
              popularImagesToRevert = [...popularImagesToRevert, originalImage];
            }
          }

          return {
            images: updatedImages,
            publicImages: publicImagesToRevert,
            popularImages: popularImagesToRevert,
          };
        });
        set({error: message || 'Failed to flag image'});
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('Failed to flag image:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to flag image';
      set({error: message});
      return false;
    }
  },

  clearImages: () => {
    set({
      images: [],
      favoriteImages: [],
      popularImages: [],
      trendingImages: [],
      publicImages: [],
      currentPage: 1,
      hasMoreImages: true,
    });
  },
}));

let lastAuthState = useAuthStore.getState().user;

useAuthStore.subscribe(state => {
  // Only clear if user was authenticated before and now they're not
  if (lastAuthState && !state.user) {
    console.log('User logged out - clearing images');
    useImageStore.getState().clearImages();
  }
  lastAuthState = state.user;
});
