export interface IUserProfile {
  username: string;
  avatar?: string;
  bio?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: boolean;
  };
}

export interface IUserQuota {
  imagesRemaining: number;
  apiCallsRemaining: number;
  refreshAt: Date;
}

export interface User {
  uid: string; // Firebase/Auth ID
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  recoveryExpiresAt?: Date;
  profile: IUserProfile;
  planType: 'free' | 'pro' | 'enterprise';
  quota: IUserQuota;
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

// Updated GeneratedImage to match server structure
export interface GeneratedImage {
  id: string;
  userId: string;
  uri: string; // Main image URL
  imageUrl?: string; // Alternative field name used in web
  originalPrompt: string; // User's original input
  finalPrompt: string; // Enhanced prompt with style details
  prompt?: string; // For backward compatibility
  negativePrompt?: string;
  width: number;
  height: number;
  styles?: string[]; // Array of style names applied
  seed: string | number;
  sampler?: string;
  steps?: number;
  engineType?: 'quantum' | 'nebula';
  createdAt: string;
  updatedAt?: string;
  isFavorite?: boolean;
  isPrivate?: boolean;
  aspectRatio?: AspectRatioType;
  quality?: number;
  // User information (for public images)
  userName?: string;
  userAvatar?: string;
  // Legacy fields for backward compatibility
  timestamp?: number;
  loading?: boolean;
  error?: boolean;
  index?: number;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface ImageGeneration {
  id: string;
  prompt: string;
  fullPrompt: string;
  negativePrompt?: string;
  styles: string[];
  engine: 'quantum' | 'nebula';
  aspectRatio: AspectRatioType;
  quality: 'high' | 'standard';
  sampler?: string;
  images: GeneratedImage[];
  synced?: boolean;
  isPrivate?: boolean;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt: string;
}
