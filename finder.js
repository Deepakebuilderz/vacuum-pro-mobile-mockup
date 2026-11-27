mountScreen(() => `
  <section class="finder-search" aria-labelledby="finder-title">
    <div class="finder-heading"><span class="finder-eyebrow">PART FINDER</span><h1 id="finder-title" tabindex="-1">Find your part</h1><p>Enter a number or take a photo of the label.</p></div>
    <form id="search" role="search" class="finder-entry">
      <label for="finder-number">Model or part number</label>
      <input id="finder-number" name="query" type="search" value="${escapeHTML(query)}" placeholder="e.g. FH51000 or 440005536" enterkeyhint="search" autocomplete="off" required>
      <button type="submit" class="finder-submit">Search parts <span aria-hidden="true">→</span></button>
    </form>
    <div class="finder-divider"><span>or use a photo</span></div>
    <div class="finder-photo">
      <button id="finder-camera" class="finder-camera" type="button"><span class="finder-camera-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 7h5l2-3h4l2 3h5v13H3z"/><circle cx="12" cy="13" r="3.5"/></svg></span><span><strong>Scan with camera</strong><small>Photograph the model or part number</small></span><span aria-hidden="true">↗</span></button>
      <button id="finder-gallery" class="finder-gallery" type="button">or upload from gallery</button>
    </div>
    <p id="finder-status" class="finder-status" role="status" aria-live="polite" hidden></p>
    <div id="finder-feedback" class="finder-feedback" hidden><img id="finder-preview" alt="Selected label photo"><div><strong>Check the detected number</strong><p>It’s in the box above. Edit if needed, then search.</p><label id="finder-candidates-label" hidden>Other detected numbers<select id="finder-candidates" aria-label="Other detected numbers"></select></label></div></div>
    <button id="finder-visual" class="secondary" type="button" hidden>Find similar-looking parts</button>
    <details class="finder-hint"><summary><span class="finder-hint-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 10h8M8 14h4"/></svg></span><span class="finder-hint-heading"><strong>Where’s my model number?</strong><small>A quick guide to finding your label</small></span><svg class="finder-hint-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg></summary><div class="finder-hint-content"><p>Look for the model label in these places:</p><ul><li>Under the vacuum base</li><li>Near the power cord or on the back</li><li>On the old part, for a part number</li></ul><div class="finder-hint-tip"><strong>Photo tip</strong><span>Move close and keep the full number in frame. Avoid glare.</span></div></div></details>
  </section>
  <section id="finder-results" class="finder-suggestions" hidden><h2 id="finder-results-title"></h2><div id="finder-product-list"><div class="product-grid"></div></div><button class="finder-help" type="button" data-go="support">Need help finding a part? <span aria-hidden="true">→</span></button></section>
`);

const finderForm = view.querySelector('#search');
const finderNumber = view.querySelector('#finder-number');
const finderStatus = view.querySelector('#finder-status');
const finderFeedback = view.querySelector('#finder-feedback');
const finderCamera = view.querySelector('#finder-camera');
const finderGallery = view.querySelector('#finder-gallery');
const finderCandidates = view.querySelector('#finder-candidates');
const finderVisual = view.querySelector('#finder-visual');
function finderNotice(message) {
  finderStatus.hidden = !message;
  finderStatus.textContent = message;
}
function searchFinder(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const number = finderNumber.value.trim();
  if (!number) return;
  query = number;
  saveState();
  finderNotice('');
  if (typeof mobileScreens !== 'undefined') view.dispatchEvent(new Event('finder-search'));
  else {
    const matches = catalog.flatMap((part, index) => [part.name,part.sku,part.mpn,...(part.models || [])].join(' ').toLowerCase().includes(number.toLowerCase()) ? [index] : []);
    view.querySelector('#finder-results').hidden = false;
    view.querySelector('#finder-results-title').textContent = matches.length ? 'Product found' : 'Product not found';
    const suggestions = catalog.flatMap((part,index)=>matches.includes(index)?[]:[index]).slice(0,4);
    view.querySelector('#finder-product-list').innerHTML = grid(matches) + '<h3>Suggested parts</h3>' + grid(suggestions);
    if (!matches.length) finderNotice('No matching parts in the current catalog. Check the number or ask us for help.');
  }
  finderNumber.blur();
  view.querySelector('#finder-results-title')?.scrollIntoView?.({behavior:'smooth', block:'start'});
}
finderForm.addEventListener('submit', searchFinder);
finderNumber.addEventListener('search', () => {
  if (!finderNumber.value) { query = ''; saveState(); view.querySelector('#finder-results').hidden = true; if (typeof mobileScreens !== 'undefined') view.dispatchEvent(new Event('finder-reset')); }
});
finderCandidates.addEventListener('change', () => { finderNumber.value = finderCandidates.value; });
async function scanFinder(source) {
  if (typeof mobileScreens === 'undefined') { finderNotice('Open the installed mobile app to scan a label. You can search by number here.'); return; }
  finderCamera.disabled = finderGallery.disabled = true;
  finderNotice('Choose a clear label photo. Reading the number on your device…');
  try {
    const result = await mobileScreens.scan(source);
    if (!result) { finderNotice(''); return; }
    mobileScreens.scanResult = result;
    const candidates = result.candidates || [];
    view.querySelector('#finder-preview').src = result.preview;
    finderFeedback.hidden = !candidates.length;
    finderNumber.value = candidates[0] || '';
    finderCandidates.replaceChildren(...candidates.map(value => new Option(value, value)));
    view.querySelector('#finder-candidates-label').hidden = candidates.length < 2;
    finderVisual.hidden = !result.visualAvailable;
    query = candidates[0] || '';
    saveState();
    view.dispatchEvent(new Event('finder-search'));
    finderNotice(candidates.length ? 'Showing possible matches. Check the detected number above; edit and search again if needed.' : 'No clear number found. Try a closer photo of just the label, or enter the number above.');
    view.querySelector('#finder-results-title')?.scrollIntoView?.({behavior:'smooth', block:'start'});
  } catch (error) { finderNotice(error.message); }
  finally { finderCamera.disabled = finderGallery.disabled = false; }
}
finderCamera.onclick = () => scanFinder('camera');
finderGallery.onclick = () => scanFinder('gallery');
finderVisual.onclick = async () => {
  finderVisual.disabled = true;
  finderNotice('Your selected photo will be sent to our photo matching service. Comparing catalog photos…');
  try {
    const result = await mobileScreens.visualSearch();
    for await (const items of mobileScreens.catalog('products')) syncParts(items);
    const products = result.ids.map(id => mobileScreens.products.get(id)).filter(Boolean);
    view.querySelector('#finder-results').hidden = false;
    view.querySelector('#finder-results-title').textContent = 'Similar-looking parts · check compatibility';
    view.querySelector('#mobile-products').innerHTML = liveGrid(products);
    finderNotice(products.length ? 'Visual similarity does not confirm fit. Check your model and dimensions before ordering.' : 'No similar parts found in our current catalog. Contact us for fitment help.');
  } catch (error) { finderNotice(error.message); }
  finally { finderVisual.disabled = false; }
};
