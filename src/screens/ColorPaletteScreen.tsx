import React, {useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme, ColorPalette} from '@src/store/themeStore';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';

// Icons
import ArrowBackIcon from '@src/assets/icons/ArrowBackIcon';
import CheckmarkIcon from '@src/assets/icons/CheckmarkIcon';

const {width} = Dimensions.get('window');
const PALETTE_ITEM_WIDTH = (width - 60) / 3; // 3 items per row with margins

const ColorPaletteScreen: React.FC = () => {
  const navigation = useNavigation();
  const {theme, selectedPalette, setPalette, availablePalettes} =
    useTheme();
  const t = useStrings();
  const {triggerHaptic} = useHaptics();

  const handlePaletteSelect = useCallback(
    (palette: ColorPalette) => {
      triggerHaptic('medium');
      setPalette(palette);
    },
    [setPalette, triggerHaptic],
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderPaletteItem = useCallback(
    (palette: ColorPalette) => {
      const isSelected = selectedPalette.name === palette.name;

      return (
        <TouchableOpacity
          key={palette.name}
          style={{
            width: PALETTE_ITEM_WIDTH,
            marginBottom: 20,
          }}
          onPress={() => handlePaletteSelect(palette)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${palette.name} color palette${isSelected ? ', selected' : ''}`}>
          {/* Color Preview Circle */}
          <View
            style={{
              width: PALETTE_ITEM_WIDTH - 20,
              height: PALETTE_ITEM_WIDTH - 20,
              borderRadius: (PALETTE_ITEM_WIDTH - 20) / 2,
              backgroundColor: palette.primary,
              marginBottom: 12,
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
            {/* Inner gradient circle for depth */}
            <View
              style={{
                width: PALETTE_ITEM_WIDTH - 40,
                height: PALETTE_ITEM_WIDTH - 40,
                borderRadius: (PALETTE_ITEM_WIDTH - 40) / 2,
                backgroundColor: palette.primary,
                opacity: 0.8,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {isSelected && <CheckmarkIcon size={24} color="white" />}
            </View>
          </View>

          {/* Color Name */}
          <Text
            style={{
              color: theme.text,
              fontSize: 14,
              fontWeight: isSelected ? '600' : '500',
              textAlign: 'center',
            }}>
            {palette.name}
          </Text>

          {/* Selection indicator */}
          {isSelected && (
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: palette.primary,
                alignSelf: 'center',
                marginTop: 4,
              }}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selectedPalette, theme.text, handlePaletteSelect],
  );

  return (
    <View style={{flex: 1, backgroundColor: theme.background}}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 20,
          backgroundColor: theme.surface,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
        <TouchableOpacity
          onPress={handleBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.background,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}>
          <ArrowBackIcon size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={{flex: 1}}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.text,
            }}>
            {t('settings.colorPalette')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.secondaryText,
              marginTop: 2,
            }}>
            {t('settings.colorPaletteDescription')}
          </Text>
        </View>
      </View>

      {/* Color Palettes Grid */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
          {availablePalettes.map(renderPaletteItem)}
        </View>

        {/* Info text */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 16,
            borderRadius: 16,
            marginTop: 20,
          }}>
          <Text
            style={{
              color: theme.secondaryText,
              fontSize: 14,
              lineHeight: 20,
              textAlign: 'center',
            }}>
            {t('settings.colorPaletteInfo')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ColorPaletteScreen;
