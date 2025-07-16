import {create} from 'zustand';

import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_ENGINE_TYPE,
  DEFAULT_IMAGE_SIZE,
} from '@src/constants';
import {EngineType, ImageSize} from '@src/types/image';

interface GenerationState {
  isLoading: boolean;
  engine: EngineType;
  aspectRatio: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: ImageSize;
  prompt: string;
  negativePrompt: string;
  isPrivate: boolean;
  isPremium: boolean;
  numberOfImages: number;
  styles: string[];
  seed: string;

  setIsLoading: (isLoading: boolean) => void;
  setEngine: (engine: EngineType) => void;
  setAspectRatio: (aspectRatio: string) => void;
  setImageWidth: (width: number) => void;
  setImageHeight: (height: number) => void;
  setImageSize: (imageSize: ImageSize) => void;
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (negativePrompt: string) => void;
  setIsPrivate: (isPrivate: boolean) => void;
  setIsPremium: (isPremium: boolean) => void;
  setNumberOfImages: (numberOfImages: number) => void;
  setStyles: (styles: string[]) => void;
  setSeed: (seed: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  isLoading: false,
  engine: DEFAULT_ENGINE_TYPE,
  aspectRatio: DEFAULT_ASPECT_RATIO,
  imageWidth: 1024,
  imageHeight: 576,
  imageSize: DEFAULT_IMAGE_SIZE,
  prompt: '',
  negativePrompt: '',
  isPrivate: false,
  isPremium: false,
  numberOfImages: 2,
  styles: [],
  seed: '',

  setIsLoading: isLoading => set({isLoading}),
  setEngine: engine => set({engine}),
  setAspectRatio: aspectRatio => set({aspectRatio}),
  setImageWidth: width => set({imageWidth: width}),
  setImageHeight: height => set({imageHeight: height}),
  setImageSize: imageSize => set({imageSize}),
  setPrompt: prompt => set({prompt}),
  setNegativePrompt: negativePrompt => set({negativePrompt}),
  setIsPrivate: isPrivate => set({isPrivate}),
  setIsPremium: isPremium => set({isPremium}),
  setNumberOfImages: numberOfImages => set({numberOfImages}),
  setStyles: styles => set({styles}),
  setSeed: seed => set({seed}),

  reset: () =>
    set({
      isLoading: false,
      engine: DEFAULT_ENGINE_TYPE,
      aspectRatio: DEFAULT_ASPECT_RATIO,
      imageWidth: 1024,
      imageHeight: 576,
      imageSize: DEFAULT_IMAGE_SIZE,
      prompt: '',
      negativePrompt: '',
      isPrivate: false,
      isPremium: false,
      styles: [],
    }),
}));
