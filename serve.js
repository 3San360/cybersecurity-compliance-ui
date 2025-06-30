const express = require('express');
const path = require('path');

const app = express();
const PORT = 4200;

const staticPath = path.join(__dirname, 'dist/cybersecurity-compliance-ui/browser');
const indexPath = path.join(__dirname, 'dist/cybersecurity-compliance-ui/browser/index.html');

console.log('Static files directory:', staticPath);
console.log('Index file path:', indexPath);

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the Angular build directory
app.use(express.static(staticPath));

// Handle Angular routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  console.log('Serving index.html for:', req.url);
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`🚀 Angular app served at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${staticPath}`);
});
