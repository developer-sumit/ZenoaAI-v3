export const generateImage = async ({
  prompt,
  width,
  height,
  quality,
  sampler,
  seed,
}: {
  prompt: string;
  width: number | string;
  height: number | string;
  negativePrompt: string;
  quality: number;
  sampler: string;
  seed: number;
}) => {
  return await fetch(
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=${width}` +
      `&height=${height}` +
      `&steps=${quality}&sampler=${sampler}` +
      `&seed=${seed}&nologo=true&enhance=true`,
  );
};
