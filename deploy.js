const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const git = simpleGit();

// The folder containing your built app
const distFolder = path.join(__dirname, 'dist');
// The `gh-pages` branch
const ghPagesBranch = 'gh-pages';

// Step 1: Run build command (optional)
console.log('Building the project...');
const execSync = require('child_process').execSync;
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
