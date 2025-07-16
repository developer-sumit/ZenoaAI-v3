import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
  Vibration,
} from 'react-native';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';

// Icons
import CloseIcon from '@src/assets/icons/CloseIcon';
import LightbulbOutlineIcon from '@src/assets/icons/LightbulbOutlineIcon';
import ChevronDownIcon from '@src/assets/icons/ChevronDownIcon';
import ChevronRightIcon from '@src/assets/icons/ChevronRightIcon';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  theme: any;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const samplePrompts = [
  {
    category: '🔮 Fantasy',
    description: 'Magical worlds and creatures',
    prompts: [
      'A magical forest with glowing mushrooms and a unicorn, fantasy art',
      'Ancient wizard tower on a floating island, mystical, dramatic lighting',
      'Dragon sleeping on a treasure hoard in a mountain cave',
    ],
  },
  {
    category: '🖼️ Landscape',
    description: 'Beautiful scenery and environments',
    prompts: [
      'Serene mountain lake at sunset with reflections in the water',
      'Enchanted garden with exotic flowers and butterflies, vibrant colors',
      'Desert oasis under starry night sky with northern lights',
    ],
  },
  {
    category: '🧚 Characters',
    description: 'Unique people and beings',
    prompts: [
      'Steampunk explorer with brass goggles and mechanical arm',
      'Elf ranger with bow and arrow in an ancient forest',
      'Futuristic cyberpunk detective in a neon-lit city',
    ],
  },
  {
    category: '🏙️ Cityscapes',
    description: 'Urban environments and architecture',
    prompts: [
      'Futuristic city with flying cars and holographic billboards',
      'Ancient temple city built into a mountain, mist, golden hour',
      'Underwater civilization with bio-luminescent architecture',
    ],
  },
];

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelectPrompt,
  theme,
  visible,
  setVisible,
}) => {
  const strings = useStrings();
  const {triggerHaptic} = useHaptics();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(
    null,
  );

  useEffect(() => {
    if (visible) {
      // Reset expanded category when opening
      setExpandedCategory(null);

      // Slide up and fade in animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  if (!visible) {
    return null;
  }

  const toggleCategory = (category: string) => {
    // Haptic feedback for category expansion
    if (Platform.OS === 'ios') {
      Vibration.vibrate(30);
    } else {
      Vibration.vibrate(25);
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleSelectPrompt = (prompt: string) => {
    // Haptic feedback for prompt selection
    triggerHaptic('selection');

    // Animate closing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSelectPrompt(prompt);
      setVisible(false);
    });
  };

  return (
    <Animated.View
      className="absolute inset-0 justify-end z-10"
      style={{
        backgroundColor: 'rgba(0,0,0,0.5)',
        opacity: fadeAnim,
        bottom: 30,
      }}>
      {/* Backdrop press to dismiss */}
      <Pressable
        className="absolute inset-0"
        onPress={() => setVisible(false)}
      />
      <Animated.View
        className="rounded-t-3xl max-h-[80%] pb-8"
        style={{
          backgroundColor: theme.surface,
          transform: [{translateY: slideAnim}],
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -4},
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 20,
        }}>
        {/* Handle indicator for dragging */}
        <View className="w-full items-center pt-2 pb-1">
          <View className="h-1 w-12 rounded-full bg-gray-300 opacity-60" />
        </View>

        {/* Header */}
        <View className="flex-row justify-between items-center px-5 py-4">
          <View className="flex-row items-center">
            <LightbulbOutlineIcon size={24} color={theme.primary} />
            <Text
              className="text-xl font-bold ml-3"
              style={{color: theme.text}}
              accessible={true}
              accessibilityRole="header">
              {strings.home.promptIdeas}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setVisible(false)}
            className="p-2 rounded-full"
            style={{backgroundColor: theme.background + '80'}}
            accessible={true}
            accessibilityLabel={strings.home.closePromptSuggestions}
            accessibilityRole="button"
            accessibilityHint={strings.home.closePromptSuggestions}>
            <CloseIcon size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Introduction text */}
        <Text
          className="text-base mx-5 mb-4"
          style={{color: theme.secondaryText}}
          accessible={true}
          accessibilityRole="text">
          {strings.home.promptSuggestionsHint}
        </Text>

        {/* Categories */}
        <ScrollView
          className="px-5"
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 30}}>
          {samplePrompts.map((category, index) => (
            <View
              key={category.category}
              className={`mb-4 ${
                index === samplePrompts.length - 1 ? 'mb-8' : ''
              }`}>
              {/* Category Header - Touchable to expand/collapse */}
              <TouchableOpacity
                className="flex-row items-center justify-between p-4 rounded-2xl border"
                style={{
                  backgroundColor:
                    expandedCategory === category.category
                      ? theme.primary + '15'
                      : theme.background + '50',
                  borderColor:
                    expandedCategory === category.category
                      ? theme.primary + '30'
                      : 'transparent',
                }}
                onPress={() => toggleCategory(category.category)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${category.category} category, ${
                  expandedCategory === category.category
                    ? 'expanded'
                    : 'collapsed'
                }`}
                accessibilityHint={strings.home.usePromptHint}>
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">
                    {category.category.split(' ')[0]}
                  </Text>
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{color: theme.text}}>
                      {category.category.split(' ')[1]}
                    </Text>
                    <Text
                      className="text-sm mt-0.5"
                      style={{color: theme.secondaryText}}>
                      {category.description}
                    </Text>
                  </View>
                </View>
                {expandedCategory === category.category ? (
                  <ChevronDownIcon size={20} color={theme.primary} />
                ) : (
                  <ChevronRightIcon size={20} color={theme.primary} />
                )}
              </TouchableOpacity>

              {/* Expanded Prompts */}
              {expandedCategory === category.category && (
                <View className="mt-2 space-y-2">
                  {category.prompts.map((prompt, promptIndex) => (
                    <TouchableOpacity
                      key={`${category.category}-${promptIndex}`}
                      onPress={() => handleSelectPrompt(prompt)}
                      className="p-4 rounded-xl flex-row items-center border-l-4 mb-1"
                      style={{
                        backgroundColor: theme.background + '70',
                        borderLeftColor: theme.primary,
                      }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`${strings.home.usePrompt}: ${prompt}`}
                      accessibilityHint={strings.home.usePromptHint}>
                      <Text
                        className="text-base leading-6 flex-1"
                        style={{color: theme.text}}>
                        {prompt}
                      </Text>
                      <Text
                        className="ml-2 px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: theme.primary + '20',
                          color: theme.primary,
                        }}>
                        {strings.home.usePrompt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

export default PromptSuggestions;
