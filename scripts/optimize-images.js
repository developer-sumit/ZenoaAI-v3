import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import sharp from 'sharp';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageDir = path.join(__dirname, '../src/assets');
const outputDir = path.join(__dirname, '../optimized-assets');

// Define resize configurations based on image location/purpose
const RESIZE_CONFIGS = {
  // Default sizes for different directories
  icons: {maxWidth: 64, maxHeight: 64},
  backgrounds: {maxWidth: 1080, maxHeight: 1920},
  'art-styles': {maxWidth: 300, maxHeight: 300},
  avatars: {maxWidth: 200, maxHeight: 200},
  thumbnails: {maxWidth: 150, maxHeight: 150},
  // Default for anything not matched above
  default: {maxWidth: 512, maxHeight: 512},
};

// Quality settings
const QUALITY_SETTINGS = {
  png: {quality: 80, compressionLevel: 9},
  jpeg: {quality: 85},
  webp: {quality: 85}, // Adding WebP as an option
};

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, {recursive: true});
}

// Recursively find all image files
const findImages = dir => {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(findImages(filePath));
    } else {
      if (/\.(png|jpg|jpeg)$/i.test(file)) {
        results.push(filePath);
      }
    }
  });

  return results;
};

// Determine appropriate resize configuration based on file path
const getResizeConfig = filePath => {
  // Extract directory name to determine image category
  const relativePath = path.relative(imageDir, filePath);
  const pathParts = relativePath.split(path.sep);

  // Check each directory segment for a match in our config
  for (const part of pathParts) {
    const lowerPart = part.toLowerCase();

    // Check for matching directory names
    for (const configKey of Object.keys(RESIZE_CONFIGS)) {
      if (lowerPart.includes(configKey)) {
        return RESIZE_CONFIGS[configKey];
      }
    }
  }

  // Return default config if no matches found
  return RESIZE_CONFIGS.default;
};

// Process each image
const processImages = async () => {
  const imagePaths = findImages(imageDir);
  let optimizedCount = 0;
  let totalSavings = 0;

  console.log(`Found ${imagePaths.length} images to process...`);

  for (const imagePath of imagePaths) {
    // Determine relative path to maintain folder structure
    const relativePath = path.relative(imageDir, imagePath);
    const outputPath = path.join(outputDir, relativePath);

    // For WebP conversion (optional)
    const webpOutputPath = outputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

    // Ensure output directory exists for this file
    const outputFileDir = path.dirname(outputPath);
    if (!fs.existsSync(outputFileDir)) {
      fs.mkdirSync(outputFileDir, {recursive: true});
    }

    try {
      // Get original file size
      const originalSize = fs.statSync(imagePath).size;

      // Get resize configuration based on file path
      const resizeConfig = getResizeConfig(imagePath);

      // Get image metadata to determine if resizing is needed
      const metadata = await sharp(imagePath).metadata();

      // Prepare the sharp instance
      let sharpInstance = sharp(imagePath);

      // Only resize if the image is larger than our target dimensions
      if (
        metadata.width > resizeConfig.maxWidth ||
        metadata.height > resizeConfig.maxHeight
      ) {
        sharpInstance = sharpInstance.resize({
          width: resizeConfig.maxWidth,
          height: resizeConfig.maxHeight,
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true, // Don't enlarge small images
        });
      }

      // Process image based on extension
      const ext = path.extname(imagePath).toLowerCase();

      if (ext === '.png') {
        await sharpInstance.png(QUALITY_SETTINGS.png).toFile(outputPath);

        // Optionally convert to WebP as well
        // await sharpInstance.webp(QUALITY_SETTINGS.webp).toFile(webpOutputPath);
      } else {
        await sharpInstance.jpeg(QUALITY_SETTINGS.jpeg).toFile(outputPath);

        // Optionally convert to WebP as well
        // await sharpInstance.webp(QUALITY_SETTINGS.webp).toFile(webpOutputPath);
      }

      // Calculate and track savings
      if (fs.existsSync(outputPath)) {
        const newSize = fs.statSync(outputPath).size;
        const savings = originalSize - newSize;
        const percentage = Math.round((savings / originalSize) * 100);

        totalSavings += savings;

        console.log(
          `Processed ${relativePath}: ${(originalSize / 1024).toFixed(
            1,
          )}KB → ${(newSize / 1024).toFixed(1)}KB (${percentage}% reduction)`,
        );
      }

      optimizedCount++;
    } catch (error) {
      console.error(`Error processing ${imagePath}:`, error);
    }
  }

  const totalSavingsMB = (totalSavings / (1024 * 1024)).toFixed(2);
  console.log(`\nOptimization complete:`);
  console.log(`- Processed ${optimizedCount} of ${imagePaths.length} images`);
  console.log(`- Total size reduction: ${totalSavingsMB}MB`);
  console.log(`- Output directory: ${outputDir}`);
};

// Execute the optimization
processImages().catch(err => {
  console.error('Optimization failed:', err);
});
