#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error('Usage: node update-rotation.js <index> <angleDegrees>');
  console.error('');
  console.error('Arguments:');
  console.error('  <index>: The billboard number (0-7):');
  console.error('    0 = Billboard 1 (text starting with "1.")');
  console.error('    1 = Billboard 2 (text starting with "2.")');
  console.error('    ...and so on');
  console.error('  <angleDegrees>: Rotation angle in degrees (e.g., 0, 90, 180, 270)');
  console.error('');
  console.error('Example: node update-rotation.js 0 180');
  console.error('This will set Billboard 1 to 180 degrees rotation');
  process.exit(1);
}

const index = parseInt(args[0], 10);
const angleDegrees = parseInt(args[1], 10);

if (isNaN(index) || index < 0 || index > 7) {
  console.error('Error: Index must be a number between 0 and 7');
  process.exit(1);
}

if (isNaN(angleDegrees)) {
  console.error('Error: Angle must be a number');
  process.exit(1);
}

// Convert degrees to radians for code use
const getRadiansString = (degrees) => {
  // For common angles, use Math.PI representation
  if (degrees === 0) return '0';
  if (degrees === 90) return 'Math.PI/2';
  if (degrees === 180) return 'Math.PI';
  if (degrees === 270 || degrees === -90) return '3*Math.PI/2';
  if (degrees === -180) return '-Math.PI';
  if (degrees === -270 || degrees === 90) return '-3*Math.PI/2';
  
  // For non-standard angles, calculate the fraction of PI
  return `${degrees/180}*Math.PI`;
};

// Read the Track.js file
const filePath = path.join(__dirname, 'src/js/world/Track.js');
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading the file: ${err}`);
    process.exit(1);
  }
  
  // Find the textRotationAdjustments array
  const rotationArrayRegex = /const\s+textRotationAdjustments\s*=\s*\[([\s\S]*?)\];/;
  const match = data.match(rotationArrayRegex);
  
  if (!match) {
    console.error('Could not find the textRotationAdjustments array in the file');
    process.exit(1);
  }
  
  // Extract the array values
  const arrayContent = match[1];
  const valueLines = arrayContent.split(',').map(line => line.trim());
  
  // Update the value at the specified index
  const radiansValue = getRadiansString(angleDegrees);
  const commentText = `// Text ${index} - ${angleDegrees} degrees`;
  
  // Create the updated line, preserving alignment
  const updatedLine = `${' '.repeat(20)}${radiansValue},${' '.repeat(14)}${commentText}`;
  
  // Replace the specific line while keeping the rest
  valueLines[index] = updatedLine;
  
  // Reconstruct the array with the updated value
  const updatedArrayContent = valueLines.join(',\n');
  const updatedCode = data.replace(rotationArrayRegex, `const textRotationAdjustments = [\n${updatedArrayContent}\n                ];`);
  
  // Write the updated code back to the file
  fs.writeFile(filePath, updatedCode, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error(`Error writing to the file: ${writeErr}`);
      process.exit(1);
    }
    console.log(`Successfully updated rotation for Billboard ${index+1} to ${angleDegrees} degrees (${radiansValue} radians)`);
    console.log(`Note: Billboard ${index+1} corresponds to the billboard with text that starts with "${index+1}. "`);
  });
}); 