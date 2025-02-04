import React, {createContext, useContext, useState, useEffect} from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
    <ToastContext.Provider value={{show, success, error, dismiss}}>
      {children}
      <SafeAreaView style={styles.container}>
        {toasts.map(toast => (
          <ToastComponent
            key={toast.id}
            {...toast}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </SafeAreaView>
    </ToastContext.Provider>
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
        return <Icon name="check-circle" size={24} color="#4BB543" />;
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
      style={[
        styles.toast,
        styles[type],
        {
          opacity,
          transform: [{translateY}],
          marginTop: position === 'top' ? 16 : 0,
          marginBottom: position === 'bottom' ? 16 : 0,
        },
      ]}>
      {getIcon()}
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
        <Icon name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  success: {
    backgroundColor: '#4BB543',
  },
  error: {
    backgroundColor: '#ff4444',
  },
  loading: {
    backgroundColor: '#2d3748',
  },
  blank: {
    backgroundColor: '#2d3748',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    marginRight: 24,
    flexShrink: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    padding: 4,
  },
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
