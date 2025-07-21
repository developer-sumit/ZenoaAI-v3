import {create} from 'zustand';

import {useAuthStore} from './authStore';
import {GeneratedImage} from '@src/types/image';
import imageService from '@src/services/imageService';
import {ImageGenerationRequest} from '@src/types/image';

interface ImageState {
  images: GeneratedImage[]; // All user images (for gallery, profile, etc.)
  publicImages: GeneratedImage[]; // Public images from all users (for community feed)
  favoriteImages: GeneratedImage[]; // User's favorite images
  isLoading: boolean;
  isLoadingPublic: boolean;
  isLoadingMore: boolean; // For loading more images pagination
  isLoadingMoreFavorites: boolean;
  error: string | null;
  hasMoreImages: boolean; // Indicates if there are more images to load
  currentPage: number; // Current page number for pagination
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
  clearImages: () => void;
}

export const useImageStore = create<ImageState>()((set, get) => ({
  images: [],
  publicImages: [],
  favoriteImages: [],
  isLoading: false,
  isLoadingPublic: false,
  isLoadingMore: false,
  error: null,
  hasMoreImages: true,
  currentPage: 1,
  isLoadingMoreFavorites: false,
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

      // If it's the first page, replace all images
      // Otherwise, append to existing images
      if (page === 1) {
        set({publicImages: data});
      } else {
        set(state => ({
          publicImages: [...state.publicImages, ...data],
        }));
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

      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().updateUser({
          statistics: {
            ...user.statistics,
            imagesGenerated: (user.statistics?.imagesGenerated || 0) + 1,
          },
          quota: {
            ...user.quota,
            imagesRemaining: (user.quota?.imagesRemaining || 0) - 1,
          },
        });
      }

      // Add the new image to the store
      set(state => ({
        images: [...state.images, data],
        error: null,
      }));

      return {
        success: true,
        data,
        message: 'Image generated successfully',
      };
    } catch (error: any) {
      console.error('Failed to generate image batch:', error);
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
    set(state => ({
      images: state.images.map(img =>
        img.id === imageId
          ? {
              ...img,
              isFavorite: !img.isFavorite,
              favoriteCount: img.isFavorite
                ? (img.favoriteCount || 0) - 1
                : (img.favoriteCount || 0) + 1,
            }
          : img,
      ),
    }));

    try {
      const success = await imageService.toggleFavorite(imageId);

      if (!success) {
        set(state => ({
          images: state.images.map(img =>
            img.id === imageId
              ? {
                  ...img,
                  isFavorite: !img.isFavorite,
                  favoriteCount: img.isFavorite
                    ? (img.favoriteCount || 0) + 1
                    : (img.favoriteCount || 0) - 1,
                }
              : img,
          ),
        }));
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      const message = error?.message || 'Failed to toggle favorite';
      set({error: message});
      return false;
    }
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

  clearImages: () => {
    set({
      images: [],
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
