const crypto = require('crypto');
const RURL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(...cmd) {
  const r = await fetch(RURL, { method: 'POST', headers: { Authorization: 'Bearer ' + RTOK }, body: JSON.stringify(cmd) });
  const d = await r.json();
  if (!r.ok || d.error) throw Error(d.error || 'redis error');
  return d.result;
}
const getProducts = async () => JSON.parse((await redis('GET', 'products')) || '[]');
const setProducts = l => redis('SET', 'products', JSON.stringify(l));

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cut = (s, n) => String(s ?? '').trim().slice(0, n);
const clean = b => ({
  name: cut(b.name, 120), price: Math.max(0, Math.round(+b.price || 0)), description: cut(b.description, 2000),
  material: cut(b.material, 80), size: cut(b.size, 80), inStock: b.inStock === true || b.inStock === 'true'
});
const okImg = u => typeof u === 'string' && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(u);
async function dropImg(url) {
  if (!okImg(url)) return;
  try { await require('@vercel/blob').del(url); } catch (e) { console.error('del', e.message); }
}

// Вхід без сесій на сервері: токен = час закінчення + підпис паролем
const sign = exp => crypto.createHmac('sha256', process.env.ADMIN_PASSWORD || '').update(String(exp)).digest('hex');
const same = (a, b) => { const x = Buffer.from(a || ''), y = Buffer.from(b || ''); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const makeToken = () => { const exp = Date.now() + 12 * 3600e3; return exp + '.' + sign(exp); };
function guard(req, res) {
  const [exp, sig] = (req.headers.authorization || '').slice(7).split('.');
  if (process.env.ADMIN_PASSWORD && exp && sig && +exp > Date.now() && same(sig, sign(exp))) return true;
  res.status(401).json({ error: 'Увійдіть' }); return false;
}
const readBody = (req, max) => new Promise((ok, no) => {
  const c = []; let n = 0;
  req.on('data', d => { n += d.length; if (n > max) { no(Error('Файл завеликий')); req.destroy(); } else c.push(d); });
  req.on('end', () => ok(Buffer.concat(c))); req.on('error', no);
});
module.exports = { redis, getProducts, setProducts, esc, cut, clean, okImg, dropImg, same, makeToken, guard, readBody };
