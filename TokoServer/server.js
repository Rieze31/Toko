const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const HF_TOKEN = process.env.HF_TOKEN || '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';
const HF_SPACE = 'yisol/IDM-VTON';

app.get('/', (req, res) => {
  res.json({ status: 'TokoServer running', engine: 'IDM-VTON via Hugging Face' });
});

app.post('/tryon', upload.fields([
  { name: 'person', maxCount: 1 },
  { name: 'clothing', maxCount: 1 },
]), async (req, res) => {
  try {
    const personFile   = req.files?.person?.[0];
    const clothingFile = req.files?.clothing?.[0];

    if (!personFile || !clothingFile) {
      return res.status(400).json({ error: 'Both person and clothing images are required' });
    }

    // Save temp files
    const tmpDir = '/tmp';
    const personPath   = path.join(tmpDir, `person_${Date.now()}.jpg`);
    const clothingPath = path.join(tmpDir, `clothing_${Date.now()}.jpg`);
    fs.writeFileSync(personPath, personFile.buffer);
    fs.writeFileSync(clothingPath, clothingFile.buffer);

    console.log('Calling Hugging Face IDM-VTON Space...');

    // Upload person image to HF
    const personBlob = new Blob([personFile.buffer], { type: 'image/jpeg' });
    const clothingBlob = new Blob([clothingFile.buffer], { type: 'image/jpeg' });

    // Use Gradio REST API directly
    const uploadRes = await fetch(`https://huggingface.co/spaces/${HF_SPACE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
      },
      body: (() => {
        const fd = new FormData();
        fd.append('files', personBlob, 'person.jpg');
        return fd;
      })(),
    });

    const uploadClothRes = await fetch(`https://huggingface.co/spaces/${HF_SPACE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
      },
      body: (() => {
        const fd = new FormData();
        fd.append('files', clothingBlob, 'clothing.jpg');
        return fd;
      })(),
    });

    if (!uploadRes.ok || !uploadClothRes.ok) {
      throw new Error('Failed to upload images to Hugging Face');
    }

    const [personPaths, clothingPaths] = await Promise.all([
      uploadRes.json(),
      uploadClothRes.json(),
    ]);

    console.log('Images uploaded, running prediction...');

    // Call the Gradio predict endpoint
    const predictRes = await fetch(`https://yisol-idm-vton.hf.space/run/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify({
        fn_index: 0,
        data: [
          { path: personPaths[0] },   // person image
          { path: clothingPaths[0] }, // clothing image
          null,                        // mask (auto)
          null,                        // cloth mask (auto)
          true,                        // use auto masking
          true,                        // use auto masking cloth
          20,                          // denoise steps
          1,                           // seed
        ],
      }),
    });

    if (!predictRes.ok) {
      const errText = await predictRes.text();
      console.error('Predict error:', errText);
      throw new Error(`Prediction failed: ${predictRes.status}`);
    }

    const result = await predictRes.json();
    console.log('Prediction done:', JSON.stringify(result).substring(0, 200));

    // Extract the output image
    const outputImage = result?.data?.[0];
    if (!outputImage) {
      throw new Error('No output image returned');
    }

    // If it's a URL, fetch and convert to base64
    let base64Image;
    if (typeof outputImage === 'string' && outputImage.startsWith('http')) {
      const imgRes = await fetch(outputImage);
      const buffer = await imgRes.arrayBuffer();
      base64Image = Buffer.from(buffer).toString('base64');
    } else if (outputImage?.path) {
      const imgRes = await fetch(`https://yisol-idm-vton.hf.space/file=${outputImage.path}`);
      const buffer = await imgRes.arrayBuffer();
      base64Image = Buffer.from(buffer).toString('base64');
    } else {
      base64Image = outputImage;
    }

    // Cleanup temp files
    fs.unlinkSync(personPath);
    fs.unlinkSync(clothingPath);

    res.json({ image: base64Image });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TokoServer running on port ${PORT}`);
});