import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';

import {useTheme} from '@src/store/themeStore';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';

// Icons
import CloseIcon from '@src/assets/icons/CloseIcon';
import InfoIcon from '@src/assets/icons/InfoIcon';

interface EmailRestrictionDialogProps {
  visible: boolean;
  onClose: () => void;
  expiresAt?: Date;
  daysRemaining?: number;
  hoursRemaining?: number;
  minutesRemaining?: number;
}

const EmailRestrictionDialog: React.FC<EmailRestrictionDialogProps> = ({
  visible,
  onClose,
  expiresAt,
  daysRemaining,
  hoursRemaining,
  minutesRemaining,
}) => {
  const t = useStrings();
  const {isDark, theme} = useTheme();
  const {triggerHaptic} = useHaptics();
  const [timeRemaining, setTimeRemaining] = useState({
    days: daysRemaining || 0,
    hours: hoursRemaining || 0,
    minutes: minutesRemaining || 0,
    seconds: 0,
  });

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  useEffect(() => {
    if (!visible || !expiresAt) {
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const timeDiff = expiresAt.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeRemaining({days: 0, hours: 0, minutes: 0, seconds: 0});
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeRemaining({days, hours, minutes, seconds});
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [visible, expiresAt]);

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  const formatTimeRemaining = () => {
    const days = timeRemaining.days;
    const hours = timeRemaining.hours;
    const minutes = timeRemaining.minutes;
    const seconds = timeRemaining.seconds;

    if (days > 0) {
      return `${
        days !== 1
          ? t('emailRestriction.days_plural', {count: days})
          : t('emailRestriction.days', {count: days})
      }, ${
        hours !== 1
          ? t('emailRestriction.hours_plural', {count: hours})
          : t('emailRestriction.hours', {count: hours})
      }, ${
        minutes !== 1
          ? t('emailRestriction.minutes_plural', {count: minutes})
          : t('emailRestriction.minutes', {count: minutes})
      }`;
    } else if (hours > 0) {
      return `${
        hours !== 1
          ? t('emailRestriction.hours_plural', {count: hours})
          : t('emailRestriction.hours', {count: hours})
      }, ${
        minutes !== 1
          ? t('emailRestriction.minutes_plural', {count: minutes})
          : t('emailRestriction.minutes', {count: minutes})
      }, ${
        seconds !== 1
          ? t('emailRestriction.seconds_plural', {count: seconds})
          : t('emailRestriction.seconds', {count: seconds})
      }`;
    } else if (minutes > 0) {
      return `${
        minutes !== 1
          ? t('emailRestriction.minutes_plural', {count: minutes})
          : t('emailRestriction.minutes', {count: minutes})
      }, ${
        seconds !== 1
          ? t('emailRestriction.seconds_plural', {count: seconds})
          : t('emailRestriction.seconds', {count: seconds})
      }`;
    } else {
      return `${
        seconds !== 1
          ? t('emailRestriction.seconds_plural', {count: seconds})
          : t('emailRestriction.seconds', {count: seconds})
      }`;
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      margin: 20,
      maxWidth: '90%',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 10},
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
    },
    buttonText: {
      color: '#FFFFFF',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={20}
      />

      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <Animated.View
          style={[styles.modal, {transform: [{scale: scaleAnim}]}]}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <InfoIcon size={24} color="#EF4444" />
              <Text
                className="text-lg font-bold ml-2"
                style={{color: theme.text}}>
                {t('emailRestriction.title')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className="p-2 rounded-full"
              style={{backgroundColor: theme.background}}>
              <CloseIcon size={16} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Message */}
          <Text
            className="text-base leading-6 mb-6"
            style={{color: theme.secondaryText}}>
            {t('emailRestriction.message')}
          </Text>

          {/* Timer */}
          {expiresAt && (
            <View
              className="p-4 rounded-lg mb-6"
              style={{backgroundColor: theme.background}}>
              <Text
                className="text-sm font-medium mb-2"
                style={{color: theme.secondaryText}}>
                {t('emailRestriction.timeRemaining')}
              </Text>
              <Text
                className="text-xl font-bold"
                style={{color: theme.primary}}>
                {formatTimeRemaining()}
              </Text>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleClose}
            className="py-4 px-6 rounded-lg"
            style={{backgroundColor: theme.primary}}>
            <Text
              className="text-base font-bold text-center"
              style={styles.buttonText}>
              {t('common.gotIt')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default EmailRestrictionDialog;
