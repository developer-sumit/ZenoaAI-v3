import React from 'react';
import {
  View,
  Text,
  Modal,
  Dimensions,
  Pressable,
  TouchableOpacity,
} from 'react-native';

import {useTheme} from '@src/store/themeStore';
import {useStrings} from '@src/hooks/useStrings';

interface InfoDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const {width} = Dimensions.get('window');

const InfoDialog: React.FC<InfoDialogProps> = ({
  visible,
  onClose,
  title,
  message,
}) => {
  const strings = useStrings();
  const {isDark, theme} = useTheme();

  return (
    <Modal
      animationType="fade"
      visible={visible}
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-center items-center bg-black/50"
        onPress={onClose}>
        <Pressable
          className="rounded-3xl p-5 items-center shadow-lg elevation-md"
          style={{width: width * 0.85, backgroundColor: theme.surface}}
          onPress={e => e.stopPropagation()}>
          <Text
            className="text-2xl font-bold mb-2.5 text-center"
            style={{color: theme.text}}>
            {title}
          </Text>
          <View className="h-[1px] w-full mb-4 bg-[#E2E8F0]" />
          <Text
            className="text-lg mb-4 text-center"
            style={{color: theme.secondaryText}}>
            {message}
          </Text>
          <TouchableOpacity
            className="rounded-xl py-3 px-6 elevation-xl"
            style={{
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
            }}
            onPress={onClose}>
            <Text
              className="font-semibold text-center text-lg"
              style={{color: isDark ? theme.text : 'white'}}>
              {strings.common.gotIt}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default InfoDialog;
