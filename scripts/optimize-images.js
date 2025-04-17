import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import sharp from 'sharp';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageDir = path.join(__dirname, '../src/assets');
const outputDir = path.join(__dirname, '../optimized-assets');

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

// Process each image
const processImages = async () => {
  const imagePaths = findImages(imageDir);
  let optimizedCount = 0;

  for (const imagePath of imagePaths) {
    // Determine relative path to maintain folder structure
    const relativePath = path.relative(imageDir, imagePath);
    const outputPath = path.join(outputDir, relativePath);

    // Ensure output directory exists for this file
    const outputFileDir = path.dirname(outputPath);
    if (!fs.existsSync(outputFileDir)) {
      fs.mkdirSync(outputFileDir, {recursive: true});
    }

    try {
      // Process image based on extension
      const ext = path.extname(imagePath).toLowerCase();

      if (ext === '.png') {
        await sharp(imagePath)
          .png({quality: 80, compressionLevel: 9})
          .toFile(outputPath);
      } else {
        await sharp(imagePath).jpeg({quality: 80}).toFile(outputPath);
      }

      optimizedCount++;
    } catch (error) {
      console.error(`Error processing ${imagePath}:`, error);
    }
  }

  console.log(`Optimized ${optimizedCount} images`);
};

// Execute the optimization
processImages().catch(err => {
  console.error('Optimization failed:', err);
});
