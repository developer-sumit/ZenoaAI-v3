import {Platform, Vibration} from 'react-native';

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'error';

export const useHaptics = () => {
  const triggerHaptic = (type: HapticFeedbackType = 'light') => {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          Vibration.vibrate(20);
          break;
        case 'medium':
          Vibration.vibrate(50);
          break;
        case 'heavy':
          Vibration.vibrate(100);
          break;
        case 'selection':
          Vibration.vibrate(10);
          break;
        case 'success':
          Vibration.vibrate([0, 20, 50, 20]);
          break;
        case 'error':
          Vibration.vibrate([0, 50, 100, 50]);
          break;
        default:
          Vibration.vibrate(20);
      }
    } else {
      // Android
      switch (type) {
        case 'light':
          Vibration.vibrate(25);
          break;
        case 'medium':
          Vibration.vibrate(50);
          break;
        case 'heavy':
          Vibration.vibrate(100);
          break;
        case 'selection':
          Vibration.vibrate(15);
          break;
        case 'success':
          Vibration.vibrate([0, 30, 60, 30]);
          break;
        case 'error':
          Vibration.vibrate([0, 60, 120, 60]);
          break;
        default:
          Vibration.vibrate(25);
      }
    }
  };

  return {triggerHaptic};
};
