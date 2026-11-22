const u = require('../../lib/util');
module.exports = async (req, res) => {
  try {
    if (!u.guard(req, res)) return;
    const id = req.query.id, list = await u.getProducts(), i = list.findIndex(p => p.id === id);
    if (req.method === 'PUT') {
      if (i < 0) return res.status(404).json({ error: 'Не знайдено' });
      const b = req.body || {}, old = list[i];
      list[i] = { ...old, ...u.clean(b) };
      if (u.okImg(b.image)) { list[i].image = b.image; await u.dropImg(old.image); }
      await u.setProducts(list); return res.json(list[i]);
    }
    if (req.method === 'DELETE') {
      if (i >= 0) { const [p] = list.splice(i, 1); await u.setProducts(list); await u.dropImg(p.image); }
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Помилка сервера' }); }
};
