import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useTheme} from '@src/store/themeStore';
import PersonIcon from '@src/assets/icons/PersonIcon';
import {useLoginModalStore} from './LoginBottomSheet';
import {useStrings} from '@src/hooks/useStrings';

/**
 * @interface UserNotFoundProps
 * @property {string} title - The main title for the sign-in prompt (e.g., "Not Signed In").
 * @property {string} description - A descriptive text explaining why the user needs to sign in.
 * @property {{ title: string; onPress: () => void; } | undefined} actionButton - Optional object for a call-to-action button.
 */
interface UserNotFoundProps {
  title?: string;
  description?: string;
}

const UserNotFound: React.FC<UserNotFoundProps> = ({
  title = "You're Not Signed In",
  description = 'Please sign in to access all features and personalize your experience.',
}) => {
  const t = useStrings();
  const {theme} = useTheme();
  const {show} = useLoginModalStore();

  return (
    <View className="flex-1 justify-center items-center px-8 bg-background-light dark:bg-background-dark">
      <PersonIcon size={80} color={theme.primary} />

      {/* Title */}
      <Text
        className="text-2xl font-bold mt-6 mb-3 text-center"
        style={{color: theme.text}}>
        {title}
      </Text>

      {/* Description */}
      <Text
        className="text-base text-center mb-8 px-4"
        style={{color: theme.secondaryText}}>
        {description}
      </Text>

      {/* Action Button */}
      <TouchableOpacity
        className="py-4 px-8 rounded-full shadow-lg"
        style={{backgroundColor: theme.primary}}
        onPress={show}
        accessible={true}
        accessibilityLabel={t('auth.signInRequired')}>
        <Text className="text-white text-lg font-semibold">
          {t('auth.signInToContinue')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default UserNotFound;
