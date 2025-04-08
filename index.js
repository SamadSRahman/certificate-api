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

// Original API endpoint with two response format options
app.post('/api/generate-certificate', authenticateToken, async (req, res) => {
  try {
    // Extract parameters from request body
    const {
      recipientName,
      courseName,
      completionDate,
      certificateId,
      issuerName = "Certificate Authority",
      customMessage = "",
      format = "png" // Default format is PNG, but can be "html" for SSR
    } = req.body;
    
    // Validate required parameters
    if (!recipientName || !courseName || !completionDate || !certificateId) {
      return res.status(400).json({ 
        error: "Missing required parameters. Please provide recipientName, courseName, completionDate, and certificateId." 
      });
    }
    
    // Generate certificate image
    const certificateBuffer = await generateCertificate({
      recipientName,
      courseName,
      completionDate,
      certificateId,
      issuerName,
      customMessage
    });
    
    // If HTML format is requested, render the SSR view
    if (format.toLowerCase() === 'html') {
      // Convert buffer to base64 for embedding in HTML
      const certificateBase64 = `data:image/png;base64,${certificateBuffer.toString('base64')}`;
      
      // Render the certificate view with the image and data
      return res.render('certificate-view', {
        certificateImage: certificateBase64,
        data: {
          recipientName,
          courseName,
          completionDate,
          certificateId,
          issuerName,
          customMessage
        }
      });
    }
    
    // Default: Return the PNG image
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="certificate-${certificateId}.png"`
    });
    
    res.send(certificateBuffer);
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// Certificate generation function (unchanged)
async function generateCertificate(params) {
  // Create canvas for certificate (landscape orientation)
  const width = 1200;
  const height = 900;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Draw certificate background
  ctx.fillStyle = '#f5f5f5';
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
  
  // Add recipient name
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#d4af37'; // Gold color
  ctx.fillText(params.recipientName, width / 2, 320);
  
  // Add course completion text
  ctx.font = '28px Arial';
  ctx.fillStyle = '#000000';
  ctx.fillText('has successfully completed the course', width / 2, 390);
  
  // Add course name
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#d4af37'; // Gold color
  ctx.fillText(params.courseName, width / 2, 460);
  
  // Add completion date
  ctx.font = '28px Arial';
  ctx.fillStyle = '#000000';
  ctx.fillText(`Completed on: ${params.completionDate}`, width / 2, 530);
  
  // Add custom message if provided
  if (params.customMessage) {
    ctx.font = 'italic 24px Arial';
    ctx.fillText(`"${params.customMessage}"`, width / 2, 600);
  }
  
  // Add certificate ID
  ctx.font = '20px Arial';
  ctx.fillText(`Certificate ID: ${params.certificateId}`, width / 2, 680);
  
  // Add issuer name
  ctx.font = 'bold 32px Arial';
  ctx.fillText(params.issuerName, width / 2, 750);
  
  // Convert canvas to buffer
  return canvas.toBuffer('image/png');
}

// Start server
app.listen(port, () => {
  console.log(`Certificate API with SSR server running at http://localhost:${port}`);
});