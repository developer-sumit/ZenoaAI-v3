import Routes from '@src/constants/routes';

export interface User {
  id: string;
  email: string;
  name?: string;
  photo?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  lastUpdated?: string;
  lastLogin?: string;
}

export interface UserProfile {
  name?: string;
  photo?: string;
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  };
}

export interface AspectRatioType {
  ratio: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
  size?: 'small' | 'medium' | 'large';
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
  setSelectedStyles: React.Dispatch<React.SetStateAction<string[]>>;
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

export interface GeneratedImage {
  uri: string;
  prompt: string;
  styles: string[];
  aspectRatio: AspectRatioType;
  quality: number;
  sampler: string;
  seed: number;
  timestamp: number;
  firestoreId?: string;
  synced?: boolean;
  loading?: boolean;
  error?: boolean;
  index?: number;
}

export type RootStackParamList = {
  [Routes.SPLASH]: undefined;
  [Routes.AUTH]: undefined;
  [Routes.MAIN]: undefined;
  [Routes.SIGN_IN]: undefined;
};

export type MainTabParamList = {
  [Routes.HOME]: undefined;
  [Routes.SETTINGS]: undefined;
};
