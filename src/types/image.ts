export type EngineType = 'quantum' | 'nebula';
export type ImageSize = 'small' | 'medium' | 'large';

export interface ImageGenerationRequest {
  engineType: EngineType;
  prompt: string;
  aspectRatio: string; // e.g., "1:1", "16:9", etc.
  imageSize: ImageSize; // e.g., "small", "medium", "large"
  styles?: string[];
  seed: number;
  negativePrompt?: string;
  isPrivate: boolean;
  batchCount?: number;
}

export interface ImageResponse {
  userId: string;
  prompt: string; // User's original input
  imageUrl: string; // Primary image URL (Cloudinary)
  thumbnailUrl: string;
  engineType: EngineType;
  styles?: string[];
  width: number;
  height: number;
  seed: number;
  imageSize: ImageSize; // e.g., "small", "medium", "large"
  aspectRatio: string; // e.g., "1:1", "16:9", etc.
  negativePrompt?: string;
  isFavorite?: boolean;
  isPrivate: boolean;
  createdAt: Date;
  userName: string; // Name of the user who generated the image
  userAvatar: string; // Avatar URL of the user
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  requestId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: string[];
  requestId?: string;
}

export interface ImageStats {
  totalImages: number;
  favoriteImages: number;
  privateImages: number;
  totalBytes: number;
  engineStats: string[];
}

export interface AspectRatio {
  ratio: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
  size?: ImageSize;
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
