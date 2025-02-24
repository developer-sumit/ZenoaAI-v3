export const generateImage = async ({
  prompt,
  width,
  height,
  quality,
  sampler,
  currentSeed,
}: {
  prompt: string;
  width: number | string;
  height: number | string;
  negativePrompt: string;
  quality: number;
  sampler: string;
  currentSeed: number;
}) => {
  return await fetch(
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=${width}` +
      `&height=${height}` +
      `&steps=${quality}&sampler=${sampler}` +
      `&seed=${currentSeed}&nologo=true`,
  );
};
