import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';

import {useTheme} from '@src/store/themeStore';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionButton?: {
    title: string;
    onPress: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
}) => {
  const {theme} = useTheme();

  return (
    <View className="flex-1 justify-center items-center px-8">
      {icon}
      <Text
        className="text-xl font-bold mt-4 mb-2 text-center"
        style={{color: theme.text}}>
        {title}
      </Text>
      <Text
        className="text-base text-center mb-6"
        style={{color: theme.secondaryText}}>
        {description}
      </Text>
      {actionButton && (
        <TouchableOpacity
          className="py-3 px-6 rounded-xl"
          style={{backgroundColor: theme.primary}}
          onPress={actionButton.onPress}
          accessible={true}
          accessibilityLabel={actionButton.title}>
          <Text className="text-white font-medium">{actionButton.title}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;
