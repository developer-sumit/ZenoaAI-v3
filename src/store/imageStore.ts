import {create} from 'zustand';
import {imageService} from '@src/services/imageService';
import {GeneratedImage} from '@src/types';

export interface ImageGenerationSettings {
  engine?: 'quantum' | 'nebula';
  style?: string;
  aspectRatio?: string;
  quality?: 'standard' | 'premium' | 'ultra';
  seed?: number;
  steps?: number;
  guidance?: number;
  width?: number;
  height?: number;
  negativePrompt?: string;
  sampler?: string;
  model?: string;
  batchCount?: number;
  isPrivate?: boolean;
}

interface ImageState {
  images: GeneratedImage[]; // All user images (for gallery, profile, etc.)
  publicImages: GeneratedImage[]; // Public images from all users (for community feed)
  currentGenerationBatch: GeneratedImage[]; // Current batch being shown on Generate page
  isLoading: boolean;
  isLoadingPublic: boolean;
  error: string | null;

  // Actions
  fetchImages: () => Promise<void>;
  fetchPublicImages: (page?: number, limit?: number) => Promise<void>;
  generateImage: (
    prompt: string,
    settings: ImageGenerationSettings,
    onQuotaUpdate?: () => void,
  ) => Promise<boolean>;
  generateBatch: (
    prompt: string,
    settings: ImageGenerationSettings,
    batchCount: number,
    onQuotaUpdate?: () => void,
  ) => Promise<boolean>;
  deleteImage: (imageId: string) => Promise<boolean>;
  toggleFavorite: (imageId: string) => Promise<boolean>;
  updatePrivacy: (imageId: string, isPrivate: boolean) => Promise<boolean>;
  clearCurrentBatch: () => void;
  clearImages: () => void;
}

export const useImageStore = create<ImageState>()((set, get) => ({
  images: [],
  publicImages: [],
  currentGenerationBatch: [],
  isLoading: false,
  isLoadingPublic: false,
  error: null,

  fetchImages: async () => {
    try {
      set({isLoading: true, error: null});

      const images = await imageService.getUserImages();
      set({images});
    } catch (error: any) {
      console.error('Failed to fetch images:', error);
      const message = error?.message || 'Failed to fetch images';
      set({error: message});
    } finally {
      set({isLoading: false});
    }
  },

  fetchPublicImages: async (page: number = 1, limit: number = 20) => {
    try {
      set({isLoadingPublic: true, error: null});

      const newPublicImages = await imageService.getPublicImages(page, limit);

      // If it's the first page, replace all images
      // Otherwise, append to existing images
      if (page === 1) {
        set({publicImages: newPublicImages});
      } else {
        set(state => ({
          publicImages: [...state.publicImages, ...newPublicImages],
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

  generateImage: async (
    prompt: string,
    settings: ImageGenerationSettings,
    onQuotaUpdate?: () => void,
  ) => {
    // For single image generation, use generateBatch with count 1
    return get().generateBatch(prompt, settings, 1, onQuotaUpdate);
  },

  generateBatch: async (
    prompt: string,
    settings: ImageGenerationSettings,
    batchCount: number,
    onQuotaUpdate?: () => void,
  ) => {
    try {
      set({isLoading: true, error: null}); // Clear previous batch when starting new generation
      set({currentGenerationBatch: []});

      // Create placeholder images for the batch
      const placeholderImages: GeneratedImage[] = [];
      for (let i = 0; i < batchCount; i++) {
        const placeholder: GeneratedImage = {
          id: `placeholder-${Date.now()}-${i}`,
          userId: '',
          uri: '',
          imageUrl: '',
          originalPrompt: prompt,
          finalPrompt: prompt,
          prompt: prompt,
          negativePrompt: settings.negativePrompt || '',
          width: settings.width || 512,
          height: settings.height || 512,
          styles: settings.style ? [settings.style] : [],
          seed: settings.seed || 0,
          sampler: settings.sampler || '',
          steps: settings.steps || 30,
          engineType: settings.engine || 'quantum',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
          isPrivate: settings.isPrivate || false,
          timestamp: Date.now(),
          loading: true, // Mark as loading
          error: false,
          isDeleted: false,
        };
        placeholderImages.push(placeholder);
      }

      // Set placeholder images immediately
      set({currentGenerationBatch: placeholderImages});

      const generatedImages: GeneratedImage[] = [];

      // Generate images in the batch
      for (let i = 0; i < batchCount; i++) {
        try {
          const newImage = await imageService.generateImage(prompt, settings);
          generatedImages.push(newImage);

          // Replace the placeholder with the actual image
          set(state => ({
            currentGenerationBatch: state.currentGenerationBatch.map(
              (img, index) => (index === i ? newImage : img),
            ),
          }));

          // Refresh quota after each successful generation
          if (onQuotaUpdate) {
            onQuotaUpdate();
          }
        } catch (imageError: any) {
          console.error(
            `Error generating image ${i + 1} of ${batchCount}:`,
            imageError,
          );

          // Replace placeholder with error state
          const errorImage: GeneratedImage = {
            ...placeholderImages[i],
            loading: false,
            error: true,
          };

          set(state => ({
            currentGenerationBatch: state.currentGenerationBatch.map(
              (img, index) => (index === i ? errorImage : img),
            ),
          }));

          // Handle specific error types
          let errorMessage = 'Failed to generate image';

          if (imageError?.response?.status === 503) {
            errorMessage =
              'Image generation service is temporarily unavailable. Please try again in a few minutes.';
          } else if (imageError?.response?.status === 504) {
            errorMessage =
              'Image generation timed out. Please try with a simpler prompt or try again later.';
          } else if (imageError?.response?.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (imageError?.response?.status === 429) {
            errorMessage =
              'Generation quota exceeded. Please wait or upgrade your plan.';
          } else if (imageError?.response?.data?.message) {
            errorMessage = imageError.response.data.message;
          } else if (imageError?.message) {
            errorMessage = imageError.message;
          }

          set({error: errorMessage});
          break;
        }
      }

      // Only refresh images list if we successfully generated at least one image
      if (generatedImages.length > 0) {
        // Refresh the images list to get the proper server data
        setTimeout(() => {
          get().fetchImages();
        }, 2000); // Delay to ensure DB save is complete
      }

      return generatedImages.length > 0;
    } catch (error: any) {
      console.error('Failed to generate image batch:', error);

      let errorMessage = 'Failed to generate image batch';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      set({error: errorMessage});
      return false;
    } finally {
      set({isLoading: false});
    }
  },

  deleteImage: async (imageId: string) => {
    try {
      const success = await imageService.deleteImage(imageId);

      if (success) {
        set(state => ({
          images: state.images.filter(img => img.id !== imageId),
          currentGenerationBatch: state.currentGenerationBatch.filter(
            img => img.id !== imageId,
          ),
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
    try {
      const success = await imageService.toggleFavorite(imageId);

      if (success) {
        set(state => ({
          images: state.images.map(img =>
            img.id === imageId ? {...img, isFavorite: !img.isFavorite} : img,
          ),
          currentGenerationBatch: state.currentGenerationBatch.map(img =>
            img.id === imageId ? {...img, isFavorite: !img.isFavorite} : img,
          ),
        }));
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      const message = error?.message || 'Failed to toggle favorite';
      set({error: message});
      return false;
    }
  },

  updatePrivacy: async (imageId: string, isPrivate: boolean) => {
    try {
      const success = await imageService.updatePrivacy(imageId, isPrivate);

      if (success) {
        set(state => ({
          images: state.images.map(img =>
            img.id === imageId ? {...img, isPrivate} : img,
          ),
          currentGenerationBatch: state.currentGenerationBatch.map(img =>
            img.id === imageId ? {...img, isPrivate} : img,
          ),
        }));
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Failed to update privacy:', error);
      const message = error?.message || 'Failed to update privacy';
      set({error: message});
      return false;
    }
  },

  clearCurrentBatch: () => {
    set({currentGenerationBatch: []});
  },

  clearImages: () => {
    set({images: [], publicImages: [], currentGenerationBatch: []});
  },
}));

// Auto-clear images when auth state changes
import {useAuthStore} from './authStore';

let lastAuthState = useAuthStore.getState().user;

useAuthStore.subscribe(state => {
  // Only clear if user was authenticated before and now they're not
  if (lastAuthState && !state.user) {
    console.log('User logged out - clearing images');
    useImageStore.getState().clearImages();
  }
  lastAuthState = state.user;
});
