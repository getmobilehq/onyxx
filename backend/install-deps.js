const { execSync } = require('child_process');

console.log('Installing cloudinary and multer dependencies...');

try {
  // Install cloudinary
  console.log('Installing cloudinary...');
  execSync('npm install cloudinary@1.41.3', { stdio: 'inherit', cwd: __dirname });
  
  // Install multer
  console.log('Installing multer...');
  execSync('npm install multer@1.4.5-lts.1', { stdio: 'inherit', cwd: __dirname });
  
  // Install @types/multer for TypeScript
  console.log('Installing @types/multer...');
  execSync('npm install --save-dev @types/multer@1.4.11', { stdio: 'inherit', cwd: __dirname });
  
  console.log('✅ All dependencies installed successfully!');
  
  // Clean up this script
  const fs = require('fs');
  fs.unlinkSync(__filename);
  console.log('Installation script cleaned up.');
  
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}