import {PlanType} from '@src/types/user';
import {EngineType, ImageSize} from '@src/types/image';
import {Dimensions} from 'react-native';

export const IMAGE_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export const ENGINE_TYPES = {
  QUANTUM: 'quantum',
  NEBULA: 'nebula',
} as const;

export const PLAN_TYPES = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export const COMMUNITY_FILTER_OPTIONS = [
  {id: 'popular', label: 'Popular'},
  {id: 'hot', label: 'Hot'},
  {id: 'latest', label: 'Latest'},
] as const;

export const DEFAULT_PLAN_TYPE = PLAN_TYPES.FREE as PlanType;
export const DEFAULT_IMAGE_SIZE = IMAGE_SIZES.MEDIUM as ImageSize;
export const DEFAULT_ENGINE_TYPE = ENGINE_TYPES.QUANTUM as EngineType;
export const DEFAULT_ASPECT_RATIO = '1:1';
export const DEFAULT_COMMUNITY_FILTER = COMMUNITY_FILTER_OPTIONS[0]
  .id as (typeof COMMUNITY_FILTER_OPTIONS)[number]['id'];

export const SCREEN_HEIGHT = Dimensions.get('window').height;
export const SCREEN_WIDTH = Dimensions.get('window').width;
