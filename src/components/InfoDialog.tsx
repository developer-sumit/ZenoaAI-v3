import React from 'react';
import {
  View,
  Text,
  Modal,
  Dimensions,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import {theme} from '@src/theme/Theme';
import {useThemeStore} from '@src/store/themeStore';

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
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

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
          style={{width: width * 0.85, backgroundColor: colors.surface}}
          onPress={e => e.stopPropagation()}>
          <Text
            className="text-2xl font-bold mb-2.5 text-center"
            style={{color: colors.text}}>
            {title}
          </Text>
          <View className="h-[1px] w-full mb-4 bg-[#E2E8F0]" />
          <Text
            className="text-lg mb-4 text-center"
            style={{color: colors.secondaryText}}>
            {message}
          </Text>
          <TouchableOpacity
            className="rounded-xl py-3 px-6 elevation-xl"
            style={{
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            }}
            onPress={onClose}>
            <Text
              className="font-semibold text-center text-lg"
              style={{color: isDark ? colors.text : 'white'}}>
              Got it
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default InfoDialog;
