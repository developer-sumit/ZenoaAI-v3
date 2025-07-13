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
  id: string; // Unique identifier for the image
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
  favoriteCount?: number;
  isPrivate: boolean;
  createdAt: Date;
  userName: string; // Name of the user who generated the image
  userAvatar: string; // Avatar URL of the user
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
