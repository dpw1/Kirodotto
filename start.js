const { exec } = require('child_process');
const path = require('path');

console.log('Installing dependencies...');

// Run npm install
exec('npm install', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error installing dependencies: ${error}`);
    return;
  }
  
  console.log(stdout);
  console.log('Dependencies installed successfully.');
  console.log('Starting Kirodotto Game...');
  
  // Run npm start
  exec('npm start', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting the game: ${error}`);
      console.log('If the server failed to start, try running "npm start" manually');
      return;
    }
    
    console.log(stdout);
  });
}); 