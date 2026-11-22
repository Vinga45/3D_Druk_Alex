const crypto = require('crypto');
const u = require('../lib/util');
module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') { res.setHeader('Cache-Control', 'no-store'); return res.json(await u.getProducts()); }
    if (req.method === 'POST') {
      if (!u.guard(req, res)) return;
      const b = req.body || {}, p = u.clean(b);
      if (!p.name || !p.price) return res.status(400).json({ error: 'Потрібні назва і ціна' });
      const list = await u.getProducts();
      const item = { id: crypto.randomUUID(), ...p, image: u.okImg(b.image) ? b.image : '' };
      list.push(item); await u.setProducts(list);
      return res.json(item);
    }
    res.status(405).end();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Помилка сервера' }); }
};
