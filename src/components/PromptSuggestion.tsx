import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import CloseIcon from '@src/assets/icons/CloseIcon';

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  colors: any;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const samplePrompts = [
  {
    category: '🔮 Fantasy',
    prompts: [
      'A magical forest with glowing mushrooms and a unicorn, fantasy art',
      'Ancient wizard tower on a floating island, mystical, dramatic lighting',
      'Dragon sleeping on a treasure hoard in a mountain cave',
    ],
  },
  {
    category: '🖼️ Landscape',
    prompts: [
      'Serene mountain lake at sunset with reflections in the water',
      'Enchanted garden with exotic flowers and butterflies, vibrant colors',
      'Desert oasis under starry night sky with northern lights',
    ],
  },
  {
    category: '🧚 Characters',
    prompts: [
      'Steampunk explorer with brass goggles and mechanical arm',
      'Elf ranger with bow and arrow in an ancient forest',
      'Futuristic cyberpunk detective in a neon-lit city',
    ],
  },
  {
    category: '🏙️ Cityscapes',
    prompts: [
      'Futuristic city with flying cars and holographic billboards',
      'Ancient temple city built into a mountain, mist, golden hour',
      'Underwater civilization with bio-luminescent architecture',
    ],
  },
];

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelectPrompt,
  colors,
  visible,
  setVisible,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View
      className="absolute bottom-[170px] left-4 right-4 rounded-2xl p-4 max-h-[400px]"
      style={{
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text style={{color: colors.text}} className="text-lg font-semibold">
          Try a sample prompt
        </Text>
        <TouchableOpacity
          onPress={() => setVisible(false)}
          className="p-1 rounded-full"
          style={{backgroundColor: colors.background + '60'}}
          accessible={true}
          accessibilityLabel="Close prompt suggestions">
          <CloseIcon size={20} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="max-h-[300px]">
        {samplePrompts.map((category, index) => (
          <View key={index} className="mb-4">
            <Text
              style={{color: colors.secondaryText}}
              className="mb-2 text-sm">
              {category.category}
            </Text>
            {category.prompts.map((prompt, promptIndex) => (
              <TouchableOpacity
                key={promptIndex}
                onPress={() => {
                  onSelectPrompt(prompt);
                  setVisible(false);
                }}
                style={{backgroundColor: colors.background + '50'}}
                accessible={true}
                accessibilityLabel={`Use prompt suggestion: ${prompt}`}
                className="p-3 mb-2 rounded-xl">
                <Text style={{color: colors.text}}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default PromptSuggestions;
