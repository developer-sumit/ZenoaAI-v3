import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from './Icon';

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
  if (!visible) return null;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        ...styles.container,
      }}>
      <View style={styles.header}>
        <Text style={{color: colors.text}} className="text-lg font-semibold">
          Try a sample prompt
        </Text>
        <TouchableOpacity
          onPress={() => setVisible(false)}
          className="p-1 rounded-full"
          style={{backgroundColor: colors.background + '60'}}>
          <Icon name="close" size={20} color={colors.secondaryText} />
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 170,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});

export default PromptSuggestions;
