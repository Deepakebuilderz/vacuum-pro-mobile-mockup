const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const description = 'Full product description with <script>alert(1)</script> & care instructions.\nLast line must remain visible.';
const models = Array.from({ length: 58 }, (_, index) => 'MODEL-' + (index + 1));
function renderProduct(available = true, compatibleModels = { type: 'list.single_line_text_field', value: JSON.stringify(models) }) {
  const product = {
    id: 'gid://shopify/Product/1', title: 'Hoover replacement belt', vendor: 'Hoover',
    category: { name: 'Vacuum Belts' }, mpn: { value: '160147AG' }, compatibleModels,
    description, availableForSale: available, featuredImage: { url: 'https://example.com/belt.png' },
    productType: 'Drive Belt', onlineStoreUrl: 'https://www.vacuumpro.com/products/belt',
    images: { nodes: [{ url: 'https://example.com/belt.png' }, { url: 'https://example.com/belt-back.png', altText: 'Back view' }] },
    detailFields: [null,
      { key: 'pack', type: 'multi_line_text_field', value: "'2" },
      { key: 'feature', type: 'multi_line_text_field', value: 'Rubber' },
      { key: 'why_replace_this_part', type: 'multi_line_text_field', value: 'Replace a worn drive belt to restore correct brush operation.' },
      { key: 'faq', type: 'rich_text_field', value: JSON.stringify({ type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Q: Is this a 2 pack?\nA: Yes, 2 belts.' }] }] }) },
    ],
    variants: { nodes: [{ sku: '160147AG-A6564-PK2', price: { amount: '100.00', currencyCode: 'EUR' } }] },
  };
  let html;
  const context = vm.createContext({
    catalog: [], quantities: [], current: 0, verified: true, productSource: 'results', wishlist: [],
    escapeHTML, mobileScreens: { products: new Map([[product.id, product]]) },
    partCategory: part => part.category, title: text => '<h1>' + text + '</h1>',
    money: (amount, currency = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount),
    button: (label, target) => '<button data-go="' + target + '">' + label + '</button>',
    tabIcons: { wishlist: '' }, mountScreen: content => { html = content(); },
  });
  const adapter = fs.readFileSync(__dirname + '/screens/catalog-ui.js', 'utf8');
  vm.runInContext(adapter.slice(0, adapter.indexOf('const originalMount')), context);
  const app = fs.readFileSync(__dirname + '/../app.js', 'utf8');
  vm.runInContext(app.match(/^const grid=.*$/m)[0], context);
  const page = fs.readFileSync(__dirname + '/../product.html', 'utf8');
  vm.runInContext([...page.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1], context);
  return { html, context };
}
const { html, context } = renderProduct();
assert.match(html, /About the Product/);
assert(html.includes(escapeHTML(description)), 'Show the entire escaped description, including the last line');
assert(!html.includes('<script>'), 'Do not interpret product text as HTML');
assert.match(html, /Part #160147AG/);
assert.match(html, /160147AG-A6564-PK2/);
assert.match(html, /Vacuum Belts/);
assert.match(html, /€100\.00/);
assert.match(html, /Available to order/);
assert.match(html, /Compatible models \(58\)/);
for (const model of models) assert(html.includes('>' + model + '</li>'));
assert(!html.includes('Check Oreck model'), 'Live products must not inherit prototype fitment claims');
assert.match(vm.runInContext('grid([0])', context), /€100\.00/, 'Related cards use store currency');
const missing = renderProduct(false, null).html;
assert.match(missing, /Sold out/);
assert.match(missing, /Compatible models are not listed/);
assert(!missing.includes('Compatible models ('), 'Do not invent compatibility');
for (const label of ['About the Product', 'Product Specifications', 'Package Includes', 'Why Replace This Part', 'FAQs']) assert(html.includes('<summary>' + label + '</summary>'));
assert.match(html, /2 × Hoover Drive Belt/);
assert.match(html, /Rubber/);
assert.match(html, /A: Yes, 2 belts\./);
assert.match(html, /data-go="photo-1"/);
assert.match(html, /data-go="buy-now"/);
assert.match(html, /data-go="share-product"/);
assert.match(html, /View customer reviews/);
assert.match(missing, /data-go="buy-now" disabled/);
assert.equal(vm.runInContext("metafieldText({type:'rich_text_field',value:'not json'})", context), '');

let click;
let destination;
let invalid = false;
let shared;
const input = { value: '1', checkValidity() { return Number.isInteger(Number(this.value)) && Number(this.value) >= 1 && Number(this.value) <= 99; }, reportValidity() { invalid = true; } };
const photo = {};
const prices = [{ textContent: '' }, { textContent: '' }];
const totalLabel = {};
const unitNote = {};
let inputChanged;
context.document = { addEventListener: (name, handler) => { click = handler; }, querySelectorAll: () => prices, querySelector: () => totalLabel };
context.view = { addEventListener: (name, handler) => { inputChanged = handler; }, querySelector: selector => selector === '#pdp-quantity' ? input : selector === '#pdp-unit-note' ? unitNote : selector === 'h1' ? { textContent: 'Hoover replacement belt' } : photo, querySelectorAll: () => [] };
context.qty = 0;
context.render = route => { destination = route; };
context.saveState = () => {};
context.renderTabs = () => {};
context.page = 'product';
context.mobileScreens.share = (...args) => { shared = args; };
const appSource = fs.readFileSync(__dirname + '/../app.js', 'utf8');
vm.runInContext(appSource.slice(appSource.indexOf('function updateProductTotal()'), appSource.indexOf('function paint(')), context);
vm.runInContext(appSource.slice(appSource.indexOf("document.addEventListener('click'"), appSource.indexOf("view.addEventListener('submit'")), context);
const action = go => click({ target: { closest: () => ({ dataset: { go }, setAttribute() {} }) } });
action('quantity-plus');
assert.equal(input.value, '2');
assert(prices.every(price => price.textContent === '€200.00'));
assert.equal(totalLabel.textContent, '2 items · Total');
assert.equal(unitNote.textContent, '€100.00 each × 2');
assert.equal(unitNote.hidden, false);
action('quantity-minus');
assert.equal(prices[0].textContent, '€100.00');
assert.equal(unitNote.hidden, true);
input.value = '3';
inputChanged({ target: { id: 'pdp-quantity' } });
assert.equal(prices[1].textContent, '€300.00', 'Manual quantity edits update the dock too');
input.value = '0';
inputChanged({ target: { id: 'pdp-quantity' } });
assert.equal(prices[1].textContent, '€300.00', 'Invalid input must not display a zero total');
vm.runInContext('catalog[0].price=9.99', context);
input.value = '3';
inputChanged({ target: { id: 'pdp-quantity' } });
assert.equal(prices[0].textContent, '€29.97');
vm.runInContext('catalog[0].price=100', context);
input.value = '2';
inputChanged({ target: { id: 'pdp-quantity' } });
action('add');
assert.equal(context.qty, 2);
assert.equal(destination, 'cart');
action('buy-now');
assert.equal(context.qty, 4);
assert.equal(destination, 'checkout');
input.value = '0';
action('add');
assert(invalid);
assert.equal(context.qty, 4, 'Reject invalid quantity');
action('photo-1');
assert.equal(photo.src, 'https://example.com/belt-back.png');
assert.equal(photo.alt, 'Back view');
action('share-product');
assert.equal(shared[1], 'https://www.vacuumpro.com/products/belt');
action('wishlist-0');
assert.equal(context.wishlist.length, 1);
action('wishlist-0');
assert.equal(context.wishlist.length, 0);
action('add-item-0');
assert.equal(context.qty, 5);
vm.runInContext('catalog[0].available=false', context);
input.value = '1';
action('buy-now');
action('add-item-0');
assert.equal(context.qty, 5, 'Sold-out products cannot be purchased from either action');
vm.runInContext(appSource.match(/^const money=.*$/m)[0] + '\n' + appSource.match(/^const cartCurrency=.*$/m)[0] + '\n' + appSource.match(/^const total=.*$/m)[0] + '\n' + appSource.match(/^const summary=.*$/m)[0], context);
assert.equal(vm.runInContext('cartCurrency()', context), 'EUR');
assert.match(vm.runInContext('summary()', context), /€500\.00/, 'Cart subtotal retains the Shopify currency');
console.log('PASS: website accordions, imported specs, pack, rich-text FAQs, all models, gallery, quantity, wishlist, share, cart, buy-now and sold-out guards.');
