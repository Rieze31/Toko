const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const HF_TOKEN = process.env.HF_TOKEN;
const SPACE_URL = 'https://yisol-idm-vton.hf.space';

app.get('/', (req, res) => {
  res.json({ status: 'TokoServer running', engine: 'IDM-VTON' });
});

async function uploadImage(buffer, filename) {
  const form = new FormData();
  form.append('files', new Blob([buffer], { type: 'image/jpeg' }), filename);
  const res = await fetch(`${SPACE_URL}/upload`, {
    method: 'POST',
    headers: HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  const paths = await res.json();
  return paths[0];
}

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

    console.log('Uploading images...');
    const [personPath, clothPath] = await Promise.all([
      uploadImage(personFile.buffer, 'person.jpg'),
      uploadImage(clothingFile.buffer, 'clothing.jpg'),
    ]);
    console.log('Uploaded:', personPath, clothPath);

    // First try fn_index 0, then 1 if it fails
    for (const fn_index of [0, 1, 2]) {
      console.log(`Trying fn_index ${fn_index}...`);
      const predictRes = await fetch(`${SPACE_URL}/run/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          fn_index,
          data: [
            { path: personPath },
            { path: clothPath },
            null,
            null,
            true,
            true,
            20,
            1,
          ],
        }),
      });

      const text = await predictRes.text();
      console.log(`fn_index ${fn_index} status:`, predictRes.status, text.substring(0, 200));

      if (!predictRes.ok) continue;

      const result = JSON.parse(text);
      const outputImage = result?.data?.[0];
      if (!outputImage) continue;

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

      return res.json({ image: base64Image });
    }

    throw new Error('All fn_index attempts failed');

  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`TokoServer running on port ${PORT}`));