import {finderMatch} from '../generated/matching.mjs';
import numbers from '../../mobile/scan-identifiers.js';
import {loadCatalog,safeURL} from './catalog.js';

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
let ocrPromise;
function loadOCR(root) {
  if(!ocrPromise)ocrPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=root.dataset.ocr;
    script.onload=()=>resolve(window.VacuumFinderOCR);
    script.onerror=()=>{ocrPromise=null;script.remove();reject(new Error('Photo reader could not load. Check your connection and try again.'));};
    document.head.append(script);
  });
  return ocrPromise;
}
function mount(root) {
  if(root.dataset.ready)return;
  root.dataset.ready='true';
  const $=selector=>root.querySelector(selector);
  const input=$('[data-number]'),status=$('[data-status]'),results=$('[data-results]');
  let catalogPromise, generation=0,previewURL;
  const notice=text=>{status.textContent=text;status.hidden=!text;};
  function catalog() {
    if(!catalogPromise)catalogPromise=loadCatalog(JSON.parse($('[data-catalog]').textContent),async next=>{
      const url=safeURL(next,location.origin);
      url.searchParams.set('section_id',root.dataset.section);
      const response=await fetch(url,{credentials:'same-origin',signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error('Could not load products. Please try again.');
      const doc=new DOMParser().parseFromString(await response.text(),'text/html');
      const data=doc.getElementById(root.id)?.querySelector('[data-catalog]');
      if(!data)throw new Error('Could not read the next catalog page. Please try again.');
      return JSON.parse(data.textContent);
    }).catch(error=>{catalogPromise=null;throw error;});
    return catalogPromise;
  }
  function cards(products,term='') {
    return '<div class="vpf-grid">'+products.map(product=>{
      const url=safeURL(product.url,location.origin);
      let image='';
      try {const src=new URL(product.image,location.origin);if(src.protocol==='https:')image='<img src="'+escapeHTML(src.href)+'" alt="" loading="lazy" width="240" height="200">';}catch{}
      return '<a class="vpf-product" href="'+escapeHTML(url.href)+'">'+image+'<span class="vpf-brand">'+escapeHTML(product.vendor)+'</span><strong>'+escapeHTML(product.title)+'</strong><span>'+escapeHTML(product.price)+'</span>'+(term?'<small>'+escapeHTML(finderMatch(product,term))+'</small>':'')+'<span class="vpf-link">View part →</span></a>';
    }).join('')+'</div>';
  }
  async function search(term, fromPhoto=false) {
    const serial=++generation;
    results.hidden=false;
    results.innerHTML='<h3 tabindex="-1">Checking products…</h3>';
    try {
      const products=await catalog();
      if(serial!==generation || !root.isConnected)return;
      const priority=['Part number match','Model match','Series match - check fit','Catalog match'];
      const matches=term?products.map(product=>({product,match:finderMatch(product,term)})).filter(row=>row.match).sort((a,b)=>priority.indexOf(a.match)-priority.indexOf(b.match)).map(row=>row.product):[];
      const ids=new Set(matches.map(product=>product.id));
      const others=products.filter(product=>!ids.has(product.id)&&/vacuum|filter|belt|bag|brush|harness/i.test(product.title));
      others.sort((a,b)=>Number(matches.some(p=>p.vendor&&p.vendor===b.vendor))-Number(matches.some(p=>p.vendor&&p.vendor===a.vendor)));
      results.innerHTML='<h3 tabindex="-1">'+escapeHTML(matches.length?(root.dataset.foundLabel||'Product found'):(root.dataset.notFoundLabel||'Product not found'))+'</h3>'+(term?'<p>Results for <strong>'+escapeHTML(term)+'</strong></p>':'')+(fromPhoto?'<p class="vpf-muted">Check the detected number against your label. Edit it above to search again.</p>':'')+(matches.length?cards(matches,term):'<p>'+(term?'No matching parts in our current catalog. Check the number or contact us for fitment help.':'No readable number was found. Try a close-up of the label or enter the number above.')+'</p>')+(root.dataset.suggestions!=='false'&&others.length?'<h3>Suggested parts</h3><p class="vpf-muted">Other parts to explore. Confirm your model before ordering.</p>'+cards(others.slice(0,Math.max(1,Math.min(8,Number(root.dataset.suggestionCount)||4)))):'');
      results.querySelector('h3').focus({preventScroll:true});
      results.scrollIntoView({behavior:'smooth',block:'start'});
    } catch(error) {
      if(serial!==generation)return;
      results.innerHTML='<h3>Could not check products</h3><p role="alert">'+escapeHTML(error.message)+'</p><button type="button" data-retry>Try again</button>';
      results.querySelector('[data-retry]').onclick=()=>search(term,fromPhoto);
    }
  }
  $('[data-form]').onsubmit=event=>{event.preventDefault();const term=input.value.trim();if(term){input.blur();notice('');search(term);}};
  input.addEventListener('search',()=>{if(!input.value){generation++;results.hidden=true;notice('');}});
  const camera=$('[data-camera-file]'),gallery=$('[data-gallery-file]');
  $('[data-camera]').onclick=()=>camera.click();
  $('[data-gallery]').onclick=()=>gallery.click();
  async function scan(event) {
    const file=event.target.files?.[0];
    if(!file)return;
    event.target.value='';
    if(!/^image\//.test(file.type)){notice('Choose an image file.');return;}
    if(file.size>12_000_000){notice('Choose a photo smaller than 12 MB.');return;}
    const buttons=[...root.querySelectorAll('[data-camera],[data-gallery]')];
    buttons.forEach(button=>button.disabled=true);
    notice('Loading photo reader. Your photo stays in your browser…');
    try {
      const ocr=await loadOCR(root);
      const text=await ocr.recognize(file,root.dataset.worker,percent=>notice('Reading label… '+percent+'%'));
      const candidates=numbers.scanIdentifiers(text);
      if(previewURL)URL.revokeObjectURL(previewURL);
      previewURL=URL.createObjectURL(file);
      $('[data-preview]').src=previewURL;
      $('[data-photo]').hidden=false;
      const select=$('[data-candidates]');
      select.replaceChildren(...candidates.map(value=>new Option(value,value)));
      $('[data-candidate-label]').hidden=candidates.length<2;
      input.value=candidates[0]||'';
      notice(candidates.length?'Number detected. Check it against the label before ordering.':'No clear number found. Try a closer photo or type it above.');
      await search(input.value,true);
    } catch(error){notice('Could not read this photo. Try a clearer JPG or PNG, or enter the number manually.');}
    finally{buttons.forEach(button=>button.disabled=false);}
  }
  camera.onchange=gallery.onchange=scan;
  $('[data-candidates]').onchange=event=>{input.value=event.target.value;search(input.value,true);};
  root.addEventListener('vpf:cleanup',()=>{generation++;if(previewURL)URL.revokeObjectURL(previewURL);});
}
function init(){document.querySelectorAll('[data-vpf]').forEach(mount);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
document.addEventListener('shopify:section:load',init);
document.addEventListener('shopify:section:unload',event=>event.target.querySelectorAll('[data-vpf]').forEach(root=>root.dispatchEvent(new Event('vpf:cleanup'))));
