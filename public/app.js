const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const I = {
  uk: {
    title: 'Шар — 3D-друк і вироби', cart: 'Кошик', close: 'Закрити', total: 'Разом',
    h1: 'Речі, надруковані на 3D-принтері',
    lead: 'Органайзери, декор і корисні дрібниці. Кожен виріб друкується на замовлення шар за шаром.',
    catalog: 'Каталог', search: 'Пошук товару', foot: 'Доставка Новою поштою по Україні.',
    fName: 'Ім’я', fPhone: 'Телефон', fEmail: 'Email', fCity: 'Місто', fBranch: 'Відділення Нової пошти або адреса',
    fPay: 'Оплата', pay1: 'Накладений платіж', pay2: 'Переказ на картку', fComment: 'Коментар', submit: 'Оформити замовлення',
    empty: 'Кошик порожній.', none: 'Нічого не знайдено.', noItems: 'Товарів поки немає.',
    add: 'У кошик', out: 'Немає в наявності', inStock: 'В наявності', more: 'Детальніше',
    material: 'Матеріал', size: 'Розмір', status: 'Наявність', less: 'Менше', plus: 'Більше',
    thanks: id => `Дякуємо! Замовлення №${id} прийнято. Ми зв’яжемось з вами.`,
    errFill: 'Заповніть усі обов’язкові поля.', errGen: 'Не вдалося надіслати. Спробуйте ще раз.'
  },
  en: {
    title: 'Shar — 3D-printed goods', cart: 'Cart', close: 'Close', total: 'Total',
    h1: 'Things printed on a 3D printer',
    lead: 'Organizers, decor and useful little things. Every item is printed to order, layer by layer.',
    catalog: 'Catalog', search: 'Search products', foot: 'Delivery across Ukraine by Nova Poshta.',
    fName: 'Name', fPhone: 'Phone', fEmail: 'Email', fCity: 'City', fBranch: 'Nova Poshta branch or address',
    fPay: 'Payment', pay1: 'Cash on delivery', pay2: 'Card transfer', fComment: 'Comment', submit: 'Place order',
    empty: 'Your cart is empty.', none: 'Nothing found.', noItems: 'No products yet.',
    add: 'Add to cart', out: 'Out of stock', inStock: 'In stock', more: 'Details',
    material: 'Material', size: 'Size', status: 'Availability', less: 'Decrease', plus: 'Increase',
    thanks: id => `Thank you! Order #${id} has been received. We will contact you.`,
    errFill: 'Please fill in all required fields.', errGen: 'Could not send the order. Please try again.'
  }
};
let lang = localStorage.getItem('lang') === 'en' ? 'en' : 'uk';
let products = [], ready = false, openId = null, done = null;
let cart = JSON.parse(localStorage.getItem('cart') || '{}');
const t = k => I[lang][k];
const fmt = n => n.toLocaleString(lang === 'en' ? 'en-US' : 'uk-UA') + ' ₴';
const save = () => localStorage.setItem('cart', JSON.stringify(cart));
const pic = p => p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : '<div class="ph"></div>';

function grid() {
  if (!ready) return;
  const q = $('#q').value.toLowerCase();
  const list = products.filter(p => (p.name + p.description + p.material).toLowerCase().includes(q));
  $('#grid').innerHTML = list.map(p => `<article class="card">
    <div class="thumb" data-open="${esc(p.id)}">${pic(p)}</div>
    <div class="body"><h3><button class="lnk" data-open="${esc(p.id)}">${esc(p.name)}</button></h3>
      <p class="meta">${esc([p.material, p.size].filter(Boolean).join(', '))}</p>
      <p class="d">${esc(p.description)}</p>
      <button class="more" data-open="${esc(p.id)}">${t('more')}</button>
      <div class="row"><b>${fmt(p.price)}</b>${p.inStock ? `<button class="btn" data-add="${esc(p.id)}">${t('add')}</button>` : `<span class="meta">${t('out')}</span>`}</div>
    </div></article>`).join('') || `<p>${products.length ? t('none') : t('noItems')}</p>`;
}

function showModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  openId = id;
  $('#pbody').innerHTML = `<div class="pm">${pic(p)}<div class="pinfo">
    <h2>${esc(p.name)}</h2><p class="price">${fmt(p.price)}</p>
    <dl>${p.material ? `<dt>${t('material')}</dt><dd>${esc(p.material)}</dd>` : ''}${p.size ? `<dt>${t('size')}</dt><dd>${esc(p.size)}</dd>` : ''}
      <dt>${t('status')}</dt><dd>${p.inStock ? t('inStock') : t('out')}</dd></dl>
    <div class="desc">${esc(p.description)}</div>
    ${p.inStock ? `<button class="btn" data-add="${esc(p.id)}">${t('add')}</button>` : ''}
  </div></div>`;
  if (!$('#pm').open) $('#pm').showModal();
}

function cartView() {
  const rows = Object.entries(cart).map(([id, qty]) => ({ p: products.find(x => x.id === id), qty })).filter(r => r.p && r.p.inStock);
  const total = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
  $('#count').textContent = rows.reduce((s, r) => s + r.qty, 0);
  $('#lines').innerHTML = rows.map(r => `<div class="line"><span>${esc(r.p.name)}</span>
    <span><button data-dec="${esc(r.p.id)}" aria-label="${t('less')}">−</button> ${r.qty} <button data-inc="${esc(r.p.id)}" aria-label="${t('plus')}">+</button></span>
    <b>${fmt(r.p.price * r.qty)}</b></div>`).join('') || (done ? `<p class="ok">${t('thanks')(done)}</p>` : `<p>${t('empty')}</p>`);
  $('#total').textContent = fmt(total);
  $('#order').hidden = !rows.length;
}

function applyLang() {
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(e => e.textContent = t(e.dataset.i18n));
  document.querySelectorAll('[data-ph]').forEach(e => { e.placeholder = t(e.dataset.ph); e.setAttribute('aria-label', t(e.dataset.ph)); });
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  grid(); cartView();
  if (openId) showModal(openId);
}

const change = (id, d) => { cart[id] = (cart[id] || 0) + d; if (cart[id] <= 0) delete cart[id]; save(); cartView(); };
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o) return showModal(o.dataset.open);
  const a = e.target.closest('[data-add]');
  if (a) { done = null; if ($('#pm').open) $('#pm').close(); change(a.dataset.add, 1); return $('#cart').classList.add('open'); }
  const i = e.target.closest('[data-inc]'); if (i) change(i.dataset.inc, 1);
  const d = e.target.closest('[data-dec]'); if (d) change(d.dataset.dec, -1);
  const l = e.target.closest('[data-lang]');
  if (l) { lang = l.dataset.lang; localStorage.setItem('lang', lang); applyLang(); }
});
$('#pm').addEventListener('close', () => { openId = null; });
$('#pm').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
$('#pclose').onclick = () => $('#pm').close();
$('#open').onclick = () => $('#cart').classList.add('open');
$('#close').onclick = () => $('#cart').classList.remove('open');
$('#q').oninput = grid;

$('#order').onsubmit = async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), btn = e.submitter || e.target.querySelector('button');
  btn.disabled = true; $('#msg').textContent = '';
  try {
    const r = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: f, payment: f.payment, website: f.website, items: Object.entries(cart).map(([id, qty]) => ({ id, qty })) })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) $('#msg').textContent = r.status === 400 ? t('errFill') : t('errGen');
    else { done = d.id; cart = {}; save(); e.target.reset(); cartView(); }
  } catch { $('#msg').textContent = t('errGen'); }
  btn.disabled = false;
};

applyLang();
fetch('/api/products').then(r => r.json()).then(d => { products = Array.isArray(d) ? d : []; })
  .catch(() => { products = []; }).finally(() => { ready = true; applyLang(); });
