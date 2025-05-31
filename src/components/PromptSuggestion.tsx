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
} from 'react-native';
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
  colors: any;
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
  colors,
  visible,
  setVisible,
}) => {
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleSelectPrompt = (prompt: string) => {
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
          backgroundColor: colors.surface,
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
            <LightbulbOutlineIcon size={24} color={colors.primary} />
            <Text
              className="text-xl font-bold ml-3"
              style={{color: colors.text}}
              accessible={true}
              accessibilityRole="header">
              Prompt Ideas
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setVisible(false)}
            className="p-2 rounded-full"
            style={{backgroundColor: colors.background + '80'}}
            accessible={true}
            accessibilityLabel="Close prompt suggestions"
            accessibilityRole="button"
            accessibilityHint="Closes the prompt suggestions panel">
            <CloseIcon size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Introduction text */}
        <Text
          className="text-base mx-5 mb-4"
          style={{color: colors.secondaryText}}
          accessible={true}
          accessibilityRole="text">
          Tap a category below to see ready-to-use prompts for stunning AI art
        </Text>

        {/* Categories */}
        <ScrollView
          className="px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 30}}>
          {samplePrompts.map((category, index) => (
            <View
              key={index}
              className={`mb-4 ${
                index === samplePrompts.length - 1 ? 'mb-8' : ''
              }`}>
              {/* Category Header - Touchable to expand/collapse */}
              <TouchableOpacity
                className="flex-row items-center justify-between p-4 rounded-2xl border"
                style={{
                  backgroundColor:
                    expandedCategory === category.category
                      ? colors.primary + '15'
                      : colors.background + '50',
                  borderColor:
                    expandedCategory === category.category
                      ? colors.primary + '30'
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
                accessibilityHint="Double tap to expand or collapse this category">
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">
                    {category.category.split(' ')[0]}
                  </Text>
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{color: colors.text}}>
                      {category.category.split(' ')[1]}
                    </Text>
                    <Text
                      className="text-sm mt-0.5"
                      style={{color: colors.secondaryText}}>
                      {category.description}
                    </Text>
                  </View>
                </View>
                {expandedCategory === category.category ? (
                  <ChevronDownIcon size={20} color={colors.primary} />
                ) : (
                  <ChevronRightIcon size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Expanded Prompts */}
              {expandedCategory === category.category && (
                <View className="mt-2 space-y-2">
                  {category.prompts.map((prompt, promptIndex) => (
                    <TouchableOpacity
                      key={promptIndex}
                      onPress={() => handleSelectPrompt(prompt)}
                      className="p-4 rounded-xl flex-row items-center border-l-4 mb-1"
                      style={{
                        backgroundColor: colors.background + '70',
                        borderLeftColor: colors.primary,
                      }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Use prompt: ${prompt}`}
                      accessibilityHint="Double tap to use this prompt for your image generation">
                      <Text
                        className="text-base leading-6 flex-1"
                        style={{color: colors.text}}>
                        {prompt}
                      </Text>
                      <Text
                        className="ml-2 px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: colors.primary + '20',
                          color: colors.primary,
                        }}>
                        Use
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
