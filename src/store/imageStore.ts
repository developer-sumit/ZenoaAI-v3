import {create} from 'zustand';
import imageService from '@src/services/imageService';
import {GeneratedImage, EngineType, ImageSize} from '@src/types';

export interface ImageGenerationSettings {
  engine?: EngineType;
  style?: string;
  aspectRatio?: string;
  imageSize?: ImageSize;
  quality?: 'standard' | 'premium' | 'ultra';
  seed?: number;
  steps?: number;
  guidance?: number;
  width?: number;
  height?: number;
  negativePrompt?: string;
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
  isLoadingMore: boolean; // For loading more images pagination
  error: string | null;
  hasMoreImages: boolean; // Indicates if there are more images to load
  currentPage: number; // Current page number for pagination

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
  isLoadingMore: false,
  error: null,
  hasMoreImages: true,
  currentPage: 1,

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

      const images = await imageService.getUserImages({page, limit});
      console.log('🏪 Store: Received', images.length, 'images from service');
      console.log(
        '🏪 Store: First image preview:',
        images[0]
          ? {
              id: images[0].id,
              imageUrl: images[0].imageUrl,
              prompt: images[0].prompt?.substring(0, 30) + '...',
              userId: images[0].userId,
            }
          : 'No images',
      );

      // Log all image IDs for debugging
      if (images.length > 0) {
        console.log(
          '🏪 Store: All image IDs:',
          images.map(img => ({
            id: img.id,
            prompt: img.prompt?.substring(0, 20) + '...',
          })),
        );
      }

      set(state => ({
        images: reset ? images : [...state.images, ...images],
        hasMoreImages: images.length === limit, // If we get less than limit, no more images
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

      const newPublicImages = await imageService.getPublicImages(
        page,
        limit,
        filter,
      );

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

      // Create a shared timestamp for the entire batch
      const batchTimestamp = Date.now(); // Create placeholder images for the batch
      const placeholderImages: GeneratedImage[] = [];
      for (let i = 0; i < batchCount; i++) {
        // Calculate dimensions from aspect ratio
        let width = 512;
        let height = 512;

        if (settings.aspectRatio) {
          const [ratioWidth, ratioHeight] = settings.aspectRatio
            .split(':')
            .map(Number);
          const aspectRatioValue = ratioWidth / ratioHeight;
          // Base size for calculations
          const baseSize =
            settings.imageSize === 'large'
              ? 1024
              : settings.imageSize === 'small'
              ? 512
              : 768;

          if (aspectRatioValue > 1) {
            // Landscape
            width = baseSize;
            height = Math.round(baseSize / aspectRatioValue);
          } else if (aspectRatioValue < 1) {
            // Portrait
            height = baseSize;
            width = Math.round(baseSize * aspectRatioValue);
          } else {
            // Square
            width = height = baseSize;
          }
        }
        const placeholder: GeneratedImage = {
          id: `placeholder-${batchTimestamp}-${i}`,
          userId: '',
          imageUrl: 'placeholder',
          thumbnailUrl: 'placeholder',
          prompt: prompt,
          negativePrompt: settings.negativePrompt || '',
          width: width,
          height: height,
          imageSize: settings.imageSize || 'medium',
          aspectRatio: settings.aspectRatio || '1:1',
          styles: settings.style ? [settings.style] : [],
          seed: settings.seed || 0,
          engineType: settings.engine || 'quantum',
          createdAt: new Date(),
          isFavorite: false,
          isPrivate: settings.isPrivate || false,
          userName: '',
          userAvatar: '',
          batchTimestamp: new Date(batchTimestamp),
        };
        placeholderImages.push(placeholder);
      }

      // Set placeholder images immediately
      set({currentGenerationBatch: placeholderImages});

      const generatedImages: GeneratedImage[] = [];

      // Generate images in the batch
      for (let i = 0; i < batchCount; i++) {
        try {
          const newImage = await imageService.generateImage(prompt, settings); // Ensure the generated image has the same batch timestamp
          const batchImage: GeneratedImage = {
            ...newImage,
            batchTimestamp: new Date(batchTimestamp),
          };
          generatedImages.push(batchImage);

          // Replace the placeholder with the actual image
          set(state => ({
            currentGenerationBatch: state.currentGenerationBatch.map(
              (img, index) => (index === i ? batchImage : img),
            ),
          }));
        } catch (imageError: any) {
          console.error(
            `Error generating image ${i + 1} of ${batchCount}:`,
            imageError,
          ); // Replace placeholder with error state - keep original placeholder
          set(state => ({
            currentGenerationBatch: state.currentGenerationBatch.map(
              (img, index) => (index === i ? placeholderImages[i] : img),
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
      } // Only refresh images list if we successfully generated at least one image
      if (generatedImages.length > 0) {
        console.log(
          '🏪 Store: Successfully generated',
          generatedImages.length,
          'images, refreshing list in 2 seconds...',
        );

        // Refresh quota once after the entire batch is completed
        if (onQuotaUpdate) {
          onQuotaUpdate();
        }

        // Refresh the images list to get the proper server data
        setTimeout(() => {
          console.log('🏪 Store: Triggering image refresh after generation...');
          get().fetchImages();
          // Clear the current generation batch after successful generation and fetch
          setTimeout(() => {
            console.log(
              '🏪 Store: Clearing generation batch after successful fetch...',
            );
            set({currentGenerationBatch: []});
          }, 1000);
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
    set({
      images: [],
      publicImages: [],
      currentGenerationBatch: [],
      currentPage: 1,
      hasMoreImages: true,
    });
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
