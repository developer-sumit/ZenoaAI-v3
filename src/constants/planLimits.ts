import {aspectRatios} from '@src/data/ratio';

export const planLimits = {
  free: {
    maxBatch: 4,
    aspectRatios: ['1:1', '3:2', '4:5', '16:9', '9:16'],
    sizes: ['small', 'medium'],
  },
  pro: {
    maxBatch: 6,
    aspectRatios: ['1:1', '3:2', '4:5', '16:9', '9:16', '2:3', '5:4'],
    sizes: ['small', 'medium', 'large'],
  },
  enterprise: {
    maxBatch: 10,
    aspectRatios: Object.keys(aspectRatios),
    sizes: ['small', 'medium', 'large'],
  },
};
