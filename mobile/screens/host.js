const frame = document.querySelector('#screen');
const state = new Map();
const requests = new Map();
const cache = new Map();
const products = new Map();
let requestId = 0;
let route = 'index.html';

function send(message) {
  window.ReactNativeWebView.postMessage(JSON.stringify(message));
}

function requestPage(feed, id, after) {
  return new Promise((resolve, reject) => {
    const key = ++requestId;
    const timeout = setTimeout(() => {
      requests.delete(key);
      reject(new Error('Shopify took too long to respond. Try again.'));
    }, 22000);
    requests.set(key, { resolve, reject, timeout });
    send({ type: 'catalog', key, feed, id, after });
  });
}

window.vacuumScreens = {
  storage: {
    getItem: key => state.get(key) ?? null,
    setItem: (key, value) => state.set(key, String(value)),
    removeItem: key => state.delete(key),
  },
  products,
  collection: null,
  scanResult: null,
  visualSearch() {
    return new Promise((resolve, reject) => {
      const key = ++requestId;
      const timeout = setTimeout(() => { requests.delete(key); reject(new Error('Photo matching took too long. Try again.')); }, 50000);
      requests.set(key, {resolve, reject, timeout});
      send({type:'visual-search', key});
    });
  },
  scan(source) {
    return new Promise((resolve, reject) => {
      const key = ++requestId;
      const timeout = setTimeout(() => { requests.delete(key); reject(new Error('Photo selection timed out. Please try again.')); }, 180000);
      requests.set(key, { resolve, reject, timeout });
      send({ type:'scan', key, source });
    });
  },
  open(file) {
    if (!Object.hasOwn(pages, file)) return;
    route = file;
    frame.srcdoc = pages[file];
    send({ type: 'screen', root: route === 'index.html' });
  },
  back() {
    const doc = frame.contentDocument;
    const button = doc?.querySelector('header .app-back') ||
      doc?.querySelector('#nav button[data-go="home"]');
    if (route === 'home.html' || !button) this.open('index.html');
    else button.click();
  },
  receive(key, page, error) {
    const pending = requests.get(key);
    if (!pending) return;
    clearTimeout(pending.timeout);
    requests.delete(key);
    if (error) pending.reject(new Error(error));
    else pending.resolve(page);
  },
  invalidate() { cache.clear(); },
  async *catalog(feed, id) {
    const key = feed + '/' + (id || '');
    if (cache.has(key)) { yield cache.get(key); return; }
    const rows = new Map();
    const cursors = new Set();
    let after = null;
    do {
      const page = await requestPage(feed, id, after);
      for (const item of page.nodes) {
        rows.set(item.id, item);
        if (feed !== 'collections') products.set(item.id, item);
      }
      if (!page.pageInfo.hasNextPage) break;
      after = page.pageInfo.endCursor;
      if (!after || cursors.has(after)) throw new Error('Shopify returned an incomplete page.');
      cursors.add(after);
      yield [...rows.values()];
    } while (after);
    const items = [...rows.values()];
    cache.set(key, items);
    yield items;
  },
  link(url) { send({ type: 'link', url }); },
  share(title, url) { send({ type: 'share', title, url }); },
};
window.vacuumScreens.open(route);
