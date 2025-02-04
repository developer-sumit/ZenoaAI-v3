// types.ts
export interface AspectRatioType {
  ratio: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
  size?: 'small' | 'medium' | 'large'; // Add size property
}

export interface ArtStyleType {
  id: string;
  name: string;
  image: string;
}

export interface QualityPresetType {
  label: string;
  value: number;
}

export interface AdvancedSettingsProps {
  visible: boolean;
  onClose: () => void;
  selectedStyles: string[];
  setSelectedStyles: (styles: string[]) => void;
  aspectRatio: AspectRatioType;
  setAspectRatio: (ratio: AspectRatioType) => void;
  numberOfImages: number;
  setNumberOfImages: (count: number) => void;
  quality: number;
  setQuality: (value: number) => void;
  seed: string;
  setSeed: (value: string) => void;
  sampler: string;
  setSampler: (value: string) => void;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  qualityPresets: QualityPresetType[];
  samplers: string[];
}
