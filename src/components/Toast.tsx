import React, {createContext, useContext, useState, useEffect} from 'react';
import {Text, Animated, TouchableOpacity, Dimensions} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Portal, PortalHost, PortalProvider} from '@gorhom/portal';

type ToastType = 'success' | 'error' | 'loading' | 'blank';
type ToastPosition = 'top' | 'bottom';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  position?: ToastPosition;
}

interface ToastContextType {
  show: (
    message: string,
    options?: {type?: ToastType; duration?: number; position?: ToastPosition},
  ) => void;
  success: (
    message: string,
    options?: {duration?: number; position?: ToastPosition},
  ) => void;
  error: (
    message: string,
    options?: {duration?: number; position?: ToastPosition},
  ) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (message: string, options = {}) => {
    const id = Date.now().toString();
    setToasts(prev => [
      ...prev,
      {id, message, type: 'blank', duration: 3000, position: 'top', ...options},
    ]);
  };

  const success = (message: string, options = {}) => {
    show(message, {...options, type: 'success'});
  };

  const error = (message: string, options = {}) => {
    show(message, {...options, type: 'error'});
  };

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <PortalProvider>
      <ToastContext.Provider value={{show, success, error, dismiss}}>
        {children}
        <PortalHost name="toast-portal" />
        <Portal>
          <Animated.View
            className="absolute top-0 left-0 right-0 items-center"
            style={{
              zIndex: 999999,
              elevation: 999999,
            }}>
            {toasts.map(toast => (
              <ToastComponent
                key={toast.id}
                {...toast}
                onDismiss={() => dismiss(toast.id)}
              />
            ))}
          </Animated.View>
        </Portal>
      </ToastContext.Provider>
    </PortalProvider>
  );
};

const ToastComponent: React.FC<Toast & {onDismiss: () => void}> = ({
  message,
  type = 'blank',
  duration = 3000,
  position = 'top',
  onDismiss,
}) => {
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(position === 'top' ? -100 : 100);
  const {width} = Dimensions.get('window');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (type !== 'loading' && duration !== Infinity) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Icon name="check-circle" size={24} color="#FFF" />;
      case 'error':
        return <Icon name="error" size={24} color="#ff4444" />;
      case 'loading':
        return <Icon name="refresh" size={24} color="#fff" />;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      className={`
        flex-row items-center px-4 py-3 rounded-2xl mx-4 my-1 max-w-[90%]
        ${type === 'success' ? 'bg-green-500' : ''}
        ${type === 'error' ? 'bg-red-500' : ''}
        ${type === 'loading' ? 'bg-gray-800' : ''}
        ${type === 'blank' ? 'bg-gray-800' : ''}
      `}
      style={{
        opacity,
        transform: [{translateY}],
        marginTop: position === 'top' ? 48 : 0,
        marginBottom: position === 'bottom' ? 16 : 0,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 999999,
      }}>
      {getIcon()}
      <Text className="text-white text-base ml-3 mr-6 flex-shrink-1">
        {message}
      </Text>
      <TouchableOpacity
        onPress={onDismiss}
        className="absolute right-2 top-2 p-1">
        <Icon name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
