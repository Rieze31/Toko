const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const HF_TOKEN = process.env.HF_TOKEN;
// Gradio Space URL - the subdomain is username-spacename (dashes, lowercase)
const SPACE_URL = 'https://yisol-idm-vton.hf.space';

app.get('/', (req, res) => {
  res.json({ status: 'TokoServer running', engine: 'IDM-VTON' });
});

app.post('/tryon', upload.fields([
  { name: 'person', maxCount: 1 },
  { name: 'clothing', maxCount: 1 },
]), async (req, res) => {
  try {
    const personFile   = req.files?.person?.[0];
    const clothingFile = req.files?.clothing?.[0];

    if (!personFile || !clothingFile) {
      return res.status(400).json({ error: 'Both images required' });
    }

    console.log('Uploading images to HF Space...');

    // Upload person image
    const personForm = new FormData();
    personForm.append('files', new Blob([personFile.buffer], { type: 'image/jpeg' }), 'person.jpg');
    const personUpload = await fetch(`${SPACE_URL}/upload`, {
      method: 'POST',
      headers: HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {},
      body: personForm,
    });

    if (!personUpload.ok) {
      const t = await personUpload.text();
      console.error('Person upload failed:', personUpload.status, t);
      throw new Error(`Person upload failed: ${personUpload.status}`);
    }
    const personPaths = await personUpload.json();
    console.log('Person uploaded:', personPaths);

    // Upload clothing image
    const clothForm = new FormData();
    clothForm.append('files', new Blob([clothingFile.buffer], { type: 'image/jpeg' }), 'clothing.jpg');
    const clothUpload = await fetch(`${SPACE_URL}/upload`, {
      method: 'POST',
      headers: HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {},
      body: clothForm,
    });

    if (!clothUpload.ok) {
      const t = await clothUpload.text();
      console.error('Cloth upload failed:', clothUpload.status, t);
      throw new Error(`Cloth upload failed: ${clothUpload.status}`);
    }
    const clothPaths = await clothUpload.json();
    console.log('Clothing uploaded:', clothPaths);

    console.log('Running prediction...');

    // Run prediction
    const predictRes = await fetch(`${SPACE_URL}/run/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        fn_index: 0,
        data: [
          { path: personPaths[0] },
          { path: clothPaths[0] },
          null,
          null,
          true,
          true,
          20,
          1,
        ],
      }),
    });

    if (!predictRes.ok) {
      const t = await predictRes.text();
      console.error('Predict failed:', predictRes.status, t);
      throw new Error(`Prediction failed: ${predictRes.status} - ${t.substring(0, 200)}`);
    }

    const result = await predictRes.json();
    console.log('Result keys:', Object.keys(result));

    const outputImage = result?.data?.[0];
    if (!outputImage) {
      console.error('Full result:', JSON.stringify(result).substring(0, 500));
      throw new Error('No output image in response');
    }

    // Convert to base64
    let base64Image;
    if (outputImage?.path) {
      const imgRes = await fetch(`${SPACE_URL}/file=${outputImage.path}`);
      base64Image = Buffer.from(await imgRes.arrayBuffer()).toString('base64');
    } else if (typeof outputImage === 'string' && outputImage.startsWith('data:')) {
      base64Image = outputImage.split(',')[1];
    } else if (typeof outputImage === 'string' && outputImage.startsWith('http')) {
      const imgRes = await fetch(outputImage);
      base64Image = Buffer.from(await imgRes.arrayBuffer()).toString('base64');
    } else {
      base64Image = outputImage;
    }

    res.json({ image: base64Image });

  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`TokoServer running on port ${PORT}`));