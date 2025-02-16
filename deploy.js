import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the current directory using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const git = simpleGit();

// The folder containing your built app
const distFolder = path.join(__dirname, 'dist');
// The `gh-pages` branch
const ghPagesBranch = 'gh-pages';

// Step 1: Run build command (optional)
console.log('Building the project...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Copy `dist` to `gh-pages` branch
async function deploy() {
  try {
    // Checkout to the `gh-pages` branch
    await git.checkout(ghPagesBranch);

    // Remove specific files and folders
    removeFilesAndFolders([
      path.join(__dirname, 'assets'),
      path.join(__dirname, 'index.html'),
      path.join(__dirname, 'vite.svg'),
    ]);
    
    // Copy all files from `dist/` to the current directory
    copyDirectory(distFolder, __dirname);

    // Commit and push the changes to `gh-pages`
    await git.add('.');
    // await git.commit('Deploying to GitHub Pages');
    // await git.push('origin', ghPagesBranch);

    console.log('Deployed successfully!');
  } catch (error) {
    console.error('Error during deployment:', error);
  }
}

// Function to remove specific files and folders
function removeFilesAndFolders(paths) {
  paths.forEach((item) => {
    if (fs.existsSync(item)) {
      const stats = fs.statSync(item);
      if (stats.isDirectory()) {
        // If it's a directory, remove it recursively
        fs.rmdirSync(item, { recursive: true });
      } else {
        // If it's a file, remove it
        fs.unlinkSync(item);
      }
    }
  });
}

// Function to copy directories and files recursively
function copyDirectory(source, target) {
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const srcPath = path.join(source, file);
    const targetPath = path.join(target, file);
    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      // Create the directory if it doesn't exist
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
      }
      // Recursively copy subdirectories
      copyDirectory(srcPath, targetPath);
    } else {
      // Copy the file
      fs.copyFileSync(srcPath, targetPath);
    }
  });
}

deploy();
