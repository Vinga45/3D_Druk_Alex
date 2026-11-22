const u = require('../../lib/util');
const STATUSES = ['Взято', 'Виконую', 'Готово', ''];
module.exports = async (req, res) => {
  try {
    if (!u.guard(req, res)) return;
    const raw = await u.redis('LRANGE', 'orders', 0, -1);
    const old = raw.find(x => { try { return JSON.parse(x).id === req.query.id; } catch { return false; } });
    if (!old) return res.status(404).json({ error: 'Замовлення не знайдено' });
    if (req.method === 'PATCH') {
      const status = (req.body || {}).status;
      if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Невірний статус' });
      const order = { ...JSON.parse(old), status };
      // заміна за значенням (а не за номером), щоб новий заказ не зсунув список
      await u.redis('LINSERT', 'orders', 'BEFORE', old, JSON.stringify(order));
      await u.redis('LREM', 'orders', 1, old);
      return res.json(order);
    }
    if (req.method === 'DELETE') { await u.redis('LREM', 'orders', 1, old); return res.json({ ok: true }); }
    res.status(405).end();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Помилка сервера' }); }
};
