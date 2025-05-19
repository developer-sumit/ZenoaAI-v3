export interface User {
  id: string;
  email: string;
  name?: string;
  photo?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  lastUpdated?: string;
  createdAt?: string;
  lastLogin?: string;
}

export type AspectRatioSizeType = 'small' | 'medium' | 'large';

export interface AspectRatioType {
  ratio: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
  size?: AspectRatioSizeType;
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

export interface GeneratedImage {
  uri: string;
  prompt: string;
  fullPrompt?: string;
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
  isDeleted?: boolean;
  deletedAt?: string;
  lastUpdated?: string;
  createdAt?: string;
  isFavorite?: boolean;
}
