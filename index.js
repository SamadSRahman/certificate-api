const express = require('express');
const { createCanvas } = require('canvas');
const app = express();
const port = 3000;

// Configure middleware
app.use(express.json());

// Setup view engine for SSR
app.set('view engine', 'ejs');
app.set('views', './views');

// Static bearer token for authentication
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6ImNlcnRpZmljYXRlLWdlbmVyYXRvciJ9";

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  if (token !== BEARER_TOKEN) return res.sendStatus(403);
  
  next();
};

// Certificate API endpoint (HTML response by default)
app.post('/api/generate-certificate', authenticateToken, async (req, res) => {
  try {
    // Extract parameters from request body
    const {
      name,
      dealerName,
      dealerCode,
      date,
      assessmentName,
      format = "html" // Default to HTML response
    } = req.body;
    
    // Validate required parameters
    if (!name || !dealerName || !dealerCode || !date || !assessmentName) {
      return res.status(400).json({ 
        error: "Missing required parameters. Please provide name, dealerName, dealerCode, date, and assessmentName." 
      });
    }
    
    // Hard-coded company name
    const companyName = "Toyota Kirloskar Motor Pvt Ltd";
    
    // Generate certificate image if PNG format is requested
    if (format.toLowerCase() === 'png') {
      const certificateBuffer = await generateCertificate({
        name,
        dealerName,
        dealerCode,
        date,
        assessmentName,
        companyName
      });
      
      // Return the PNG image
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="certificate-${name}.png"`
      });
      
      return res.send(certificateBuffer);
    }
    
    // Default: Render HTML certificate (SSR)
    res.render('certificate', {
      name,
      dealerName,
      dealerCode,
      date,
      assessmentName,
      companyName
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// Certificate generation function for PNG format
async function generateCertificate(params) {
  // Create canvas for certificate (landscape orientation)
  const width = 1200;
  const height = 900;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Draw certificate background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Add decorative border
  ctx.strokeStyle = '#d4af37'; // Gold color
  ctx.lineWidth = 15;
  ctx.strokeRect(50, 50, width - 100, height - 100);
  
  // Add inner border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 70, width - 140, height - 140);
  
  // Add certificate title
  ctx.font = 'bold 50px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.fillText('Certificate of Completion', width / 2, 170);
  
  // Add certificate text
  ctx.font = '28px Arial';
  ctx.fillText('This is to certify that', width / 2, 250);
  
  // Add name
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#d4af37'; // Gold color
  ctx.fillText(params.name, width / 2, 320);
  
  // Add dealer name and code
  ctx.font = '28px Arial';
  ctx.fillStyle = '#000000';
  ctx.fillText(`${params.dealerName} - ${params.dealerCode}`, width / 2, 390);
  
  // Add completion text
  ctx.fillText(`has successfully completed`, width / 2, 460);

// Add assessment name
ctx.font = 'italic 28px Arial';
ctx.fillStyle = '#d4af37'; // Gold color
ctx.fillText(params.assessmentName, width / 2, 320);
  
  // Add date (left aligned)
  ctx.textAlign = 'left';
  ctx.fillText(params.date, 150, 650);
  
  // Add company name (right aligned)
  ctx.textAlign = 'right';
  ctx.fillText(params.companyName, width - 150, 650);
  
  // Convert canvas to buffer
  return canvas.toBuffer('image/png');
}

// Start server
app.listen(port, () => {
  console.log(`Certificate API server running at http://localhost:${port}`);
});