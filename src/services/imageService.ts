import {imageAPI} from '@src/services/axiosServer';
import {ResponseData} from '@src/types/api';
import {GeneratedImage, ImageGenerationRequest} from '@src/types/image';
import {
  getAspectRatio,
  getEngineType,
  getImageSize,
  getIsPrivate,
  getNegativePrompt,
  getPrompt,
  getSeed,
  getStyles,
} from '@src/utils/getValues';

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
  params: ImageGenerationRequest,
): Promise<ResponseData<GeneratedImage>> => {
  try {
    const response = await imageAPI.generateImage({
      prompt: getPrompt(params.prompt),
      negativePrompt: getNegativePrompt(params.negativePrompt),
      aspectRatio: getAspectRatio(params.aspectRatio),
      imageSize: getImageSize(params.imageSize),
      styles: getStyles(params.styles),
      seed: getSeed(params.seed),
      engineType: getEngineType(params.engineType),
      isPrivate: getIsPrivate(params.isPrivate),
    });

    if (!response.data.success || !response.data.data) {
      return {
        success: false,
        data: null,
        message: response.data.message || 'Failed to generate image',
      };
    }

    const metadata = response.data.data; // Create the image object, preferring server metadata when available
    const generatedImage: GeneratedImage = {
      id: metadata.id,
      userId: metadata.userId,
      engineType: metadata.engineType || params.engineType,
      prompt: params.prompt,
      negativePrompt: metadata.negativePrompt || params.negativePrompt || '',
      imageUrl: metadata.imageUrl || '',
      thumbnailUrl: metadata.thumbnailUrl || '',
      width: metadata.width || 512,
      height: metadata.height || 512,
      imageSize: getImageSize(params.imageSize),
      aspectRatio: getAspectRatio(params.aspectRatio),
      styles: metadata?.styles,
      seed: metadata?.seed || Math.floor(Math.random() * 1000000),
      createdAt: metadata?.createdAt || new Date(),
      isFavorite: metadata?.isFavorite || false,
      isPrivate: metadata?.isPrivate || params.isPrivate || false,
      userName: metadata?.userName || '',
      userAvatar: metadata?.userAvatar || '',
    };

    return {
      success: true,
      data: generatedImage,
      message: 'Image generated successfully',
    };
  } catch (error: any) {
    console.error('Failed to generate image:', error);
    return {
      success: false,
      data: null,
      message:
        error.response?.data?.message ||
        error.message ||
        'Image generation failed',
    };
  }
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
}): Promise<ResponseData<GeneratedImage[]>> => {
  try {
    const response = await imageAPI.getImages(params);

    if (!response.data.success || !response.data.data) {
      return {
        success: false,
        data: [],
        message: response.data.message || 'Failed to fetch user images',
      };
    }

    return {
      success: true,
      data: response.data.data || [],
      message: '',
    };
  } catch (error: any) {
    console.error('📱 Failed to fetch user images:', error);
    return {
      success: false,
      data: [],
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch user images',
    };
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
  filter: string = 'latest',
): Promise<ResponseData<GeneratedImage[]>> => {
  try {
    const response = await imageAPI.getPublicImages({page, limit, filter});
    if (!response.data.success || !response.data.data) {
      return {
        success: false,
        data: [],
        message: response.data.message || 'Failed to fetch public images',
      };
    }

    return {success: true, data: response.data.data || [], message: ''};
  } catch (error: any) {
    console.error('Failed to fetch public images:', error);
    return {
      success: false,
      data: [],
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch public images',
    };
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
const deleteImage = async (imageId: string): Promise<ResponseData<boolean>> => {
  try {
    const response = await imageAPI.deleteImage(imageId);
    return {
      success: response.data.success,
      data: response.data.success ? true : false,
      message: response.data.message || '',
    };
  } catch (error: any) {
    console.error('Failed to delete image:', error);
    return {
      success: false,
      data: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to delete image',
    };
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
const toggleFavorite = async (
  imageId: string,
): Promise<ResponseData<boolean>> => {
  try {
    const response = await imageAPI.toggleFavorite(imageId);
    return {
      success: response.data.success,
      data: response.data.success ? true : false,
      message: response.data.message || '',
    };
  } catch (error: any) {
    console.error('Failed to toggle favorite:', error);
    return {
      success: false,
      data: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to toggle favorite',
    };
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
): Promise<ResponseData<boolean>> => {
  try {
    const response = await imageAPI.updatePrivacy(imageId, isPrivate);
    return {
      success: response.data.success,
      data: response.data.success ? true : false,
      message: response.data.message || '',
    };
  } catch (error: any) {
    console.error('Failed to update privacy:', error);
    return {
      success: false,
      data: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to update privacy',
    };
  }
};

const getFavoriteImages = async (
  page: number = 1,
  limit: number = 20,
): Promise<ResponseData<GeneratedImage[]>> => {
  try {
    const response = await imageAPI.getFavoriteImages({page, limit});
    if (!response.data.success || !response.data.data) {
      return {
        success: false,
        data: [],
        message: response.data.message || 'Failed to fetch favorite images',
      };
    }

    return {success: true, data: response.data.data || [], message: ''};
  } catch (error: any) {
    console.error('Failed to fetch favorite images:', error);
    return {
      success: false,
      data: [],
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch favorite images',
    };
  }
};

/**
 * Flags an image with specified reasons.
 *
 * @param imageId - The unique identifier of the image to flag.
 * @param reasons - An array of strings, each representing a reason for flagging.
 * @returns A promise that resolves to true if flagging was successful, false otherwise.
 * @throws Will throw an error if the API request fails or if there's a network issue.
 */
const flagImage = async (
  imageId: string,
  reasons: string[],
): Promise<ResponseData<boolean>> => {
  try {
    const response = await imageAPI.flagImage(imageId, reasons);
    return {
      success: response.data.success,
      data: response.data.success ? true : false,
      message: response.data.message || '',
    };
  } catch (error: any) {
    console.error('Failed to flag image:', error);
    return {
      success: false,
      data: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to flag image',
    };
  }
};

const imageService = {
  generateImage,
  getUserImages,
  getPublicImages,
  getFavoriteImages,
  deleteImage,
  toggleFavorite,
  updatePrivacy,
  flagImage,
};
export default imageService;
