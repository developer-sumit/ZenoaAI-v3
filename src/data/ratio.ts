import {AspectRatioType} from '@src/types';

export const aspectRatios: AspectRatioType[] = [
  {
    ratio: '1:1',
    sizes: {small: '512x512', medium: '1024x1024', large: '1536x1536'},
  },
  {
    ratio: '3:2',
    sizes: {small: '768x512', medium: '1152x768', large: '1728x1152'},
  },
  {
    ratio: '4:5',
    sizes: {small: '512x640', medium: '768x960', large: '1024x1280'},
  },
  {
    ratio: '16:9',
    sizes: {small: '1024x576', medium: '1536x864', large: '2048x1152'},
  },
  {
    ratio: '9:16',
    sizes: {small: '576x1024', medium: '864x1536', large: '1152x2048'},
  },
  {
    ratio: '2:3',
    sizes: {small: '512x768', medium: '768x1152', large: '1024x1536'},
  },
  {
    ratio: '5:4',
    sizes: {small: '640x512', medium: '960x768', large: '1280x1024'},
  },
  {
    ratio: '21:9',
    sizes: {small: '1280x540', medium: '1920x810', large: '2560x1080'},
  },
  {
    ratio: '4:3',
    sizes: {small: '800x600', medium: '1024x768', large: '1600x1200'},
  },
  {
    ratio: '3:4',
    sizes: {small: '600x800', medium: '768x1024', large: '1200x1600'},
  },
];
