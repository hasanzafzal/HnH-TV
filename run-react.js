#!/usr/bin/env node
const path = require('path');

// Change to frontend directory
process.chdir(path.join(__dirname, 'frontend'));

// Set NODE_PATH to include node_modules
process.env.NODE_PATH = path.join(process.cwd(), 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');

// Add node_modules/.bin to PATH
process.env.PATH = path.join(process.cwd(), 'node_modules', '.bin') + path.delimiter + process.env.PATH;

// Get command from args (default to start)
const command = process.argv[2] || 'start';
process.argv = [process.argv[0], 'react-scripts', command, ...process.argv.slice(3)];

// Require and run react-scripts
try {
  require.resolve('react-scripts/bin/react-scripts.js');
  require('react-scripts/bin/react-scripts.js');
} catch (error) {
  console.error('Error running react-scripts:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

