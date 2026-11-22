const nodemailer = require('nodemailer');
const u = require('../lib/util');
module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      if (!u.guard(req, res)) return;
      return res.json((await u.redis('LRANGE', 'orders', 0, 99)).map(x => JSON.parse(x)));
    }
    if (req.method !== 'POST') return res.status(405).end();
    const { customer: c = {}, items = [], payment, website } = req.body || {};
    if (website) return res.json({ ok: true, id: 'OK' }); // пастка для ботів
    const prods = await u.getProducts(), lines = [];
    for (const it of Array.isArray(items) ? items.slice(0, 50) : []) {
      const p = prods.find(x => x.id === it.id), qty = Math.min(99, Math.floor(+it.qty));
      if (p && p.inStock && qty > 0) lines.push({ name: p.name, price: p.price, qty, owner: p.owner || '' }); // ціна з сервера
    }
    const cu = { name: u.cut(c.name, 100), phone: u.cut(c.phone, 30), email: u.cut(c.email, 100), city: u.cut(c.city, 100), branch: u.cut(c.branch, 150), comment: u.cut(c.comment, 1000) };
    if (!lines.length || !cu.name || !cu.phone || !cu.city || !cu.branch) return res.status(400).json({ error: 'Заповніть усі обов’язкові поля' });
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const order = { id: Date.now().toString(36).toUpperCase(), date: new Date().toISOString(), customer: cu, payment: u.cut(payment, 60), status: '', lines, total };
    await u.redis('LPUSH', 'orders', JSON.stringify(order)); // копія в базі
    await u.redis('LTRIM', 'orders', 0, 499);
    const e = u.esc, rows = lines.map(l => `<tr><td>${e(l.name)}</td><td>${e(l.owner) || '—'}</td><td>${l.qty}</td><td>${l.price} ₴</td><td>${l.price * l.qty} ₴</td></tr>`).join('');
    try {
      const { SMTP_HOST, SMTP_PORT = 465, SMTP_USER, SMTP_PASS, ORDER_EMAIL } = process.env;
      await nodemailer.createTransport({ host: SMTP_HOST, port: +SMTP_PORT, secure: +SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } }).sendMail({
        from: SMTP_USER, to: ORDER_EMAIL, replyTo: cu.email || undefined,
        subject: `Нове замовлення №${order.id} — ${total} ₴`,
        html: `<h2>Замовлення №${order.id}</h2>
<p><b>Ім’я:</b> ${e(cu.name)}<br><b>Телефон:</b> ${e(cu.phone)}<br><b>Email:</b> ${e(cu.email) || '—'}<br>
<b>Місто:</b> ${e(cu.city)}<br><b>Відділення / адреса:</b> ${e(cu.branch)}<br><b>Оплата:</b> ${e(order.payment)}<br>
<b>Коментар:</b> ${e(cu.comment) || '—'}</p>
<table border="1" cellpadding="6" cellspacing="0"><tr><th>Товар</th><th>Чий</th><th>К-сть</th><th>Ціна</th><th>Сума</th></tr>${rows}</table>
<h3>Разом: ${total} ₴</h3>`
      });
    } catch (err) { console.error('Лист не надіслано:', err.message); }
    res.json({ ok: true, id: order.id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера. Спробуйте ще раз.' }); }
};
