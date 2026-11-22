const u = require('../lib/util');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !u.same((req.body || {}).password, pw)) {
    await new Promise(r => setTimeout(r, 800));
    return res.status(401).json({ error: 'Невірний пароль' });
  }
  res.json({ token: u.makeToken() });
};
