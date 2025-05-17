// Simple script to generate base64 encoded images for direct use
document.addEventListener('DOMContentLoaded', function() {
  // Create simple particle
  const particleCanvas = document.createElement('canvas');
  particleCanvas.width = 32;
  particleCanvas.height = 32;
  const pctx = particleCanvas.getContext('2d');
  
  // Draw white circle
  pctx.fillStyle = '#ffffff';
  pctx.beginPath();
  pctx.arc(16, 16, 8, 0, Math.PI * 2);
  pctx.fill();
  
  // Output base64
  console.log('Particle Base64:');
  console.log(particleCanvas.toDataURL('image/png'));
  
  // Create simple circle
  const circleCanvas = document.createElement('canvas');
  circleCanvas.width = 64;
  circleCanvas.height = 64;
  const cctx = circleCanvas.getContext('2d');
  
  // Draw white circle
  cctx.fillStyle = '#ffffff';
  cctx.beginPath();
  cctx.arc(32, 32, 28, 0, Math.PI * 2);
  cctx.fill();
  
  // Output base64
  console.log('Circle Base64:');
  console.log(circleCanvas.toDataURL('image/png'));
}); 