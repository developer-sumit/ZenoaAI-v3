import {imageAPI} from '@src/services/axiosServer';
import {GeneratedImage} from '@src/types';
import {ImageGenerationSettings} from '@src/store/imageStore';

/**
 * Generates a single image using the specified prompt and settings.
 *
 * @param prompt - The text prompt describing the desired image
 * @param settings - Configuration options for image generation including engine type, aspect ratio, styles, etc.
 * @returns Promise that resolves to a GeneratedImage object containing the generated image data and metadata
 *
 * @throws {Error} When image generation fails or service is unavailable
 * @throws {Error} When generation quota is exceeded (HTTP 429)
 * @throws {Error} When private generation is attempted without proper permissions (HTTP 403)
 * @throws {Error} When service is temporarily unavailable (HTTP 503)
 * @throws {Error} When generation times out (HTTP 504)
 *
 * @example
 * ```typescript
 * const settings: ImageGenerationSettings = {
 *   engine: 'quantum',
 *   aspectRatio: '16:9',
 *   imageSize: 'large',
 *   isPrivate: false
 * };
 *
 * const image = await generateImage('A beautiful sunset over mountains', settings);
 * console.log(`Generated image: ${image.imageUrl}`);
 * ```
 */
const generateImage = async (
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
};

/**
 * Generates a batch of images using the same prompt and settings.
 *
 * @param prompt - The text prompt to use for image generation
 * @param settings - Configuration settings for image generation
 * @param batchCount - The number of images to generate in this batch
 * @returns A promise that resolves to an array of generated images with shared batch timestamp
 * @throws Will throw an error if any individual image generation fails
 *
 * @remarks
 * All images in the batch will share the same `batchTimestamp` to group them together.
 * If any image generation fails, the entire batch operation will be rejected.
 */
const generateBatch = async (
  prompt: string,
  settings: ImageGenerationSettings,
  batchCount: number,
): Promise<GeneratedImage[]> => {
  const batchTimestamp = Date.now();
  const batchImages: GeneratedImage[] = [];

  for (let i = 0; i < batchCount; i++) {
    try {
      const image = await generateImage(prompt, settings); // Ensure all batch images have the same timestamp
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
};

/**
 * Fetches user images from the server with optional filtering and pagination.
 *
 * @param params - Optional parameters for filtering and pagination
 * @param params.page - Page number for pagination
 * @param params.limit - Maximum number of images per page
 * @param params.style - Filter images by specific style
 * @param params.favorite - Filter to show only favorite images when true
 *
 * @returns Promise that resolves to an array of GeneratedImage objects
 *
 * @throws {Error} When server returns a failure response or network request fails
 *
 * @example
 * ```typescript
 * // Fetch first page with 10 images
 * const images = await getUserImages({ page: 1, limit: 10 });
 *
 * // Fetch only favorite images
 * const favorites = await getUserImages({ favorite: true });
 *
 * // Fetch images with specific style
 * const styledImages = await getUserImages({ style: 'anime' });
 * ```
 */
const getUserImages = async (params?: {
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

      const processedImages = images.map((serverImage: any): GeneratedImage => {
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
          seed: Number(serverImage.seed) || Math.floor(Math.random() * 1000000),
          createdAt: serverImage.createdAt || new Date(),
          isFavorite: Boolean(serverImage.favorite || serverImage.isFavorite),
          isPrivate: Boolean(serverImage.isPrivate),
          imageSize: serverImage.imageSize || 'medium',
          aspectRatio: serverImage.aspectRatio || '1:1',
          userName: String(serverImage.userName || ''),
          userAvatar: String(serverImage.userAvatar || ''),
        };
      });

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
};

/**
 * Retrieves a paginated list of public images from the server.
 *
 * This function fetches public images with pagination support and transforms the server response
 * into a standardized GeneratedImage format. It handles various response structures and provides
 * fallback values for missing or undefined properties.
 *
 * @param page - The page number to retrieve (1-based indexing). Defaults to 1.
 * @param limit - The maximum number of images to retrieve per page. Defaults to 20.
 *
 * @returns A Promise that resolves to an array of GeneratedImage objects containing
 *          the transformed image data with standardized properties.
 *
 * @throws {Error} Throws an error if the API request fails or returns an unsuccessful response.
 *                 The error will contain the server's error message or a default message.
 *
 * @example
 * ```typescript
 * // Get first page with default limit
 * const images = await getPublicImages();
 *
 * // Get specific page with custom limit
 * const moreImages = await getPublicImages(2, 10);
 * ```
 */
const getPublicImages = async (
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
          seed: Number(serverImage.seed) || Math.floor(Math.random() * 1000000),
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
      throw new Error(response.data.message || 'Failed to fetch public images');
    }
  } catch (error: any) {
    console.error('Failed to fetch public images:', error);
    throw error;
  }
};

/**
 * Deletes an image by its ID.
 *
 * @param imageId - The unique identifier of the image to delete
 * @returns A promise that resolves to true if the deletion was successful, false otherwise
 * @throws Will throw an error if the API request fails or if there's a network issue
 *
 * @example
 * ```typescript
 * try {
 *   const success = await deleteImage('image-123');
 *   if (success) {
 *     console.log('Image deleted successfully');
 *   }
 * } catch (error) {
 *   console.error('Failed to delete image:', error);
 * }
 * ```
 */
const deleteImage = async (imageId: string): Promise<boolean> => {
  try {
    const response = await imageAPI.deleteImage(imageId);
    return response.data.success;
  } catch (error: any) {
    console.error('Failed to delete image:', error);
    throw error;
  }
};

/**
 * Toggles the favorite status of an image by its ID.
 *
 * @param imageId - The unique identifier of the image to toggle favorite status for
 * @returns A promise that resolves to a boolean indicating whether the operation was successful
 * @throws Will throw an error if the API request fails or if there's a network issue
 *
 * @example
 * ```typescript
 * try {
 *   const success = await toggleFavorite('image-123');
 *   if (success) {
 *     console.log('Favorite status toggled successfully');
 *   }
 * } catch (error) {
 *   console.error('Failed to toggle favorite:', error);
 * }
 * ```
 */
const toggleFavorite = async (imageId: string): Promise<boolean> => {
  try {
    const response = await imageAPI.toggleFavorite(imageId);
    return response.data.success;
  } catch (error: any) {
    console.error('Failed to toggle favorite:', error);
    throw error;
  }
};

/**
 * Updates the privacy setting of an image.
 *
 * @param imageId - The unique identifier of the image to update
 * @param isPrivate - Whether the image should be set as private (true) or public (false)
 * @returns A promise that resolves to true if the privacy update was successful
 * @throws Will throw an error if the API request fails or if there's a network issue
 *
 * @example
 * ```typescript
 * try {
 *   const success = await updatePrivacy('img-123', true);
 *   if (success) {
 *     console.log('Image privacy updated successfully');
 *   }
 * } catch (error) {
 *   console.error('Failed to update image privacy:', error);
 * }
 * ```
 */
const updatePrivacy = async (
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
};

const imageService = {
  generateImage,
  generateBatch,
  getUserImages,
  getPublicImages,
  deleteImage,
  toggleFavorite,
  updatePrivacy,
};
export default imageService;
