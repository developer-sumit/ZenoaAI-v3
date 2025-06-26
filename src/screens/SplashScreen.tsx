import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, Image} from 'react-native';

import {useTheme} from '@src/store/themeStore';
import appConfig from '@src/config/app.config';

const SplashScreen = () => {
  const {theme} = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Staggered animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View
      className="flex-1 items-center justify-center relative"
      style={{backgroundColor: theme.background}}>
      {/* Background gradient effect */}
      <View
        className="absolute inset-0 opacity-5"
        style={{
          backgroundColor: `radial-gradient(circle at center, ${theme.primary}22 0%, transparent 70%)`,
        }}
      />

      {/* Main content container */}
      <Animated.View
        className="items-center"
        style={{opacity: fadeAnim, transform: [{scale: scaleAnim}]}}>
        {/* Logo/Brand Icon */}
        <View
          className="w-20 h-20 rounded-3xl mb-8 items-center justify-center shadow-lg bg-[#121212]"
          style={{shadowColor: theme.primary, elevation: 12}}>
          <Image
            source={appConfig.icon}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>

        {/* App Name */}
        <Animated.Text
          className="text-3xl font-bold mb-2 tracking-wider"
          style={{
            color: theme.text,
            transform: [{translateY: slideAnim}],
            opacity: fadeAnim,
          }}>
          {appConfig.name}
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          className="text-base opacity-70 mb-12 text-center px-8"
          style={{
            color: theme.secondaryText,
            transform: [{translateY: slideAnim}],
            opacity: fadeAnim,
          }}>
          {appConfig.description}
        </Animated.Text>
      </Animated.View>

      {/* Minimal loading indicator */}
      <View className="absolute bottom-20 items-center">
        <LoadingDots color={theme.primary} />
      </View>

      {/* Version info */}
      <Animated.View
        className="absolute bottom-8 items-center"
        style={{opacity: fadeAnim}}>
        <Text
          className="text-xs opacity-50"
          style={{color: theme.secondaryText}}>
          v{appConfig.version} • {appConfig.author.name}
        </Text>
      </Animated.View>
    </View>
  );
};

const LoadingDots = ({color}: {color: string}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      const dotAnimation = (dot: Animated.Value, delay: number) =>
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]);

      Animated.loop(
        Animated.parallel([
          dotAnimation(dot1, 0),
          dotAnimation(dot2, 200),
          dotAnimation(dot3, 400),
        ]),
        {iterations: -1},
      ).start();
    };

    animateDots();
  }, []);

  return (
    <View className="flex-row items-center space-x-2">
      {[dot1, dot2, dot3].map((dot, index) => (
        <Animated.View
          key={index}
          className="w-4 h-4 aspect-square rounded-full"
          style={{
            backgroundColor: color,
            opacity: dot,
            transform: [
              {
                scale: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
};

export default SplashScreen;
