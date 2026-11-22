const { put } = require('@vercel/blob');
const u = require('../lib/util');
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!u.guard(req, res)) return;
  const type = (req.headers['content-type'] || '').split(';')[0];
  if (!TYPES[type]) return res.status(400).json({ error: 'Тільки jpg, png або webp' });
  try {
    const buf = Buffer.isBuffer(req.body) ? req.body : await u.readBody(req, 4e6);
    const blob = await put('products/img.' + TYPES[type], buf, { access: 'public', addRandomSuffix: true, contentType: type });
    res.json({ url: blob.url });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Не вдалося завантажити фото' }); }
};
