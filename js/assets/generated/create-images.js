const fs = require('fs');
const { createCanvas } = require('canvas');

// Create particle image
function createParticleImage() {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  // Set background transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw a white circle with soft edges
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 12;
  
  // Create radial gradient
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, radius
  );
  
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  // Draw circle
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Convert to PNG buffer
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('../particle.png', buffer);
  console.log('Particle image created at ../particle.png');
}

// Create circle image
function createCircleImage() {
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext('2d');
  
  // Set background transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw a white circle
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 30;
  
  // Draw circle
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Add a border
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Convert to PNG buffer
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('../circle.png', buffer);
  console.log('Circle image created at ../circle.png');
}

try {
  createParticleImage();
  createCircleImage();
  console.log('Images created successfully!');
} catch (error) {
  console.error('Error creating images:', error);
} 