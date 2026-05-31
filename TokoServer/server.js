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

async function joinQueue(personPath, clothPath) {
  const res = await fetch(`${SPACE_URL}/queue/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      fn_index: 0,
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
      session_hash: Math.random().toString(36).substring(2),
    }),
  });
  if (!res.ok) throw new Error(`Queue join failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function pollResult(sessionHash, timeout = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`${SPACE_URL}/queue/status?session_hash=${sessionHash}`, {
      headers: HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {},
    });
    if (!res.ok) continue;
    const data = await res.json();
    console.log('Queue status:', data.msg, data.rank ?? '');
    if (data.msg === 'process_completed') return data.output;
    if (data.msg === 'error') throw new Error(`Queue error: ${JSON.stringify(data)}`);
  }
  throw new Error('Queue timed out');
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

    console.log('Joining queue...');
    const sessionHash = Math.random().toString(36).substring(2);

    const queueRes = await fetch(`${SPACE_URL}/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        fn_index: 0,
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
        session_hash: sessionHash,
      }),
    });

    if (!queueRes.ok) {
      throw new Error(`Queue join failed: ${queueRes.status} ${await queueRes.text()}`);
    }
    console.log('Joined queue, session:', sessionHash);

    // Poll for result
    const start = Date.now();
    let output = null;
    while (Date.now() - start < 180000) {
      await new Promise(r => setTimeout(r, 3000));
      const statusRes = await fetch(`${SPACE_URL}/queue/status?session_hash=${sessionHash}`, {
        headers: HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {},
      });
      if (!statusRes.ok) { console.log('Status check failed, retrying...'); continue; }
      const status = await statusRes.json();
      console.log('Status:', status.msg, 'rank:', status.rank ?? 'processing');
      if (status.msg === 'process_completed') { output = status.output; break; }
      if (status.msg === 'error') throw new Error(`Process error: ${JSON.stringify(status)}`);
    }

    if (!output) throw new Error('Timed out waiting for result');

    const outputImage = output?.data?.[0];
    if (!outputImage) throw new Error('No image in output');

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