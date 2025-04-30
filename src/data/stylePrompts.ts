export interface StylePrompt {
  name: string;
  promptTemplate: string;
}

export const stylePrompts: Record<string, StylePrompt> = {
  Realistic: {
    name: 'Realistic',
    promptTemplate:
      'ultra realistic, photorealistic, highly detailed photography, 8k resolution, professional lighting, sharp focus, cinematic, lifelike textures',
  },
  Cyberpunk: {
    name: 'Cyberpunk',
    promptTemplate:
      'cyberpunk style, neon lighting, futuristic cityscape, digital art, high contrast, electric colors, dystopian atmosphere, techno-urban aesthetic, cybernetic elements',
  },
  Anime: {
    name: 'Anime',
    promptTemplate:
      'anime style, vibrant colors, distinct outlines, expressive features, japanese animation aesthetic, cel shaded, manga inspired, studio quality',
  },
  '3D Emoji': {
    name: '3D Emoji',
    promptTemplate:
      '3D emoji style, rounded forms, glossy surfaces, cute character design, vibrant colors, playful aesthetic, expressive, bubbly design',
  },
  Watercolor: {
    name: 'Watercolor',
    promptTemplate:
      'watercolor painting, soft color blending, flowing pigments, artistic brushstrokes, traditional art medium, delicate washes, organic textures, handcrafted feel',
  },
  Surrealism: {
    name: 'Surrealism',
    promptTemplate:
      'surrealist art style, dreamlike quality, bizarre juxtapositions, metaphysical elements, Salvador Dali inspired, René Magritte inspired, impossible physics, psychological themes',
  },
  Minimalist: {
    name: 'Minimalist',
    promptTemplate:
      'minimalist style, clean lines, limited color palette, negative space, elegant simplicity, geometric forms, essential elements only, modern design',
  },
  Abstract: {
    name: 'Abstract',
    promptTemplate:
      'abstract art style, non-representational forms, bold colors, expressive shapes, geometric patterns, artistic composition, emotional visual language, modern art movement',
  },
  'Pixel Art': {
    name: 'Pixel Art',
    promptTemplate:
      'pixel art style, 8-bit aesthetic, visible pixels, limited palette, retro gaming style, pixelated details, clean edges, nostalgic digital art',
  },
  Steampunk: {
    name: 'Steampunk',
    promptTemplate:
      'steampunk aesthetic, Victorian era technology, brass machinery, copper and bronze tones, mechanical gears, steam-powered devices, vintage industrial, alternative history vibe',
  },
  Cinematic: {
    name: 'Cinematic',
    promptTemplate:
      'cinematic composition, dramatic lighting, movie still quality, professional color grading, widescreen format, filmic atmosphere, depth of field, high production value',
  },
  'Pop Art': {
    name: 'Pop Art',
    promptTemplate:
      'pop art style, bright primary colors, bold outlines, halftone dot patterns, comic book aesthetic, Andy Warhol inspired, Roy Lichtenstein inspired, cultural iconography',
  },
  'Cyber Gothic': {
    name: 'Cyber Gothic',
    promptTemplate:
      'cyber gothic aesthetic, dark futuristic style, neon accents against black, gothic architecture with technology, high tech medieval, biomechanical elements, eerie technological atmosphere',
  },
  'Low Poly': {
    name: 'Low Poly',
    promptTemplate:
      'low poly style, geometric triangular faces, 3D modeling aesthetic, faceted surfaces, clean edges, minimal texturing, stylized reduction, modern digital art',
  },
  '3D Art': {
    name: '3D Art',
    promptTemplate:
      '3D rendered art, volumetric lighting, ray tracing, detailed textures, studio quality 3D, computer generated imagery, realistic materials, professional rendering',
  },
  'Charcoal Sketch': {
    name: 'Charcoal Sketch',
    promptTemplate:
      'charcoal sketch style, grainy texture, high contrast, rough strokes, traditional drawing, monochromatic, artistic shading, expressive mark-making',
  },
  'Digital Glitch': {
    name: 'Digital Glitch',
    promptTemplate:
      'digital glitch effect, corrupted data aesthetic, pixel sorting, RGB shift, datamoshing, electronic distortion, broken digital artifacts, technological error art',
  },
  'Sci-Fi Futuristic': {
    name: 'Sci-Fi Futuristic',
    promptTemplate:
      'sci-fi futuristic style, advanced technology, sleek design, holographic elements, futuristic architecture, high-tech environment, space-age aesthetic, otherworldly atmosphere',
  },
  Cartoon: {
    name: 'Cartoon',
    promptTemplate:
      'cartoon style, bold outlines, flat colors, exaggerated proportions, simplified shapes, animated aesthetic, playful design, character illustration',
  },
  Claymation: {
    name: 'Claymation',
    promptTemplate:
      'claymation style, stop motion aesthetic, textured clay surfaces, handcrafted feel, slightly imperfect forms, tactile quality, dimensional lighting, Aardman animation style',
  },
  'Origami Paper': {
    name: 'Origami Paper',
    promptTemplate:
      'origami paper art style, folded paper texture, crisp edges, geometric forms, paper craft aesthetic, minimalist design, clean folds, Japanese inspired paper art',
  },
  'Retro Art': {
    name: 'Retro Art',
    promptTemplate:
      'retro art style, vintage color palette, nostalgic aesthetic, mid-century design, old-school illustration, classic advertising style, aged texture, 70s-80s inspired',
  },
  'Manga Panels': {
    name: 'Manga Panels',
    promptTemplate:
      'manga panel style, Japanese comic art, dynamic composition, expressive linework, dramatic perspective, speed lines, emotional storytelling, monochrome with screen tones',
  },
  'Game Art': {
    name: 'Game Art',
    promptTemplate:
      'video game art style, stylized 3D, texturing for games, dynamic lighting, character design, environmental concept art, playable aesthetic, immersive world design',
  },
  Pokemon: {
    name: 'Pokemon',
    promptTemplate:
      'Pokemon style, anime creature design, vibrant colors, cute monsters, simplified anatomy, Japanese animation aesthetic, game-inspired characters, collectible creature art',
  },
};

// Default fallback if a style doesn't have a template
export const getStylePrompt = (styleName: string): string => {
  return stylePrompts[styleName]?.promptTemplate || styleName;
};
