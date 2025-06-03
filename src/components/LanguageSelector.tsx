import React, {useState, forwardRef, useImperativeHandle} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useThemeStore} from '@src/store/themeStore';
import {useLanguageStore} from '@src/store/languageStore';
import {theme} from '@src/theme/Theme';
import CheckmarkIcon from '@src/assets/icons/CheckmarkIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import {useStrings} from '@src/hooks/useStrings';

interface LanguageSelectorProps {
  iconOnly?: boolean;
}

interface LanguageSelectorRef {
  openModal: () => void;
}

const LanguageSelector = forwardRef<LanguageSelectorRef, LanguageSelectorProps>(
  ({iconOnly = false}, ref) => {
    const strings = useStrings();
    const {isDark} = useThemeStore();
    const {language, setLanguage} = useLanguageStore();
    const [modalVisible, setModalVisible] = useState(false);
    const colors = isDark ? theme.dark : theme.light;

    // Expose the openModal function through ref
    useImperativeHandle(ref, () => ({
      openModal: () => setModalVisible(true),
    }));

    const handleLanguageChange = async (selectedLanguage: string) => {
      try {
        setLanguage(selectedLanguage);
        setModalVisible(false);
      } catch (error) {
        console.error('Error changing language:', error);
      }
    };

    const languages = [
      {code: 'en', name: 'English'},
      {code: 'es', name: 'Español (Spanish)'},
      {code: 'pt', name: 'Português (Portuguese)'},
      {code: 'fr', name: 'Français (French)'},
      {code: 'de', name: 'Deutsch (German)'},
      {code: 'hi', name: 'हिन्दी (Hindi)'},
      {code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)'},
      {code: 'mr', name: 'मराठी (Marathi)'},
      {code: 'ta', name: 'தமிழ் (Tamil)'},
      {code: 'te', name: 'తెలుగు (Telugu)'},
      {code: 'ar', name: 'العربية (Arabic)'},
      {code: 'id', name: 'Bahasa Indonesia'},
      {code: 'zh', name: '简体中文 (Simplified Chinese)'},
    ];

    return (
      <>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className={`${
            iconOnly ? 'p-2 rounded-full' : 'flex-row items-center p-3'
          }`}
          style={{backgroundColor: iconOnly ? colors.surface : 'transparent'}}
          accessible={true}
          accessibilityLabel={language}
          accessibilityHint={strings.settings.languageHint}>
          {!iconOnly && (
            <Text className="ml-3" style={{color: colors.text}}>
              {languages.find(lang => lang.code === language)?.name ||
                'English'}
            </Text>
          )}
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent={true}
          statusBarTranslucent={true}
          animationType="fade"
          className="flex-1"
          onRequestClose={() => setModalVisible(false)}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={isDark ? 'dark' : 'light'}
            blurAmount={10}
          />
          <View className="flex-1 justify-center items-center">
            <View
              className="max-h-[80%] w-full max-w-md rounded-3xl overflow-hidden pb-10"
              style={{
                backgroundColor: colors.background,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 10},
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
              }}>
              <View
                className="w-full h-1.5"
                style={{backgroundColor: colors.primary}}
              />

              <View className="p-6 pr-0">
                <View className="flex-row justify-between items-center mb-5">
                  <Text
                    className="text-2xl font-semibold"
                    style={{color: colors.text}}>
                    {strings.common.selectLanguage}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="p-1 pr-6"
                    accessible={true}
                    accessibilityLabel={strings.settings.closeLanguage}>
                    <CloseIcon size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView>
                  {languages.map(lang => (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => handleLanguageChange(lang.code)}
                      className="flex-row items-center justify-between py-4 border-b pr-6"
                      style={{borderColor: colors.secondaryText + '20'}}
                      accessible={true}
                      accessibilityLabel={lang.name}
                      accessibilityState={{selected: language === lang.code}}
                      accessibilityHint={strings.settings.changeLanguageHint}>
                      <Text
                        className="text-lg"
                        style={{
                          color: colors.text,
                          fontWeight:
                            language === lang.code ? 'bold' : 'normal',
                        }}>
                        {lang.name}
                      </Text>
                      {language === lang.code && (
                        <CheckmarkIcon size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  },
);

export default LanguageSelector;
