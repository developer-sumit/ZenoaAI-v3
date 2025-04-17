import React from 'react';
import { ViewStyle } from 'react-native';
import AspectRatioIcon from '@src/assets/icons/AspectRatioIcon';
import ChartDonutIcon from '@src/assets/icons/ChartDonutIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import ContentCopyIcon from '@src/assets/icons/ContentCopyIcon';
import DeleteOutlineIcon from '@src/assets/icons/DeleteOutlineIcon';
import DownloadIcon from '@src/assets/icons/DownloadIcon';
import PaletteIcon from '@src/assets/icons/PaletteIcon';
import PhotoLibraryIcon from '@src/assets/icons/PhotoLibraryIcon';
import SeedIcon from '@src/assets/icons/SeedIcon';
import TuneIcon from '@src/assets/icons/TuneIcon';
import ErrorIcon from '@src/assets/icons/ErrorIcon';
import CheckCircleIcon from '@src/assets/icons/CheckCircleIcon';
import RefreshIcon from '@src/assets/icons/RefreshIcon';
import SyncIcon from '@src/assets/icons/SyncIcon';
import ArrowBackIcon from '@src/assets/icons/ArrowBackIcon';
import MagicWandIcon from '@src/assets/icons/MagicWandIcon';
import BrokenImageIcon from '@src/assets/icons/BrokenImageIcon';
import CameraAltIcon from '@src/assets/icons/CameraAltIcon';
import CheckmarkIcon from '@src/assets/icons/CheckmarkIcon';
import ErrorOutlineIcon from '@src/assets/icons/ErrorOutlineIcon';
import LightModeIcon from '@src/assets/icons/LightModeIcon';
import LightbulbOutlineIcon from '@src/assets/icons/LightbulbOutlineIcon';
import LogoGoogleIcon from '@src/assets/icons/GoogleLogoIcon';
import PersonIcon from '@src/assets/icons/PersonIcon';
import SparklesIcon from '@src/assets/icons/SparklesIcon';
import StarIcon from '@src/assets/icons/StarIcon';
import DarkModeIcon from '@src/assets/icons/DarkModeIcon';
import ChevronRightIcon from '@src/assets/icons/ChevronRightIcon';
import StarsIcon from '@src/assets/icons/StarsIcon';
import WorkspacePremiumIcon from '@src/assets/icons/WorkspacePremiumIcon';
import AdUnitsIcon from '@src/assets/icons/AdUnitsIcon';
import BoltIcon from '@src/assets/icons/BoltIcon';
import ImageIcon from '@src/assets/icons/ImageIcon';
import FlashOnIcon from '@src/assets/icons/FlashOnIcon';
import AccountIcon from '@src/assets/icons/AccountIcon';
import AccountOutlineIcon from '@src/assets/icons/AccountOutlineIcon';
import CircleIcon from '@src/assets/icons/CircleIcon';
import ImageMultipleIcon from '@src/assets/icons/ImageMultipleIcon';
import ImageMultipleOutlineIcon from '@src/assets/icons/ImageMultipleOutlineIcon';
import RobotIcon from '@src/assets/icons/RobotIcon';
import RobotOutlineIcon from '@src/assets/icons/RobotOutlineIcon';
import FullscreenIcon from '@src/assets/icons/FullscreenIcon';
import ChevronUpIcon from '@src/assets/icons/ChevronUpIcon';
import ChevronDownIcon from '@src/assets/icons/ChevronDownIcon';

export type IconName =
  | 'account'
  | 'account-outline'
  | 'ad-units'
  | 'aspect-ratio'
  | 'arrow-back'
  | 'bolt'
  | 'broken-image'
  | 'camera-alt'
  | 'chart-donut'
  | 'check-circle'
  | 'checkmark'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'circle'
  | 'close'
  | 'content-copy'
  | 'dark-mode'
  | 'delete-outline'
  | 'download'
  | 'error'
  | 'error-outline'
  | 'flash-on'
  | 'fullscreen'
  | 'image'
  | 'image-multiple'
  | 'image-multiple-outline'
  | 'light-mode'
  | 'lightbulb-outline'
  | 'logo-google'
  | 'magic-wand'
  | 'palette'
  | 'person'
  | 'photo-library'
  | 'refresh'
  | 'robot'
  | 'robot-outline'
  | 'seed'
  | 'sparkles'
  | 'star'
  | 'stars'
  | 'sync'
  | 'tune'
  | 'workspace-premium';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#000000',
  style,
}) => {
  const props = { size, color, style };

  switch (name) {
    case 'account':
      return <AccountIcon {...props} />;
    case 'account-outline':
      return <AccountOutlineIcon {...props} />;
    case 'ad-units':
      return <AdUnitsIcon {...props} />;
    case 'aspect-ratio':
      return <AspectRatioIcon {...props} />;
    case 'arrow-back':
      return <ArrowBackIcon {...props} />;
    case 'magic-wand':
      return <MagicWandIcon {...props} />;
    case 'bolt':
      return <BoltIcon {...props} />;
    case 'broken-image':
      return <BrokenImageIcon {...props} />;
    case 'camera-alt':
      return <CameraAltIcon {...props} />;
    case 'chart-donut':
      return <ChartDonutIcon {...props} />;
    case 'check-circle':
      return <CheckCircleIcon {...props} />;
    case 'checkmark':
      return <CheckmarkIcon {...props} />;
    case 'chevron-right':
      return <ChevronRightIcon {...props} />;
    case 'chevron-up':
      return <ChevronUpIcon {...props} />;
    case 'chevron-down':
      return <ChevronDownIcon {...props} />;
    case 'circle':
      return <CircleIcon {...props} />;
    case 'close':
      return <CloseIcon {...props} />;
    case 'content-copy':
      return <ContentCopyIcon {...props} />;
    case 'dark-mode':
      return <DarkModeIcon {...props} />;
    case 'delete-outline':
      return <DeleteOutlineIcon {...props} />;
    case 'download':
      return <DownloadIcon {...props} />;
    case 'error':
      return <ErrorIcon {...props} />;
    case 'error-outline':
      return <ErrorOutlineIcon {...props} />;
    case 'flash-on':
      return <FlashOnIcon {...props} />;
    case 'fullscreen':
      return <FullscreenIcon {...props} />;
    case 'image':
      return <ImageIcon {...props} />;
    case 'image-multiple':
      return <ImageMultipleIcon {...props} />;
    case 'image-multiple-outline':
      return <ImageMultipleOutlineIcon {...props} />;
    case 'light-mode':
      return <LightModeIcon {...props} />;
    case 'lightbulb-outline':
      return <LightbulbOutlineIcon {...props} />;
    case 'logo-google':
      return <LogoGoogleIcon {...props} />;
    case 'palette':
      return <PaletteIcon {...props} />;
    case 'person':
      return <PersonIcon {...props} />;
    case 'photo-library':
      return <PhotoLibraryIcon {...props} />;
    case 'refresh':
      return <RefreshIcon {...props} />;
    case 'robot':
      return <RobotIcon {...props} />;
    case 'robot-outline':
      return <RobotOutlineIcon {...props} />;
    case 'seed':
      return <SeedIcon {...props} />;
    case 'sparkles':
      return <SparklesIcon {...props} />;
    case 'star':
      return <StarIcon {...props} />;
    case 'stars':
      return <StarsIcon {...props} />;
    case 'sync':
      return <SyncIcon {...props} />;
    case 'tune':
      return <TuneIcon {...props} />;
    case 'workspace-premium':
      return <WorkspacePremiumIcon {...props} />;
    default:
      return <CircleIcon {...props} />;
  }
};

export default Icon;
