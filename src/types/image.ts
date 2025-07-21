export type EngineType = 'quantum' | 'nebula';
export type ImageSize = 'small' | 'medium' | 'large';

export interface ImageGenerationRequest {
  engineType: EngineType;
  prompt: string;
  aspectRatio: string; // e.g., "1:1", "16:9", etc.
  imageSize: ImageSize; // e.g., "small", "medium", "large"
  width: number;
  height: number;
  styles?: string[];
  seed: number;
  negativePrompt?: string;
  isPrivate: boolean;
  highQuality: boolean;
  // batchCount: number;
}

// Image response types
export interface GeneratedImage {
  id: string;
  userId: string;
  prompt: string;
  imageUrl: string;
  thumbnailUrl: string;
  engineType: EngineType;
  styles?: string[];
  width: number;
  height: number;
  seed: number;
  imageSize: ImageSize;
  aspectRatio: string;
  negativePrompt?: string;
  isFavorite?: boolean;
  favoriteCount?: number;
  isPrivate: boolean;
  createdAt: Date;
  userName: string;
  userAvatar: string;
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

export interface SizeType {
  width: number;
  height: number;
}

export interface AspectRatioType {
  ratio: string;
  sizes: {
    small: SizeType;
    medium: SizeType;
    large: SizeType;
  };
}

export interface ArtStyleType {
  id: string;
  name: string;
  image: string;
}
