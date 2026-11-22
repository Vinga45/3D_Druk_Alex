const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => n.toLocaleString('uk-UA') + ' ₴';
let products = [], cart = JSON.parse(localStorage.getItem('cart') || '{}');
const save = () => localStorage.setItem('cart', JSON.stringify(cart));

function grid() {
  const q = $('#q').value.toLowerCase();
  const list = products.filter(p => (p.name + p.description + p.material).toLowerCase().includes(q));
  $('#grid').innerHTML = list.map(p => `<article class="card">
    ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : '<div class="ph"></div>'}
    <div class="body"><h3>${esc(p.name)}</h3>
      <p class="meta">${esc([p.material, p.size].filter(Boolean).join(', '))}</p>
      <p>${esc(p.description)}</p>
      <div class="row"><b>${fmt(p.price)}</b>${p.inStock ? `<button class="btn" data-add="${esc(p.id)}">У кошик</button>` : '<span class="meta">Немає в наявності</span>'}</div>
    </div></article>`).join('') || (products.length ? '<p>Нічого не знайдено.</p>' : '<p>Товарів поки немає.</p>');
}

function cartView() {
  const rows = Object.entries(cart).map(([id, qty]) => ({ p: products.find(x => x.id === id), qty })).filter(r => r.p && r.p.inStock);
  const total = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
  $('#count').textContent = rows.reduce((s, r) => s + r.qty, 0);
  $('#lines').innerHTML = rows.map(r => `<div class="line"><span>${esc(r.p.name)}</span>
    <span><button data-dec="${esc(r.p.id)}" aria-label="Менше">−</button> ${r.qty} <button data-inc="${esc(r.p.id)}" aria-label="Більше">+</button></span>
    <b>${fmt(r.p.price * r.qty)}</b></div>`).join('') || '<p>Кошик порожній.</p>';
  $('#total').textContent = fmt(total);
  $('#order').hidden = !rows.length;
}

const change = (id, d) => { cart[id] = (cart[id] || 0) + d; if (cart[id] <= 0) delete cart[id]; save(); cartView(); };
document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.add) { change(t.dataset.add, 1); $('#cart').classList.add('open'); }
  if (t.dataset.inc) change(t.dataset.inc, 1);
  if (t.dataset.dec) change(t.dataset.dec, -1);
});
$('#open').onclick = () => $('#cart').classList.add('open');
$('#close').onclick = () => $('#cart').classList.remove('open');
$('#q').oninput = grid;

$('#order').onsubmit = async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), btn = e.submitter;
  btn.disabled = true; $('#msg').textContent = '';
  try {
    const r = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: f, payment: f.payment, website: f.website, items: Object.entries(cart).map(([id, qty]) => ({ id, qty })) })
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    cart = {}; save(); e.target.reset(); cartView();
    $('#lines').innerHTML = `<p class="ok">Дякуємо! Замовлення №${esc(d.id)} прийнято. Ми зв’яжемось з вами.</p>`;
  } catch (err) { $('#msg').textContent = err.message || 'Не вдалося надіслати. Спробуйте ще раз.'; }
  btn.disabled = false;
};

fetch('/api/products').then(r => r.json()).then(d => { products = d; grid(); cartView(); });
