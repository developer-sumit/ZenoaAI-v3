import {Platform} from 'react-native';
import HapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'error'
  | 'warning'
  | 'rigid'
  | 'soft';

export const useHaptics = () => {
  const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  };

  const triggerHaptic = (type: HapticFeedbackType = 'light') => {
    try {
      switch (type) {
        case 'light':
          HapticFeedback.trigger(
            HapticFeedbackTypes.impactLight,
            hapticOptions,
          );
          break;
        case 'medium':
          HapticFeedback.trigger(
            HapticFeedbackTypes.impactMedium,
            hapticOptions,
          );
          break;
        case 'heavy':
          HapticFeedback.trigger(
            HapticFeedbackTypes.impactHeavy,
            hapticOptions,
          );
          break;
        case 'selection':
          HapticFeedback.trigger(HapticFeedbackTypes.selection, hapticOptions);
          break;
        case 'success':
          HapticFeedback.trigger(
            HapticFeedbackTypes.notificationSuccess,
            hapticOptions,
          );
          break;
        case 'error':
          HapticFeedback.trigger(
            HapticFeedbackTypes.notificationError,
            hapticOptions,
          );
          break;
        case 'warning':
          HapticFeedback.trigger(
            HapticFeedbackTypes.notificationWarning,
            hapticOptions,
          );
          break;
        case 'rigid':
          if (Platform.OS === 'ios') {
            HapticFeedback.trigger(HapticFeedbackTypes.rigid, hapticOptions);
          } else {
            HapticFeedback.trigger(
              HapticFeedbackTypes.impactHeavy,
              hapticOptions,
            );
          }
          break;
        case 'soft':
          if (Platform.OS === 'ios') {
            HapticFeedback.trigger(HapticFeedbackTypes.soft, hapticOptions);
          } else {
            HapticFeedback.trigger(
              HapticFeedbackTypes.impactLight,
              hapticOptions,
            );
          }
          break;
        default:
          HapticFeedback.trigger(
            HapticFeedbackTypes.impactLight,
            hapticOptions,
          );
          break;
      }
    } catch (error) {
      // Fallback for when haptic feedback is not available
      console.warn('Haptic feedback not available:', error);
    }
  };

  return {triggerHaptic};
};
