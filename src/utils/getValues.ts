import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_ENGINE_TYPE,
  DEFAULT_IMAGE_SIZE,
  ENGINE_TYPES,
  IMAGE_SIZES,
} from '@src/constants';
import {aspectRatios} from '@src/data/ratio';
import {
  EngineType,
  GeneratedImage,
  ImageGenerationRequest,
  ImageSize,
} from '@src/types/image';

export const getPrompt = (prompt: string) => {
  return prompt.trim() || '';
};

export const getNegativePrompt = (negativePrompt: string | undefined) => {
  return negativePrompt?.trim() || '';
};

export const getImageSize = (size: ImageSize) => {
  const validSizes = Object.values(IMAGE_SIZES);
  return validSizes.includes(size) ? size : DEFAULT_IMAGE_SIZE;
};

export const getAspectRatio = (ratio: string) => {
  const validRatios = Object.keys(aspectRatios);
  return validRatios.includes(ratio) ? ratio : DEFAULT_ASPECT_RATIO;
};

export const getStyles = (styles: string[] | undefined) => {
  if (!styles || styles.length === 0) {
    return [];
  }
  return styles.map(style => style.trim()).filter(style => style !== '');
};

export const getSeed = (seed: number | undefined) => {
  if (seed === undefined || seed < 0) {
    return Math.floor(Math.random() * 1000000);
  }
  return seed;
};

export const getEngineType = (engineType: EngineType) => {
  const validEngines = Object.values(ENGINE_TYPES);
  return validEngines.includes(engineType) ? engineType : DEFAULT_ENGINE_TYPE;
};

export const getIsPrivate = (isPrivate: boolean | undefined) => {
  return isPrivate !== undefined ? isPrivate : false;
};

export const getImageMetadata = (
  metadata: GeneratedImage,
  params: ImageGenerationRequest,
): GeneratedImage => {
  return {
    id: metadata?.id || `temp-${Date.now()}`,
    userId: metadata?.userId || '',
    engineType: getEngineType(metadata?.engineType || params.engineType),
    prompt: metadata?.prompt || params.prompt,
    negativePrompt: metadata?.negativePrompt || params.negativePrompt || '',
    imageUrl: metadata?.imageUrl || '',
    thumbnailUrl: metadata?.thumbnailUrl || '',
    width: metadata?.width || 512,
    height: metadata?.height || 512,
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
};

export const getGeneratedImage = (
  response: any,
  metadata: any,
  params: any,
) => {
  return {
    ...getImageMetadata(metadata, params),
    prompt:
      response.data.prompts?.final || metadata?.finalPrompt || params.prompt,
    negativePrompt: metadata?.negativePrompt || params.negativePrompt || '',
    imageUrl: metadata?.imageUrl || response.data.imageUrl || '',
    thumbnailUrl:
      response.data.optimizedUrls?.thumbnail || metadata?.imageUrl || '',
  };
};
