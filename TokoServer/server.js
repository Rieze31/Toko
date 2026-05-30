const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const PROJECT_ID = 'tokoapp-497813';
const REGION = 'us-central1';
const MODEL = 'virtual-try-on-001';

// Load credentials from env variable (Railway) or file (local)
let auth;
if (process.env.GOOGLE_CREDENTIALS) {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
} else {
  const credentialsPath = path.join(__dirname, 'google-credentials.json');
  auth = new GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'TokoServer running', model: MODEL });
});

// Virtual Try-On endpoint
app.post('/tryon', upload.fields([
  { name: 'person', maxCount: 1 },
  { name: 'clothing', maxCount: 1 },
]), async (req, res) => {
  try {
    const personFile = req.files?.person?.[0];
    const clothingFile = req.files?.clothing?.[0];

    if (!personFile || !clothingFile) {
      return res.status(400).json({ error: 'Both person and clothing images are required' });
    }

    const personBase64   = personFile.buffer.toString('base64');
    const clothingBase64 = clothingFile.buffer.toString('base64');

    // Get access token
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    // Call Vertex AI Virtual Try-On
    const endpoint = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${MODEL}:predict`;

    const payload = {
      instances: [
        {
          person_image:  { bytesBase64Encoded: personBase64 },
          product_image: { bytesBase64Encoded: clothingBase64 },
        },
      ],
      parameters: { imageCount: 1 },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const generatedImage = data?.predictions?.[0]?.bytesBase64Encoded;

    if (!generatedImage) {
      return res.status(500).json({ error: 'No image returned from Vertex AI' });
    }

    res.json({ image: generatedImage });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TokoServer running on port ${PORT}`);
});