import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process'; // ES Module import for execSync

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

    // Remove all files (to avoid merge conflicts)
    await git.raw(['rm', '-rf', '.']);
    
    // Copy all files from `dist/` to the current directory
    const distFiles = fs.readdirSync(distFolder);
    distFiles.forEach(file => {
      const filePath = path.join(distFolder, file);
      const targetPath = path.join(__dirname, file);
      fs.copyFileSync(filePath, targetPath);
    });

    // Commit and push the changes to `gh-pages`
    await git.add('.');
    // await git.commit('Deploying to GitHub Pages');
    // await git.push('origin', ghPagesBranch);

    console.log('Deployed successfully!');
  } catch (error) {
    console.error('Error during deployment:', error);
  }
}

deploy();
