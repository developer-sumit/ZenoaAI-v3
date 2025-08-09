import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  TouchableOpacity,
  Animated,
  ViewStyle,
  ScrollView,
  FlatList,
} from 'react-native';
import {useTheme} from '@src/store/themeStore';
import ChevronUpIcon from '@src/assets/icons/ChevronUpIcon';
import {useHaptics} from '@src/hooks/useHaptics';

interface ScrollToTopProps {
  scrollRef: React.RefObject<ScrollView | FlatList | any>;
  registerScrollHandler?: (handler: (event: any) => void) => void;
  showThreshold?: number;
  style?: ViewStyle;
  size?: number;
  iconSize?: number;
  bottom?: number;
  right?: number;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  scrollRef,
  registerScrollHandler,
  showThreshold = 300,
  style,
  size = 50,
  iconSize = 24,
  bottom = 100,
  right = 20,
}) => {
  const {theme} = useTheme();
  const {triggerHaptic} = useHaptics();
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const shouldShow = offsetY > showThreshold;

      if (shouldShow !== isVisible) {
        setIsVisible(shouldShow);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: shouldShow ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: shouldShow ? 1 : 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [isVisible, showThreshold, fadeAnim, scaleAnim],
  );

  // Register the scroll handler when component mounts
  useEffect(() => {
    if (registerScrollHandler) {
      registerScrollHandler(handleScroll);
    }
  }, [registerScrollHandler, handleScroll]);

  const scrollToTop = useCallback(() => {
    triggerHaptic('light');
    if (scrollRef.current) {
      if (scrollRef.current.scrollToOffset) {
        // FlashList/FlatList
        scrollRef.current.scrollToOffset({offset: 0, animated: true});
      } else if (scrollRef.current.scrollTo) {
        // ScrollView
        scrollRef.current.scrollTo({y: 0, animated: true});
      }
    }
  }, [scrollRef, triggerHaptic]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom,
          right,
          width: size,
          height: size,
          opacity: fadeAnim,
          transform: [{scale: scaleAnim}],
          zIndex: 1000,
        },
        style,
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}>
      <TouchableOpacity
        onPress={scrollToTop}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel="Scroll to top"
        accessibilityRole="button">
        <ChevronUpIcon size={iconSize} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ScrollToTop;

export const useScrollToTop = () => {
  const scrollRef = useRef<any>(null);
  const [scrollHandler, setScrollHandler] = useState<
    ((event: any) => void) | null
  >(null);

  const registerScrollHandler = useCallback((handler: (event: any) => void) => {
    setScrollHandler(() => handler);
  }, []);

  return {
    scrollRef,
    scrollHandler,
    registerScrollHandler,
  };
};
