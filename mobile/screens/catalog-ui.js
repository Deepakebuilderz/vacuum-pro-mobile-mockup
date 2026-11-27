// This adapter runs only in the packaged HTML screens, alongside the prototype.
const liveIndexes = new Map();
function modelEntries(field) {
  if (!field) return [];
  if (field.type.includes('reference')) {
    return [field.reference, ...(field.references?.nodes || [])].map(entry => entry?.modelNumber?.value).filter(Boolean);
  }
  if (field.type === 'list.single_line_text_field') {
    try { return JSON.parse(field.value); } catch { return []; }
  }
  return field.type === 'single_line_text_field' ? field.value.split(/[,;\n]/) : [];
}

function finderMatch(product, input) {
  const term = input.trim().toLowerCase();
  if (!term) return '';
  const brand = (product.vendor || '').trim().toLowerCase();
  const identifier = text => {
    const value = text.trim().toLowerCase();
    return brand && value.startsWith(brand + ' ') ? value.slice(brand.length + 1).trim() : value;
  };
  const model = identifier(term);
  if (modelEntries(product.compatibleModels).some(entry => identifier(entry) === model)) return 'Model match';
  const tags = (product.tags || []).map(tag => tag.toLowerCase());
  const identifiers = [product.mpn?.value, product.variants.nodes[0]?.sku,
    ...tags.filter(tag => tag.startsWith('part-')).map(tag => tag.slice(5))];
  if (identifiers.some(id => id && id.trim().toLowerCase() === term)) return 'Part number match';
  const series = tags.filter(tag => tag.startsWith('model-')).map(tag => tag.slice(6));
  for (const match of (product.description || '').matchAll(/\bseries\s+([a-z0-9-]*\d[a-z0-9-]*(?:\s*(?:,|and|&)\s*[a-z0-9-]*\d[a-z0-9-]*)*)/gi)) {
    series.push(...match[1].toLowerCase().split(/\s*(?:,|and|&)\s*/));
  }
  if (series.some(code => code === model || (/^\d{3,}$/.test(code) &&
      model.startsWith(code) && /^[a-z]$/.test(model.slice(code.length))))) return 'Series match - check fit';
  const keywords = [product.title, product.vendor, product.category?.name, ...identifiers, ...tags].join(' ').toLowerCase();
  return term.split(/\s+/).every(word => keywords.includes(word)) ? 'Catalog match' : '';
}
function syncParts(items) {
  for (const product of items) {
    const variant = product.variants.nodes[0];
    const part = {
      id: product.id, name: escapeHTML(product.title), brand: escapeHTML(product.vendor),
      category: escapeHTML(product.category?.name || 'Uncategorized'),
      sku: escapeHTML(variant?.sku || '—'), pack: '',
      img: /^https:\/\//i.test(product.featuredImage?.url || '') ? escapeHTML(product.featuredImage.url) : '',
      price: Number(variant?.price.amount || 0), available: product.availableForSale,
      displayPrice: variant ? new Intl.NumberFormat(undefined, {
        style: 'currency', currency: variant.price.currencyCode,
      }).format(Number(variant.price.amount)) : '',
    };
    if (!liveIndexes.has(part.id)) {
      liveIndexes.set(part.id, catalog.length);
      quantities.push(0);
      catalog.push(part);
    } else {
      catalog[liveIndexes.get(part.id)] = part;
    }
  }
}
syncParts(mobileScreens.products.values());

function liveGrid(items, search = '') {
  return '<div class="product-grid">' + items.map(product => {
    const index = liveIndexes.get(product.id);
    const part = catalog[index];
    return '<button type="button" data-go="item-' + index + '">' +
      (part.img ? '<img src="' + part.img + '" alt="" loading="lazy">' : '<span aria-hidden="true"></span>') +
      '<small>' + part.brand + (part.sku === '—' ? '' : ' · #' + part.sku) + '</small><strong>' +
      part.name + '</strong>' + (search ? '<small>' + finderMatch(product, search) + '</small>' : '') + '<span>' + escapeHTML(part.displayPrice) + (part.available ? '' : ' · Sold out') + '</span></button>';
  }).join('') + '</div>';
}

const originalMount = mountScreen;
mountScreen = function mountMobileScreen(content) {
  if (page === 'browse') {
    originalMount(() => title('Shop vacuum parts') +
      '<div class="actions"><label>Collection<select id="collection"><option value="">All collections</option></select></label>' +
      '<label>Category<select id="category"><option value="">All categories</option></select></label></div>' +
      '<div id="mobile-products" class="home-shop"></div>' + actions(['Find by model or part number','find']));
  } else if (page === 'results') {
    originalMount(() => title('Search results') + '<p class="quiet">Results for <strong>' + escapeHTML(query) +
      '</strong></p><div id="mobile-products" class="home-shop"></div>' + actions(['Search again','find'],['Get help','support']));
  } else {
    originalMount(content);
  }
  if (page === 'product' && catalog[current]?.id) {
    const part = catalog[current];
    document.querySelector('#purchase-dock strong').textContent = part.displayPrice;
    const product = mobileScreens.products.get(part.id);
    if (product && productSource === 'results') {
      const match = finderMatch(product, query);
      if (match === 'Model match') view.querySelector('.pdp-fit h2').textContent = 'Fits ' + query.toUpperCase();
      if (match.startsWith('Series match')) view.querySelector('.pdp-fit p').textContent = 'Series match only. Confirm the full model number before ordering.';
    }
    if (!part.available) {
      const add = document.querySelector('#purchase-dock button');
      add.disabled = true;
      add.textContent = 'Sold out';
    }
  }
  if (!['home','browse','find','results'].includes(page)) return;
  if (page === 'home' || page === 'find') {
    const gridElement = view.querySelector('.product-grid');
    const slot = document.createElement('div');
    slot.id = 'mobile-products';
    gridElement.replaceWith(slot);
  }
  startCatalog();
};

function startCatalog() {
  const slot = view.querySelector('#mobile-products');
  const collection = view.querySelector('#collection');
  const category = view.querySelector('#category');
  let list = [];
  let limit = 36;
  let generation = 0;
  let categoryId = mobileScreens.category || '';
  function draw(loading, error) {
    let rows = list;
    if (category) {
      const groups = new Map([['', 'All categories']]);
      for (const p of rows) groups.set(p.category?.id || 'none', p.category?.name || 'Uncategorized');
      category.replaceChildren(...Array.from(groups, ([id, name]) => new Option(name, id)));
      category.value = categoryId;
      if (categoryId) rows = rows.filter(p => (p.category?.id || 'none') === categoryId);
    }
    if (page === 'results') {
      const priority = ['Part number match', 'Model match', 'Series match - check fit', 'Catalog match'];
      const groups = new Map(priority.map(label => [label, []]));
      for (const product of rows) groups.get(finderMatch(product, query))?.push(product);
      rows = priority.flatMap(label => groups.get(label));
    }
    const max = page === 'home' || page === 'find' ? 6 : limit;
    const shown = rows.slice(0, max);
    let html = '';
    if (page === 'browse') {
      const sections = new Map();
      for (const p of shown) {
        const id = p.category?.id || 'none';
        if (!sections.has(id)) sections.set(id, []);
        sections.get(id).push(p);
      }
      for (const products of sections.values()) html += '<section class="home-shop"><h2>' +
        escapeHTML(products[0].category?.name || 'Uncategorized') + '</h2>' + liveGrid(products) + '</section>';
    } else if (shown.length) {
      html += liveGrid(shown, page === 'results' ? query : '');
    }
    if (!rows.length && !loading && !error) html += '<p class="quiet">' +
      (page === 'results' ? 'No matching parts.' : 'No products available here.') + '</p>';
    if (loading) html += '<p class="quiet" role="status">Loading products…</p>';
    if (error) html += '<p class="quiet" role="alert">' + escapeHTML(error) + '</p>';
    if (rows.length > max && max === limit) html += '<button class="secondary" data-more>Show more products</button>';
    if (error || (['browse', 'results'].includes(page) && !loading)) html += '<button class="secondary" data-refresh>' +
      (error ? 'Try again' : 'Refresh products') + '</button>';
    slot.innerHTML = html;
    if (page === 'home' && rows.length) {
      const brands = [...new Set(rows.map(p => p.vendor).filter(Boolean))].slice(0,3);
      if (brands.length) view.querySelector('.home-brands').innerHTML = brands.map(b => '<span>' + escapeHTML(b) + '</span>').join('');
    }
  }
  let pending = false;
  let failure = '';
  async function load() {
    const serial = ++generation;
    list = []; pending = true; failure = ''; limit = 36;
    draw(true);
    const id = collection && mobileScreens.collection;
    try {
      for await (const rows of mobileScreens.catalog(id ? 'collectionProducts' : 'products', id)) {
        if (serial !== generation || !slot.isConnected || parent.document.querySelector('iframe').contentDocument !== document) return;
        list = rows;
        syncParts(mobileScreens.products.values());
        draw(true);
      }
    } catch (err) {
      if (serial === generation) failure = err.message;
    }
    if (serial === generation) { pending = false; draw(false, failure); }
  }
  async function loadCollections() {
    try {
      for await (const rows of mobileScreens.catalog('collections')) {
        collection.replaceChildren(new Option('All collections', ''), ...rows.map(c => new Option(c.title, c.id)));
        collection.value = mobileScreens.collection || '';
      }
    } catch {
      collection.insertAdjacentElement('afterend', Object.assign(document.createElement('button'), {
        type: 'button', className: 'secondary', textContent: 'Retry collections',
        onclick(event) { event.currentTarget.remove(); loadCollections(); },
      }));
    }
  }
  if (collection) {
    for (const select of [collection, category]) {
      select.style.cssText = 'display:block;width:100%;min-height:44px;margin-top:4px;padding:8px 10px;border:1px solid var(--rule);border-radius:9px;background:#fff;color:var(--navy);font:inherit';
    }
    collection.onchange = () => { mobileScreens.collection = collection.value; categoryId = mobileScreens.category = ''; load(); };
    category.onchange = () => { categoryId = mobileScreens.category = category.value; limit = 36; draw(pending, failure); };
    loadCollections();
  }
  slot.onclick = event => {
    if (event.target.closest('[data-more]')) { limit += 36; draw(pending, failure); }
    if (event.target.closest('[data-refresh]')) { mobileScreens.invalidate(); if (collection) loadCollections(); load(); }
  };
  load();
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (link) { event.preventDefault(); mobileScreens.link(link.href); }
}, true);
