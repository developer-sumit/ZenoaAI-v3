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
  Sticker: {
    name: 'Sticker',
    promptTemplate:
      'sticker art style, clean vector design, flat colors with subtle gradients, bold outlines, adhesive appearance, die-cut shape, glossy finish, playful and expressive character design, commercially printable quality, decorative illustration, white border edge, slightly raised surface effect, vibrant colors, professional graphic design, eye-catching simple background',
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
  '3D Figurine': {
    name: '3D Figurine',
    promptTemplate:
      '3D figurine in transparent display box, collectible toy aesthetic, miniature character in plastic packaging, product photography, action figure style, detailed vinyl toy, clear blister pack, studio lighting, character collectible, designer toy, vinyl art toy, product showcase, high-end collectible presentation, ultra detailed 3D modeling, professional product render',
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
  'Manga': {
    name: 'Manga',
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
  Impressionism: {
    name: 'Impressionism',
    promptTemplate:
      'impressionist painting style, loose brushwork, emphasis on light and movement, en plein air technique, Claude Monet inspired, vibrant color palette, capturing fleeting moments, atmospheric quality',
  },
  Cubism: {
    name: 'Cubism',
    promptTemplate:
      'cubist art style, geometric fragmentation, multiple viewpoints simultaneously, abstract forms, Pablo Picasso inspired, Georges Braque inspired, deconstructed subjects, angular shapes',
  },
  'Art Nouveau': {
    name: 'Art Nouveau',
    promptTemplate:
      'art nouveau style, organic flowing curves, natural forms and structures, ornamental elements, decorative aesthetic, Alphonse Mucha inspired, sinuous lines, stylized floral patterns',
  },
  'Art Deco': {
    name: 'Art Deco',
    promptTemplate:
      'art deco style, geometric patterns, bold shapes, symmetrical composition, luxurious appearance, sleek lines, vibrant colors, 1920s-30s aesthetic, glamorous and modern',
  },
  Renaissance: {
    name: 'Renaissance',
    promptTemplate:
      'renaissance art style, classical composition, realistic human anatomy, oil painting technique, dramatic lighting, rich color palette, religious or mythological themes, perspective and depth',
  },
  Baroque: {
    name: 'Baroque',
    promptTemplate:
      'baroque art style, dramatic lighting, rich deep colors, grandeur and opulence, emotional intensity, dynamic composition, Caravaggio inspired, Rembrandt inspired, theatrical quality',
  },
  'Ukiyo-e': {
    name: 'Ukiyo-e',
    promptTemplate:
      'ukiyo-e Japanese woodblock print style, flat colors, bold outlines, detailed patterns, traditional Japanese aesthetic, Hokusai inspired, Hiroshige inspired, floating world scenes',
  },
  Bauhaus: {
    name: 'Bauhaus',
    promptTemplate:
      'bauhaus design style, geometric abstraction, primary colors, minimalist approach, functional aesthetic, clean lines, typography integration, industrial materials, modernist principles',
  },
  Gothic: {
    name: 'Gothic',
    promptTemplate:
      'gothic art style, medieval aesthetic, religious iconography, elaborate detail, rich jewel tones, dramatic emotional expressions, architectural elements, manuscript illumination style',
  },
  Expressionism: {
    name: 'Expressionism',
    promptTemplate:
      'expressionist art style, intense emotional quality, distorted forms, vivid unnatural colors, bold brushwork, psychological depth, Edvard Munch inspired, Ernst Ludwig Kirchner inspired',
  },
  Fauvism: {
    name: 'Fauvism',
    promptTemplate:
      'fauvist art style, wildly vibrant non-naturalistic colors, bold brushstrokes, simplified forms, emotional expression over realism, Henri Matisse inspired, André Derain inspired',
  },
  Vaporwave: {
    name: 'Vaporwave',
    promptTemplate:
      'vaporwave aesthetic, 80s-90s nostalgia, glitch art elements, pastel pink and blue palette, Greek classical statues, retro computer graphics, japanese text elements, surreal digital landscape',
  },
  Rococo: {
    name: 'Rococo',
    promptTemplate:
      'rococo art style, light pastel colors, elaborate ornamentation, playful themes, asymmetrical designs, gilded details, Jean-Honoré Fragonard inspired, decorative and whimsical',
  },
  Dadaism: {
    name: 'Dadaism',
    promptTemplate:
      'dadaist art style, absurdist elements, found objects, photomontage, anti-art sentiment, Marcel Duchamp inspired, Hannah Höch inspired, nonsensical juxtapositions, provocative imagery',
  },
  'De Stijl': {
    name: 'De Stijl',
    promptTemplate:
      'de stijl art style, primary colors with black and white, geometric abstraction, Piet Mondrian inspired, straight horizontal and vertical lines, rectangular forms, minimal elements',
  },
  'Optical Illusion': {
    name: 'Optical Illusion',
    promptTemplate:
      'op art style, optical illusion, geometric abstract patterns, black and white or vivid colors, Victor Vasarely inspired, Bridget Riley inspired, visual movement effect, perceptual experience',
  },
  'Memphis Design': {
    name: 'Memphis Design',
    promptTemplate:
      'memphis design style, 1980s aesthetic, bold geometric patterns, bright contrasting colors, asymmetrical shapes, playful composition, Ettore Sottsass inspired, postmodern design elements',
  },
  Brutalism: {
    name: 'Brutalism',
    promptTemplate:
      'brutalist design style, raw concrete textures, monolithic forms, minimalist geometric shapes, austere appearance, strong shadows, imposing scale, utilitarian aesthetic',
  },
  Suprematism: {
    name: 'Suprematism',
    promptTemplate:
      'suprematist art style, geometric abstraction, limited color palette, floating shapes on white background, non-objective art, Kazimir Malevich inspired, mathematical forms, pure abstraction',
  },
  Constructivism: {
    name: 'Constructivism',
    promptTemplate:
      'constructivist art style, geometric shapes, dynamic composition, bold typography, Russian avant-garde, industrial aesthetic, propaganda poster style, El Lissitzky inspired, Alexander Rodchenko inspired',
  },
  'Art Brut': {
    name: 'Art Brut',
    promptTemplate:
      'art brut style, raw outsider art, naive technique, unconventional materials, Jean Dubuffet inspired, primitive quality, untrained expression, spontaneous composition, intense authenticity',
  },
  Neoclassicism: {
    name: 'Neoclassicism',
    promptTemplate:
      'neoclassical art style, Greek and Roman influences, idealized figures, historical scenes, refined technique, Jacques-Louis David inspired, harmonious composition, sculptural quality',
  },
  'Studio Ghibli': {
    name: 'Studio Ghibli',
    promptTemplate:
      'Studio Ghibli animation style, Hayao Miyazaki inspired, whimsical hand-drawn aesthetic, pastel color palette, natural environments, magical realism, ethereal lighting, expressive characters',
  },
  'Disney Animation': {
    name: 'Disney Animation',
    promptTemplate:
      'Disney animation style, expressive characters, vibrant colors, smooth motion aesthetic, magical atmosphere, detailed backgrounds, classic fairy tale quality, emotional storytelling',
  },
  Synthwave: {
    name: 'Synthwave',
    promptTemplate:
      'synthwave aesthetic, 80s retro futurism, neon pinks and purples, low sun, grid landscapes, wireframe elements, sunset silhouettes, VHS quality, outrun style',
  },
  'Film Noir': {
    name: 'Film Noir',
    promptTemplate:
      'film noir style, high contrast black and white, dramatic shadows, venetian blinds lighting effect, mysterious atmosphere, 1940s aesthetic, dramatic side lighting, moody cinematic quality',
  },
  'Art of Diablo': {
    name: 'Art of Diablo',
    promptTemplate:
      'Diablo game art style, dark fantasy, gothic horror elements, dramatic lighting, gritty textures, ominous atmosphere, demonic creatures, rich dark color palette',
  },
  'Wes Anderson': {
    name: 'Wes Anderson',
    promptTemplate:
      'Wes Anderson film style, symmetrical composition, pastel color palette, whimsical set design, vintage aesthetic, quirky characters, meticulous detail, Grand Budapest Hotel inspired',
  },
  'Tim Burton': {
    name: 'Tim Burton',
    promptTemplate:
      'Tim Burton style, gothic whimsy, black and white striped elements, spiraling shapes, exaggerated thin figures, dark fantasy elements, Edward Scissorhands inspired, quirky macabre',
  },
  Minecraft: {
    name: 'Minecraft',
    promptTemplate:
      'Minecraft voxel style, blocky pixel art, cube-based geometry, limited textures, sandbox game aesthetic, distinctive pixelated shapes, 8-bit inspired 3D design',
  },
  'Borderlands Cel Shaded': {
    name: 'Borderlands Cel Shaded',
    promptTemplate:
      'Borderlands game art style, cel shaded technique, comic book outlines, exaggerated proportions, vibrant colors, detailed hand-drawn textures, distinctive black edge lines',
  },
};

// Default fallback if a style doesn't have a template
export const getStylePrompt = (styleName: string): string => {
  return stylePrompts[styleName]?.promptTemplate || styleName;
};
