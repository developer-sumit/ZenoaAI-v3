import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_ENGINE_TYPE,
  DEFAULT_IMAGE_SIZE,
  ENGINE_TYPES,
  IMAGE_SIZES,
} from '@src/constants';
import {aspectRatios} from '@src/data/ratio';
import {EngineType, ImageSize} from '@src/types/image';

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
    return 0;
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
