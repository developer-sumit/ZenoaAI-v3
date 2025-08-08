import Toast from 'react-native-toast-message';

/**
 * Defines the possible types for a toast message.
 */
type ToastType = 'success' | 'error' | 'info' | 'warning' | 'any';

/**
 * Defines the options for showing a toast message.
 * Extends the default options from react-native-toast-message for flexibility.
 */
interface ShowToastOptions {
  message: string;
  type?: ToastType;
  position?: 'top' | 'bottom';
  visibilityTime?: number;
  autoHide?: boolean;
  topOffset?: number;
  bottomOffset?: number;
  onShow?: () => void;
  onHide?: () => void;
  // You can add more specific options here if your custom toast component uses them
  // For example, if you want to pass an icon name:
  // iconName?: string;
}

/**
 * A custom hook/utility to simplify showing toast messages.
 * It provides overloaded signatures for flexibility.
 */
function useToast() {
  /**
   * Shows a toast message.
   * @param message The main message to display in the toast.
   * @param type The type of toast (e.g., 'success', 'error', 'info', 'any'). Defaults to 'any'.
   */
  function showToast(message: string, type?: ToastType): void;

  /**
   * Shows a toast message with detailed options.
   * @param options An object containing toast message and configuration.
   */
  function showToast(options: ShowToastOptions): void;

  /**
   * Implementation of the showToast function with overloads.
   * @param arg1 Either the message string or the options object.
   * @param arg2 The type string (if arg1 is message string).
   */
  function showToast(arg1: string | ShowToastOptions, arg2?: ToastType): void {
    let options: ShowToastOptions;

    if (typeof arg1 === 'string') {
      // If the first argument is a string, it's the message
      options = {
        message: arg1,
        type: arg2 || 'any', // Use provided type or default to 'any'
      };
    } else {
      // If the first argument is an object, it's the options object
      options = arg1;
    }

    // Set default values for common toast properties
    const defaultOptions: Partial<ShowToastOptions> = {
      position: 'top',
      visibilityTime: 10000000,
      autoHide: true,
      bottomOffset: 80, // Adjust this based on your UI (e.g., if you have a bottom tab bar)
    };

    // Merge default options with user-provided options
    const finalOptions = {...defaultOptions, ...options};

    // Call the react-native-toast-message show method
    Toast.show({
      type: finalOptions.type,
      text1: finalOptions.message,
      // text2 is intentionally omitted for a minimal toast,
      // but you can add it back if your custom component uses it.
      position: finalOptions.position,
      visibilityTime: finalOptions.visibilityTime,
      autoHide: finalOptions.autoHide,
      topOffset: finalOptions.topOffset,
      bottomOffset: finalOptions.bottomOffset,
      onShow: finalOptions.onShow,
      onHide: finalOptions.onHide,
      // Pass any custom props through the `props` field if your custom toast component expects them
      // props: { iconName: finalOptions.iconName },
    });
  }

  return {showToast};
}

export default useToast;
