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
function metafieldText(field) {
  if (!field?.value) return '';
  if (field.type !== 'rich_text_field') return field.value.trim();
  try {
    const text = node => node.type === 'text' ? node.value :
      (node.children || []).map(text).join('') + (['paragraph', 'list-item', 'heading'].includes(node.type) ? '\n\n' : '');
    return text(JSON.parse(field.value)).trim();
  } catch { return ''; }
}
function syncParts(items) {
  for (const product of items) {
    const variant = product.variants.nodes[0];
    const details = Object.fromEntries((product.detailFields || []).filter(Boolean).map(field => {
      const value = metafieldText(field);
      return [field.key, escapeHTML(field.key === 'pack' ? value.replace(/^'/, '').trim() : value)];
    }));
    const packOption = variant?.selectedOptions?.find(option => /pack/i.test(option.name));
    const selectedPack = packOption?.value.match(/^(?:pack of\s*)?(\d+)$/i)?.[1];
    if (selectedPack) details.pack = selectedPack;
    if (!details.why_replace_this_part) {
      const reason = (product.description || '').match(/(?:^|[.!?]\s+)((?:Routine replacement|Replacing\b|Designed to provide)[^.!?]+[.!?]?)/i)?.[1];
      if (reason) details.why_replace_this_part = escapeHTML(reason);
    }
    if (!details.package_includes && /^\d+$/.test(details.pack || '') && product.productType) {
      details.package_includes = details.pack + ' × ' + escapeHTML([product.vendor, product.productType].filter(Boolean).join(' '));
    }
    const images = (product.images?.nodes || []).filter(image => /^https:\/\//i.test(image.url));
    const part = {
      id: product.id, name: escapeHTML(product.title), brand: escapeHTML(product.vendor),
      category: escapeHTML(product.category?.name || 'Uncategorized'),
      sku: escapeHTML(variant?.sku || '—'), pack: '',
      mpn: escapeHTML(product.mpn?.value || ''),
      description: escapeHTML(product.description || ''),
      models: modelEntries(product.compatibleModels).map(escapeHTML),
      type: escapeHTML(product.productType || ''), details, images,
      url: /^https:\/\//i.test(product.onlineStoreUrl || '') ? product.onlineStoreUrl : '',
      img: /^https:\/\//i.test(product.featuredImage?.url || '') ? escapeHTML(product.featuredImage.url) : images[0] ? escapeHTML(images[0].url) : '',
      price: Number(variant?.price.amount || 0), available: product.availableForSale,
      currencyCode: variant?.price.currencyCode || 'USD',
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
    updateProductTotal();
    const product = mobileScreens.products.get(part.id);
    if (product && ['results', 'find'].includes(productSource)) {
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
  const stage = view.closest('.stage');
  const refreshStatus = document.createElement('div');
  refreshStatus.className = 'catalog-refresh';
  refreshStatus.setAttribute('role', 'status');
  refreshStatus.setAttribute('aria-live', 'polite');
  stage.before(refreshStatus);
  let list = [];
  let limit = 36;
  let generation = 0;
  let categoryId = mobileScreens.category || '';
  let finderSearching = false;
  function draw(loading, error) {
    let rows = list;
    if (page === 'find') {
      view.querySelector('#finder-results').hidden = !finderSearching;
      if (!finderSearching) { slot.innerHTML = ''; return; }
    }
    const searching = page === 'results' || finderSearching;
    const finderTitle = view.querySelector('#finder-results-title');
    if (finderTitle) finderTitle.textContent = 'Searching products…';
    if (category) {
      const groups = new Map([['', 'All categories']]);
      for (const p of rows) groups.set(p.category?.id || 'none', p.category?.name || 'Uncategorized');
      category.replaceChildren(...Array.from(groups, ([id, name]) => new Option(name, id)));
      category.value = categoryId;
      if (categoryId) rows = rows.filter(p => (p.category?.id || 'none') === categoryId);
    }
    if (searching) {
      const priority = ['Part number match', 'Model match', 'Series match - check fit', 'Catalog match'];
      const groups = new Map(priority.map(label => [label, []]));
      for (const product of rows) groups.get(finderMatch(product, query))?.push(product);
      rows = priority.flatMap(label => groups.get(label));
    }
    const max = page === 'home' || (page === 'find' && !searching) ? 6 : limit;
    const shown = rows.slice(0, max);
    if (finderTitle) finderTitle.textContent = error && !rows.length ? 'Could not check products' : loading && !rows.length ? 'Searching products…' : rows.length ? 'Product found' : 'Product not found';
    let html = '';
    if (page === 'find' && query) html += '<p class="quiet">Results for <strong>' + escapeHTML(query) + '</strong></p>';
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
      html += liveGrid(shown, searching ? query : '');
    }
    if (!rows.length && !loading && !error) html += '<p class="quiet">' +
      (searching ? 'No matching parts in our current catalog. Check the number or contact us for fitment help.' : 'No products available here.') + '</p>';
    if (page === 'find' && !loading && !error) {
      const matches = new Set(rows.map(product => product.id));
      const available = list.filter(product => !matches.has(product.id) && /vacuum|filter|belt|bag|brush|harness/i.test(product.title));
      const related = available.filter(product => rows.some(match => (match.vendor && product.vendor === match.vendor) || (match.productType && product.productType === match.productType)));
      const suggestions = [...related, ...available.filter(product => !related.includes(product))].slice(0,4);
      if (suggestions.length) html += '<h3>Suggested parts</h3><p class="quiet">Other parts to explore. Confirm your model before ordering.</p>' + liveGrid(suggestions);
    }
    if (loading && !rows.length) html += '<p class="quiet" role="status">Loading products…</p>';
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
  async function load(refresh = false) {
    const serial = ++generation;
    if (!refresh) list = [];
    pending = true; failure = ''; limit = 36;
    if (!refresh || !list.length) draw(true);
    const id = collection && mobileScreens.collection;
    try {
      for await (const rows of mobileScreens.catalog(id ? 'collectionProducts' : 'products', id)) {
        if (serial !== generation || !slot.isConnected || parent.document.querySelector('iframe').contentDocument !== document) return;
        list = rows;
        syncParts(mobileScreens.products.values());
        if (!refresh) draw(true);
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
  function positionRefresh(distance, dragging = false) {
    stage.classList.toggle('catalog-pulling', dragging);
    view.style.setProperty('--refresh-offset', distance + 'px');
    refreshStatus.style.setProperty('--pull', distance + 'px');
    refreshStatus.style.setProperty('--turn', Math.min(distance / 45, 1) * 180 + 'deg');
  }
  async function refresh() {
    if (pending || refreshStatus.classList.contains('refreshing')) return;
    const started = Date.now();
    positionRefresh(54);
    refreshStatus.textContent = 'Refreshing products…';
    refreshStatus.classList.add('visible');
    refreshStatus.classList.add('refreshing');
    mobileScreens.invalidate();
    try {
      await Promise.all([load(true), collection ? loadCollections() : Promise.resolve()]);
    } finally {
      // Let fast responses finish the spinner's entrance instead of flashing it.
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 400 - (Date.now() - started))));
      refreshStatus.classList.remove('refreshing');
      refreshStatus.classList.remove('visible');
      refreshStatus.textContent = failure ? 'Refresh failed. Try again.' : 'Products updated.';
      positionRefresh(0);
    }
  }
  let pullStart = null;
  let pullDistance = 0;
  function resetPull() {
    pullStart = null;
    pullDistance = 0;
    if (!refreshStatus.classList.contains('refreshing')) {
      refreshStatus.classList.remove('visible');
      positionRefresh(0);
    }
  }
  stage.addEventListener('touchstart', event => {
    resetPull();
    if (pending || refreshStatus.classList.contains('refreshing') || stage.scrollTop > 0 || event.touches.length !== 1 ||
        event.target.closest('input, select, textarea')) return;
    pullStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener('touchmove', event => {
    if (!pullStart) return;
    if (event.touches.length !== 1 || stage.scrollTop > 0) return resetPull();
    const dx = event.touches[0].clientX - pullStart.x;
    const dy = event.touches[0].clientY - pullStart.y;
    if (dy <= 0 || Math.abs(dx) > dy) return resetPull();
    event.preventDefault();
    pullDistance = dy;
    if (dy < 8) return;
    positionRefresh(Math.min(76, dy * .45), true);
    refreshStatus.classList.add('visible');
    refreshStatus.textContent = dy >= 100 ? 'Release to refresh' : 'Pull down to refresh';
  }, { passive: false });
  stage.addEventListener('touchend', event => {
    const ready = pullStart && pullDistance >= 100;
    if (pullDistance > 0) event.preventDefault();
    if (ready) {
      pullStart = null;
      pullDistance = 0;
      refresh();
    } else resetPull();
  }, { passive: false });
  stage.addEventListener('touchcancel', resetPull, { passive: true });
  slot.onclick = event => {
    if (event.target.closest('[data-more]')) { limit += 36; draw(pending, failure); }
    if (event.target.closest('[data-refresh]')) refresh();
  };
  if (page === 'find') view.addEventListener('finder-search', () => {
    finderSearching = true;
    limit = 36;
    draw(pending, failure);
  });
  if (page === 'find') view.addEventListener('finder-reset', () => { finderSearching = false; draw(pending, failure); });
  load();
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (link) { event.preventDefault(); mobileScreens.link(link.href); }
}, true);
