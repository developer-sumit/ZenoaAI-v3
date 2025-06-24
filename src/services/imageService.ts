import {imageAPI} from '@src/services/axiosServer';
import {GeneratedImage} from '@src/types';
import {ImageGenerationSettings} from '@src/store/imageStore';

export const imageService = {
  // Generate a single image
  generateImage: async (
    prompt: string,
    settings: ImageGenerationSettings,
  ): Promise<GeneratedImage> => {
    try {
      const response = await imageAPI.generateImage({
        prompt,
        negativePrompt: settings.negativePrompt,
        width: settings.width,
        height: settings.height,
        style: settings.style,
        sampler: settings.sampler,
        steps: settings.steps,
        seed: settings.seed,
        guidance: settings.guidance,
        engineType: settings.engine || 'quantum',
        isPrivate: settings.isPrivate,
        ...settings,
      });

      if (response.data.success) {
        // Map server response to GeneratedImage
        const metadata = response.data.metadata;
        return {
          id: metadata?.id || `temp-${Date.now()}`,
          userId: metadata?.userId || '',
          uri: response.data.imageUrl || response.data.originalUrl,
          imageUrl: response.data.imageUrl || response.data.originalUrl,
          originalPrompt:
            response.data.prompts?.original ||
            response.data.prompts?.final ||
            prompt,
          finalPrompt:
            response.data.prompts?.final ||
            response.data.prompts?.original ||
            prompt,
          prompt:
            response.data.prompts?.original ||
            response.data.prompts?.final ||
            prompt,
          negativePrompt: settings.negativePrompt || '',
          width: settings.width || 512,
          height: settings.height || 512,
          styles: settings.style ? [settings.style] : [],
          seed: settings.seed || Math.floor(Math.random() * 1000000),
          sampler: settings.sampler || '',
          steps: settings.steps || 30,
          engineType: settings.engine || 'quantum',
          createdAt: metadata?.createdAt || new Date().toISOString(),
          updatedAt: metadata?.updatedAt || new Date().toISOString(),
          isFavorite: metadata?.favorite || false,
          isPrivate: metadata?.isPrivate || settings.isPrivate || false,
          timestamp: Date.now(),
          loading: false,
          error: false,
          isDeleted: false,
        };
      } else {
        throw new Error(response.data.message || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      throw error;
    }
  },
  // Get user's images
  getUserImages: async (_userId?: string): Promise<GeneratedImage[]> => {
    try {
      const response = await imageAPI.getImages();

      if (response.data.success) {
        // Map server response to GeneratedImage array
        return (response.data.images || []).map(
          (serverImage: any): GeneratedImage => {
            const styles = Array.isArray(serverImage.styles)
              ? serverImage.styles
              : [];
            return {
              id: String(serverImage.id || ''),
              userId: String(serverImage.userId || ''),
              uri: String(serverImage.imageUrl || ''),
              imageUrl: String(serverImage.imageUrl || ''),
              originalPrompt: String(
                serverImage.originalPrompt || serverImage.finalPrompt || '',
              ),
              finalPrompt: String(
                serverImage.finalPrompt || serverImage.originalPrompt || '',
              ),
              prompt: String(
                serverImage.originalPrompt || serverImage.finalPrompt || '',
              ),
              negativePrompt: String(serverImage.negativePrompt || ''),
              width: Number(serverImage.width) || 512,
              height: Number(serverImage.height) || 512,
              styles: styles as string[],
              seed: serverImage.seed || Math.floor(Math.random() * 1000000),
              sampler: String(serverImage.sampler || ''),
              steps: Number(serverImage.steps) || 30,
              engineType: (serverImage.engineType as 'quantum' | 'nebula') ||
                'quantum',
              createdAt: String(
                serverImage.createdAt || new Date().toISOString(),
              ),
              updatedAt: String(
                serverImage.updatedAt || new Date().toISOString(),
              ),
              isFavorite: Boolean(
                serverImage.favorite || serverImage.isFavorite,
              ),
              isPrivate: Boolean(serverImage.isPrivate),
              timestamp: new Date(
                serverImage.createdAt || new Date(),
              ).getTime(),
              loading: false,
              error: false,
              isDeleted: Boolean(serverImage.isDeleted),
              deletedAt: serverImage.deletedAt
                ? String(serverImage.deletedAt)
                : undefined,
            };
          },
        );
      } else {
        throw new Error(response.data.message || 'Failed to fetch images');
      }
    } catch (error: any) {
      console.error('Failed to fetch user images:', error);
      throw error;
    }
  },

  // Get public images
  getPublicImages: async (
    page: number = 1,
    limit: number = 20,
  ): Promise<GeneratedImage[]> => {
    try {
      const response = await imageAPI.getPublicImages({page, limit});

      if (response.data.success) {
        return (response.data.images || []).map(
          (serverImage: any): GeneratedImage => {
            const styles = Array.isArray(serverImage.styles)
              ? serverImage.styles
              : [];
            return {
              id: String(serverImage.id || ''),
              userId: String(serverImage.userId || ''),
              uri: String(serverImage.imageUrl || ''),
              imageUrl: String(serverImage.imageUrl || ''),
              originalPrompt: String(serverImage.prompt || ''),
              finalPrompt: String(serverImage.prompt || ''),
              prompt: String(serverImage.prompt || ''),
              negativePrompt: String(serverImage.negativePrompt || ''),
              width: Number(serverImage.width) || 512,
              height: Number(serverImage.height) || 512,
              styles: styles as string[],
              seed: serverImage.seed || Math.floor(Math.random() * 1000000),
              sampler: String(serverImage.sampler || ''),
              steps: Number(serverImage.steps) || 30,
              engineType: (serverImage.engineType as 'quantum' | 'nebula') ||
                'quantum',
              createdAt: String(
                serverImage.createdAt || new Date().toISOString(),
              ),
              updatedAt: String(
                serverImage.updatedAt || new Date().toISOString(),
              ),
              isFavorite: Boolean(
                serverImage.favorite || serverImage.isFavorite,
              ),
              isPrivate: Boolean(serverImage.isPrivate),
              userName: String(serverImage.userName || serverImage.username || 'Anonymous'),
              userAvatar: String(serverImage.userAvatar || serverImage.avatar || ''),
              timestamp: new Date(
                serverImage.createdAt || new Date(),
              ).getTime(),
              loading: false,
              error: false,
              isDeleted: Boolean(serverImage.isDeleted),
            };
          },
        );
      } else {
        throw new Error(
          response.data.message || 'Failed to fetch public images',
        );
      }
    } catch (error: any) {
      console.error('Failed to fetch public images:', error);
      throw error;
    }
  },

  // Delete image
  deleteImage: async (imageId: string): Promise<boolean> => {
    try {
      const response = await imageAPI.deleteImage(imageId);
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      throw error;
    }
  },

  // Toggle favorite
  toggleFavorite: async (imageId: string): Promise<boolean> => {
    try {
      const response = await imageAPI.toggleFavorite(imageId);
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  },

  // Update privacy
  updatePrivacy: async (
    imageId: string,
    isPrivate: boolean,
  ): Promise<boolean> => {
    try {
      const response = await imageAPI.updatePrivacy(imageId, isPrivate);
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to update privacy:', error);
      throw error;
    }
  },
};
