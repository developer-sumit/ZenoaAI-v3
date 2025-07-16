import {useRef} from 'react';
import {Animated, Easing} from 'react-native';

export type AnimationType =
  | 'scale'
  | 'fade'
  | 'slide'
  | 'pulse'
  | 'bounce'
  | 'rotate';

export const useAnimations = () => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(1)).current;
  const slideValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  const animatePress = (
    animatedValue: Animated.Value = scaleValue,
    duration: number = 150,
  ) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: duration / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateFade = (
    toValue: number = 0,
    duration: number = 300,
    animatedValue: Animated.Value = fadeValue,
  ) => {
    Animated.timing(animatedValue, {
      toValue,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const animateSlide = (
    toValue: number = 0,
    duration: number = 300,
    animatedValue: Animated.Value = slideValue,
  ) => {
    Animated.timing(animatedValue, {
      toValue,
      duration,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  };

  const animatePulse = (
    animatedValue: Animated.Value = scaleValue,
    duration: number = 1000,
  ) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.05,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const animateBounce = (animatedValue: Animated.Value = scaleValue) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateRotate = (
    animatedValue: Animated.Value = rotateValue,
    duration: number = 1000,
  ) => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  };

  const stopAllAnimations = () => {
    scaleValue.stopAnimation();
    fadeValue.stopAnimation();
    slideValue.stopAnimation();
    rotateValue.stopAnimation();
  };

  return {
    scaleValue,
    fadeValue,
    slideValue,
    rotateValue,
    animatePress,
    animateFade,
    animateSlide,
    animatePulse,
    animateBounce,
    animateRotate,
    stopAllAnimations,
  };
};
