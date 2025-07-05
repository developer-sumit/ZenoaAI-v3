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
      console.log('🎨 Generating single image:', {
        prompt: prompt.substring(0, 30) + '...',
        engine: settings.engine,
        aspectRatio: settings.aspectRatio,
        isPrivate: settings.isPrivate,
      });

      const response = await imageAPI.generateImage({
        prompt,
        negativePrompt: settings.negativePrompt,
        aspectRatio: settings.aspectRatio || '1:1',
        imageSize: settings.imageSize || 'medium',
        styles: settings.style ? [settings.style] : [],
        steps: settings.steps,
        seed: settings.seed,
        engineType: settings.engine || 'quantum',
        isPrivate: settings.isPrivate || false,
        batchCount: 1,
      });

      console.log('🎨 Server generation response:', {
        success: response.data.success,
        hasImageUrl: !!response.data.imageUrl,
        hasMetadata: !!response.data.metadata,
        metadataId: response.data.metadata?.id,
      });

      if (response.data.success) {
        const data = response.data as any;
        const metadata = data.metadata; // Create the image object, preferring server metadata when available
        const generatedImage: GeneratedImage = {
          id: metadata?.id || `temp-${Date.now()}`,
          userId: metadata?.userId || '',
          engineType: metadata?.engineType || settings.engine || 'quantum',
          prompt: data.prompts?.final || metadata?.finalPrompt || prompt,
          negativePrompt:
            metadata?.negativePrompt || settings.negativePrompt || '',
          imageUrl: data.imageUrl || metadata?.imageUrl || '', // Prefer response imageUrl over metadata
          thumbnailUrl:
            data.optimizedUrls?.thumbnail ||
            metadata?.thumbnailUrl ||
            data.imageUrl,
          width: metadata?.width || settings.width || 512,
          height: metadata?.height || settings.height || 512,
          imageSize: settings.imageSize || 'medium',
          aspectRatio: settings.aspectRatio || '1:1',
          styles: metadata?.styles || (settings.style ? [settings.style] : []),
          seed:
            metadata?.seed ||
            settings.seed ||
            Math.floor(Math.random() * 1000000),
          createdAt: metadata?.createdAt || new Date(),
          isFavorite: metadata?.isFavorite || false,
          isPrivate: metadata?.isPrivate || settings.isPrivate || false,
          userName: metadata?.userName || '',
          userAvatar: metadata?.userAvatar || '',
        };

        console.log('🎨 Generated image object:', {
          id: generatedImage.id,
          imageUrl: generatedImage.imageUrl,
          hasMetadata: !!metadata,
          isTemporary: generatedImage.id.startsWith('temp-'),
        });

        return generatedImage;
      } else {
        throw new Error(response.data.message || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Failed to generate image:', error);

      // Enhanced error handling
      if (error.response?.status === 503) {
        throw new Error(
          'Image generation service is temporarily unavailable. Please try again in a few minutes.',
        );
      } else if (error.response?.status === 504) {
        throw new Error(
          'Image generation timed out. Please try with a simpler prompt or try again later.',
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          'Generation quota exceeded. Please wait or upgrade your plan.',
        );
      } else if (error.response?.status === 403) {
        throw new Error(
          'Private image generation is only available for Pro and Enterprise users.',
        );
      }

      throw error;
    }
  },

  // Generate a batch of images with consistent timestamps
  generateBatch: async (
    prompt: string,
    settings: ImageGenerationSettings,
    batchCount: number,
  ): Promise<GeneratedImage[]> => {
    const batchTimestamp = Date.now();
    const batchImages: GeneratedImage[] = [];

    for (let i = 0; i < batchCount; i++) {
      try {
        const image = await imageService.generateImage(prompt, settings); // Ensure all batch images have the same timestamp
        const batchImage: GeneratedImage = {
          ...image,
          batchTimestamp: new Date(batchTimestamp),
        };

        batchImages.push(batchImage);
      } catch (error) {
        throw error; // Let the caller handle the error
      }
    }

    return batchImages;
  },

  // Get user's images with improved error handling
  getUserImages: async (params?: {
    page?: number;
    limit?: number;
    style?: string;
    favorite?: boolean;
  }): Promise<GeneratedImage[]> => {
    try {
      console.log('📱 Fetching user images from server...', params);
      const response = await imageAPI.getImages(params);
      console.log('📱 Server response:', {
        success: response.data.success,
        hasData: !!response.data.data,
        hasImages: !!response.data.images,
        dataLength: response.data.data?.length || 0,
        imagesLength: response.data.images?.length || 0,
        fullResponse: response.data, // Log the full response for debugging
      });

      if (response.data.success) {
        // Handle both paginated and simple array responses
        const images = response.data.data || [];

        console.log('📱 Processing', images.length, 'images from server');
        console.log(
          '📱 Raw server images:',
          images.map((img: any) => ({
            id: img.id,
            userId: img.userId,
            isDeleted: img.isDeleted,
            isPrivate: img.isPrivate,
            originalPrompt: img.originalPrompt?.substring(0, 30) + '...',
          })),
        );

        const processedImages = images.map(
          (serverImage: any): GeneratedImage => {
            const styles = Array.isArray(serverImage.styles)
              ? serverImage.styles
              : [];

            return {
              id: String(serverImage.id || ''),
              userId: String(serverImage.userId || ''),
              engineType: serverImage.engineType || 'quantum',
              prompt: String(serverImage.prompt || ''),
              negativePrompt: String(serverImage.negativePrompt || ''),
              imageUrl: String(serverImage.imageUrl || ''),
              thumbnailUrl: String(
                serverImage.thumbnailUrl || serverImage.imageUrl || '',
              ),
              width: Number(serverImage.width) || 512,
              height: Number(serverImage.height) || 512,
              styles: styles as string[],
              seed:
                Number(serverImage.seed) || Math.floor(Math.random() * 1000000),
              createdAt: serverImage.createdAt || new Date(),
              isFavorite: Boolean(
                serverImage.favorite || serverImage.isFavorite,
              ),
              isPrivate: Boolean(serverImage.isPrivate),
              imageSize: serverImage.imageSize || 'medium',
              aspectRatio: serverImage.aspectRatio || '1:1',
              userName: String(serverImage.userName || ''),
              userAvatar: String(serverImage.userAvatar || ''),
            };
          },
        );

        console.log(
          '📱 Successfully processed',
          processedImages.length,
          'images',
        );
        return processedImages;
      } else {
        console.error('📱 Server returned failure:', response.data.message);
        throw new Error(response.data.message || 'Failed to fetch images');
      }
    } catch (error: any) {
      console.error('📱 Failed to fetch user images:', error);
      console.error('📱 Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
        // Handle both paginated and simple array responses
        const images = response.data.data || response.data.images || [];

        return images.map((serverImage: any): GeneratedImage => {
          const styles = Array.isArray(serverImage.styles)
            ? serverImage.styles
            : [];
          return {
            id: String(serverImage.id || ''),
            userId: String(serverImage.userId || ''),
            engineType: serverImage.engineType || 'quantum',
            prompt: String(
              serverImage.finalPrompt ||
                serverImage.originalPrompt ||
                serverImage.prompt ||
                '',
            ),
            negativePrompt: String(serverImage.negativePrompt || ''),
            imageUrl: String(serverImage.imageUrl || ''),
            thumbnailUrl: String(
              serverImage.thumbnailUrl || serverImage.imageUrl || '',
            ),
            width: Number(serverImage.width) || 512,
            height: Number(serverImage.height) || 512,
            styles: styles as string[],
            seed:
              Number(serverImage.seed) || Math.floor(Math.random() * 1000000),
            createdAt: serverImage.createdAt || new Date(),
            isFavorite: Boolean(serverImage.isFavorite),
            isPrivate: Boolean(serverImage.isPrivate),
            imageSize: serverImage.imageSize || 'medium',
            aspectRatio: serverImage.aspectRatio || '1:1',
            userName: String(
              serverImage.userName || serverImage.username || 'Anonymous',
            ),
            userAvatar: String(
              serverImage.userAvatar || serverImage.avatar || '',
            ),
          };
        });
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
