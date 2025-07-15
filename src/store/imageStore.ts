import {create} from 'zustand';

import imageService from '@src/services/imageService';
import {GeneratedImage} from '@src/types/image';

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
    settings: ImageGenerationRequest,
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

  generateImage: async (prompt: string, settings: ImageGenerationRequest) => {
    try {
      set({isLoading: true, error: null}); // Clear previous batch when starting new generation
      set({currentGenerationBatch: []});

      // Create a shared timestamp for the entire batch
      const batchTimestamp = Date.now(); // Create placeholder images for the batch
      const placeholderImages: GeneratedImage[] = [];

      for (let i = 0; i < settings.batchCount; i++) {
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
          styles: settings.styles || [],
          seed: settings.seed || 0,
          engineType: settings.engineType || 'quantum',
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
      for (let i = 0; i < settings.batchCount; i++) {
        try {
          const {success, data, message} = await imageService.generateImage(
            prompt,
            settings,
          );

          if (success && data) {
            // Ensure the generated image has the same batch timestamp
            const batchImage: GeneratedImage = {
              ...data,
              batchTimestamp: new Date(batchTimestamp),
            };
            generatedImages.push(batchImage);

            const user = useAuthStore().user;
            if (!user) {
              set({error: 'Unauthenticated: User must be logged in'});
              return false;
            }

            userService.saveUser({
              ...user,
              statistics: {
                ...user.statistics,
                imagesGenerated: user.statistics.imagesGenerated + 1,
              },
              quota: {
                ...user.quota,
                imagesRemaining: user.quota.imagesRemaining - 1,
              },
            });

            // Replace the placeholder with the actual image
            set(state => ({
              currentGenerationBatch: state.currentGenerationBatch.map(
                (img, index) => (index === i ? batchImage : img),
              ),
            }));
          } else {
            console.error(
              `Failed to generate image ${i + 1} of ${settings.batchCount}:`,
              message,
            );
            set(state => ({
              error: message || 'Image generation failed',
              currentGenerationBatch: state.currentGenerationBatch.map(
                (img, index) => (index === i ? placeholderImages[i] : img),
              ),
            }));
          }
        } catch (imageError: any) {
          console.error(
            `Error generating image ${i + 1} of ${settings.batchCount}:`,
            imageError,
          );
          set(state => ({
            error: imageError.message || 'Image generation failed',
            currentGenerationBatch: state.currentGenerationBatch.map(
              (img, index) => (index === i ? placeholderImages[i] : img),
            ),
          }));
        }
      }

      // Only refresh images list if we successfully generated at least one image
      if (generatedImages.length > 0) {
        console.log(
          '🏪 Store: Successfully generated',
          generatedImages.length,
          'images, refreshing list in 2 seconds...',
        );

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
      set({error: 'Failed to generate image'});
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
      const {success} = await imageService.updatePrivacy(imageId, isPrivate);

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
import userService from '@src/services/userService';
import {ImageGenerationRequest} from '@src/types/image';

let lastAuthState = useAuthStore.getState().user;

useAuthStore.subscribe(state => {
  // Only clear if user was authenticated before and now they're not
  if (lastAuthState && !state.user) {
    console.log('User logged out - clearing images');
    useImageStore.getState().clearImages();
  }
  lastAuthState = state.user;
});
