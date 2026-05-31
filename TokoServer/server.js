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

app.get('/', (req, res) => {
  res.json({ status: 'TokoServer running', engine: 'IDM-VTON via Hugging Face' });
});

app.post('/tryon', upload.fields([
  { name: 'person', maxCount: 1 },
  { name: 'clothing', maxCount: 1 },
]), async (req, res) => {
  try {
    const personFile = req.files?.person?.[0];
    const clothingFile = req.files?.clothing?.[0];
    if (!personFile || !clothingFile) {
      return res.status(400).json({ error: 'Both images required' });
    }
    const personBlob = new Blob([personFile.buffer], { type: 'image/jpeg' });
    const clothingBlob = new Blob([clothingFile.buffer], { type: 'image/jpeg' });
    const uploadPerson = await fetch('https://yisol-idm-vton.hf.space/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${HF_TOKEN}` }, body: (() => { const fd = new FormData(); fd.append('files', personBlob, 'person.jpg'); return fd; })() });
    const uploadCloth = await fetch('https://yisol-idm-vton.hf.space/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${HF_TOKEN}` }, body: (() => { const fd = new FormData(); fd.append('files', clothingBlob, 'clothing.jpg'); return fd; })() });
    if (!uploadPerson.ok || !uploadCloth.ok) throw new Error('Upload failed');
    const [pPaths, cPaths] = await Promise.all([uploadPerson.json(), uploadCloth.json()]);
    const predictRes = await fetch('https://yisol-idm-vton.hf.space/run/predict', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${HF_TOKEN}` }, body: JSON.stringify({ fn_index: 0, data: [{ path: pPaths[0] }, { path: cPaths[0] }, null, null, true, true, 20, 1] }) });
    if (!predictRes.ok) throw new Error(`Predict failed: ${predictRes.status}`);
    const result = await predictRes.json();
    const outputImage = result?.data?.[0];
    if (!outputImage) throw new Error('No output image');
    let base64Image;
    if (outputImage?.path) {
      const imgRes = await fetch(`https://yisol-idm-vton.hf.space/file=${outputImage.path}`);
      base64Image = Buffer.from(await imgRes.arrayBuffer()).toString('base64');
    } else {
      base64Image = outputImage;
    }
    res.json({ image: base64Image });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TokoServer running on port ${PORT}`));
