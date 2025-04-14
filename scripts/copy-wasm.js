const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules', 'onnxruntime-web', 'dist');
const targetDir = path.join(__dirname, '..', 'public');

// Update file names to match what's actually in the dist directory
const filesToCopy = [
  // WASM files
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.jsep.wasm',
  // JavaScript runtime files
  'ort.wasm.min.js',
  'ort.wasm.min.js.map'
];

if (!fs.existsSync(sourceDir)) {
  console.error('Source directory not found:', sourceDir);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✓ Copied ${file} to public directory`);
    } else {
      console.warn(`⚠ Warning: ${file} not found in source directory`);
    }
  } catch (error) {
    console.error(`✕ Error copying ${file}:`, error.message);
  }
});