
const view=document.querySelector('#view'), nav=document.querySelector('#nav');

const catalog=[
 {name:'Oreck XL2100 Cloth Outer Vacuum Bag',brand:'Oreck',sku:'430001047',price:25.99,img:'oreck.png',pack:'Genuine 1 pack · XL2100 upright series'},
 {name:'Hoover Type S HEPA Vacuum Bags',brand:'Hoover',sku:'4010808S',price:7.49,img:'hoover.png',pack:'Genuine 2 pack · Type S canisters'},
 {name:'Oreck HEPA Upright Vacuum Bags',brand:'Oreck',sku:'AK1LW6H',price:34.99,img:'catalog-images/28UDH8G0Xh0C-IyFoZl3epBiSkLPbR8NilVYrdVzzOs.png',pack:'Genuine 6 pack · Select Discover and Magnesium models'},
 {name:'Hoover Type B Allergen Vacuum Bags',brand:'Hoover',sku:'4010103B',price:11.99,img:'catalog-images/tdB8hm1lRKCqPYvAzlobCeLfVLuIhdNfhs2n5VnLC6U.png',pack:'Genuine 3 pack · Select lightweight uprights'},
 {name:'Titan HEPA Canister Vacuum Bags',brand:'Titan',sku:'PAPERT9000-6',price:13.99,img:'catalog-images/ghZio0pr9-QuhBdGxKPdan6wI6JmuRKLOnKLqptb2k.png',pack:'6 pack · Canister vacuums'},
 {name:'Kirby Generation Series Vacuum Bags',brand:'Kirby',sku:'197294S',price:6.99,img:'catalog-images/zyYxtcqrk_INhI0yQBFGDEJqwYy5ILXecRXjKDT2NK8.png',pack:'Genuine 3 pack · Generation Series'},
 {name:'Oreck Edge Series Paper Vacuum Bags',brand:'Oreck',sku:'HB8PKOH',price:39.47,img:'catalog-images/sny7275Uwp2aISlOjdT7W_72hE-tgrMK0tkEjzqMk0k.png',pack:'Genuine 8 pack · Edge Series uprights'},
 {name:'NuTone Central Vacuum Bags',brand:'NuTone',sku:'391',price:16.99,img:'catalog-images/n_-OR_-HioqiGS684H-OjLpOQCi99yxPJT-IrBM7fS8.png',pack:'Genuine 3 pack · Central vacuum series'},
 {name:'Bissell PowerGlide Lift-Off Post-Motor Filter',brand:'Bissell',sku:'1601974',price:9.04,category:'Filters',img:'catalog-images/vacuum-pro-filter-img2.png',pack:'Pleated post-motor filter',categoryPhoto:true},
 {name:'Bissell CleanView Rewind 13-inch Brush Roll',brand:'Bissell',sku:'1636003',price:12.12,category:'Brush rolls',img:'catalog-images/mJjg70_H_UUYXFyj9H3Xw5sBniUTewdbsM2Y60Wteg.png',pack:'13-inch brush roll'},
 {name:'Bissell Flat Upright Vacuum Belts',brand:'Bissell',sku:'32074',price:4.44,category:'Belts',img:'catalog-images/vacuum-pro-belt-img2_05b45892-f6e1-4180-95ca-1e3c2981aed2.png',pack:'2 pack · Styles 7, 9, 10, 12 and 14',categoryPhoto:true},
 {name:'Kenmore 7-foot Canister Vacuum Hose',brand:'Kenmore',sku:'591004209',price:87.46,category:'Hoses',img:'catalog-images/645P_JSr4neQqnpRpeJafutifp6h5PO3r3JftDZZAyo.png',pack:'7-foot · 3-wire hose assembly'},
 {"name": "Hoover Platinum Cordless HEPA Filter", "brand": "Hoover", "sku": "410044001-2A1573", "price": 7.99, "category": "Filters", "img": "catalog-images/vacuum-pro-filter-img2.png", "pack": "Platinum cordless vacuums" ,"categoryPhoto": true},
 {"name": "Shark ION Robot Filter Kit", "brand": "Shark", "sku": "RVFFK700", "price": 16.99, "category": "Filters", "img": "catalog-images/vacuum-pro-filter-img2.png", "pack": "RV700 series" ,"categoryPhoto": true},
 {"name": "Century 400 UPV12 Exhaust Filter", "brand": "Century 400", "sku": "243A", "price": 38.99, "category": "Filters", "img": "catalog-images/vacuum-pro-filter-img2.png", "pack": "UPV12 upright" ,"categoryPhoto": true},
 {"name": "Bissell Lift-Off Revolution Wood Brush Roll", "brand": "Bissell", "sku": "2036777", "price": 22.99, "category": "Brush rolls", "img": "catalog-images/vacuum-pro-img2.png", "pack": "14½-inch wood brush roll · B104" ,"categoryPhoto": true},
 {"name": "Dyson DC21 and DC23 Brush Roll", "brand": "Dyson", "sku": "913102-01", "price": 34.99, "category": "Brush rolls", "img": "catalog-images/vacuum-pro-img2.png", "pack": "Genuine roller · DC21 and DC23" ,"categoryPhoto": true},
 {"name": "Bissell CrossWave Multi-Surface Brush Roll", "brand": "Bissell", "sku": "1608022", "price": 19.99, "category": "Brush rolls", "img": "catalog-images/vacuum-pro-img2.png", "pack": "CrossWave floor cleaning" ,"categoryPhoto": true},
 {"name": "Kenmore UB-8 Heavy Duty Upright Belt", "brand": "Kenmore", "sku": "UB-8", "price": 7.99, "category": "Belts", "img": "catalog-images/vacuum-pro-belt-img2_05b45892-f6e1-4180-95ca-1e3c2981aed2.png", "pack": "Heavy Duty and Heavy Duty Plus · 20-5270", "categoryPhoto": true},
 {"name": "Kenmore Canister Power Nozzle Flat Belt", "brand": "Kenmore", "sku": "20-5281", "price": 7.99, "category": "Belts", "img": "catalog-images/vacuum-pro-belt-img2_05b45892-f6e1-4180-95ca-1e3c2981aed2.png", "pack": "Flat belt for select canister power nozzles", "categoryPhoto": true},
 {"name": "Kirby Black Vacuum Belt", "brand": "Kirby", "sku": "159056S", "price": 7.99, "category": "Belts", "img": "catalog-images/vacuum-pro-belt-img2_05b45892-f6e1-4180-95ca-1e3c2981aed2.png", "pack": "Heritage, Tradition, Legend and Sentria", "categoryPhoto": true},
 {"name": "Dyson DC50 Upright Hose Assembly", "brand": "Dyson", "sku": "965077-02", "price": 22.4, "category": "Hoses", "img": "catalog-images/vacuum-pro-hoses-img2.png", "pack": "DC50 upright hose assembly", "categoryPhoto": true},
 {"name": "Kenmore Upright Lower Hose", "brand": "Kenmore", "sku": "561055144", "price": 15.23, "category": "Hoses", "img": "catalog-images/vacuum-pro-hoses-img2.png", "pack": "DU2012, DU2015 and 30725", "categoryPhoto": true},
 {"name": "Plastiflex 35-Foot Direct-Connect Hose", "brand": "Plastiflex", "sku": "SZ130138035BDUI", "price": 184.45, "category": "Hoses", "img": "catalog-images/vacuum-pro-hoses-img2.png", "pack": "Direct-connect central vacuum hose", "categoryPhoto": true}
];
const partCategory = part => part.category || "Vacuum bags";
let current=0, orderLines=[];
const quantities=catalog.map(()=>0);
let resultIndexes=[], contact={}, delivery='shipping';
const total=()=>catalog.reduce((sum,p,i)=>sum+p.price*quantities[i],0);
const grid=(items=catalog.map((_,i)=>i))=>'<div class="product-grid">'+items.map(i=>catalog[i]).map(p=>'<button type="button" data-go="item-'+catalog.indexOf(p)+'"><img src="'+p.img+'" alt="" loading="lazy"><small>'+p.brand+' · #'+p.sku+(p.categoryPhoto?' · Category image':'')+'</small><strong>'+p.name+'</strong><span>'+money(p.price)+'</span></button>').join('')+'</div>';
const orderNames=(lines=orderLines)=>lines.map(([n,q])=>n+' × '+q).join('<br>');

let signed=false,qty=0,order=false,query='',verified=false,preview='';
const button=(label,go,secondary=false)=>'<button type="button" data-go="'+go+'" class="'+(secondary?'secondary':'')+'">'+label+'</button>';
const actions=(...items)=>'<div class="actions">'+items.map(([label,go],i)=>button(label,go,i>0)).join('')+'</div>';
const field=(label,type='text',placeholder='')=>'<label>'+label+'<input name="'+label.toLowerCase().replace(' ','-')+'" type="'+type+'" placeholder="'+placeholder+'" required></label>';
const card=(title,detail,cls='')=>'<div class="card '+cls+'"><div class="label">'+title+'</div><p>'+detail+'</p></div>';
const money=n=>'$'+n.toFixed(2);
const title=s=>'<h1 tabindex="-1">'+s+'</h1>';
const form=(id,fields,label)=>'<form id="'+id+'">'+fields+'<div class="actions"><button>'+label+'</button></div></form>';
const productCard=(p=catalog[0])=>card(p.brand+' · #'+p.sku,p.pack+'<br><strong>'+money(p.price)+'</strong>');
const matches=s=>/^(430001047|(?:oreck\s+)?xl\s*-?\s*2100|oreck\s+xl2100\s+vacuum\s+bag)$/i.test(s.trim());
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const summary=(full=false)=>'<section class="checkout-box"><h2>Order summary</h2><div><span>Subtotal</span><span>'+money(total())+'</span></div>'+(full?'<div><span>Delivery</span><span>'+(delivery==='pickup'?'Local pickup':'Standard shipping')+'</span></div><div><span>Shipping and tax</span><span>Calculated by Shopify</span></div>':'')+'</section>';
const step=(active,label,detail)=>'<div class="progress" aria-label="Checkout progress">'+['Information','Delivery','Payment'].map((name,i)=>i===active?'<strong aria-current="step">'+(i+1)+' '+name+'</strong>':'<span>'+(i+1)+' '+name+'</span>').join('')+'</div>'+title(label)+'<p class="quiet">'+detail+'</p>';
const input=(label,name,type='text',attributes='')=>'<label>'+label+'<input name="'+name+'" type="'+type+'" value="'+escapeHTML(contact[name])+'" '+attributes+' required></label>';
const option=(name,value,label,checked)=>'<label class="option"><input type="radio" name="'+name+'" value="'+value+'"'+(checked?' checked':'')+'>'+label+'</label>';
const cartLines=()=>catalog.map((p,i)=>quantities[i]?'<article class="cart-line"><img src="'+p.img+'" alt=""><div><strong>'+p.name+'</strong><p class="quiet">Part #'+p.sku+' · '+money(p.price*quantities[i])+'</p><div class="stepper"><button type="button" class="secondary" data-go="remove-'+i+'" aria-label="Decrease '+p.name+' quantity">−</button><span>'+quantities[i]+'</span><button type="button" class="secondary" data-go="increase-'+i+'" aria-label="Increase '+p.name+' quantity">+</button></div></div></article>':'').join('');
const tabIcons={
 wishlist:'<path d="M20.8 8.5c0 4.7-8.8 9.5-8.8 9.5S3.2 13.2 3.2 8.5a4.5 4.5 0 0 1 8.8-1.4 4.5 4.5 0 0 1 8.8 1.4z"/>',
 home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
 find:'<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',
 scan:'<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M7 12h10"/>',
 cart:'<path d="M3 4h2l2.4 11h11.7l2-7H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
 account:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>'
};
const tabGroups={browse:'home',results:'find',product:'find',scan:'find',confirm:'find',unknown:'find',checkout:'cart',delivery:'cart',payment:'cart',failure:'cart',orders:'account',detail:'account',tracking:'account',support:'account'};
function renderTabs(page){
 const active=page==='product'?(tabGroups[productSource]||productSource):tabGroups[page]||page;
 nav.innerHTML=Object.entries({home:'Home',wishlist:'Wishlist',find:'Find a part',cart:'Cart',account:'Account'}).map(([key,label])=>{
  const count=key==='cart'?qty:key==='wishlist'?wishlist.length:0;
  const badge=count?'<span class="cart-badge">'+count+'</span>':'';
  const current=key===active?' aria-current="page"':'';
  const aria=key==='cart'||key==='wishlist'?' aria-label="'+label+' ('+count+')"':'';
  return '<button type="button" data-go="'+key+'"'+current+aria+'><span class="tab-icon" aria-hidden="true"><svg viewBox="0 0 24 24">'+tabIcons[key]+'</svg>'+badge+'</span><span>'+label+'</span></button>';
 }).join('');
}

// The prototype keeps demo data in the current browser tab across HTML pages.
const routes = {
  "welcome": "index.html",
  "login": "login.html",
  "signup": "signup.html",
  "reset": "reset.html",
  "inbox": "reset-confirmation.html",
  "home": "home.html",
  "wishlist": "wishlist.html",
  "browse": "browse.html",
  "find": "find-a-part.html",
  "results": "search-results.html",
  "scan": "scan-label.html",
  "confirm": "confirm-model.html",
  "unknown": "fit-not-confirmed.html",
  "product": "product.html",
  "cart": "cart.html",
  "checkout": "checkout-information.html",
  "delivery": "delivery.html",
  "payment": "payment.html",
  "failure": "payment-declined.html",
  "thanks": "order-confirmation.html",
  "account": "account.html",
  "orders": "order-history.html",
  "detail": "order-details.html",
  "tracking": "tracking.html",
  "support": "support.html"
};
const stateKey = 'vacuum-pro-demo';
const orderCelebrationKey = 'vacuum-pro-order-celebration';
const page = document.body.dataset.screen;
let checkoutReady = false;
let productSource = 'browse';
const demoEmail = 'deepak@ebuilderz.in';
const sampleOrder = {
  number: 'VP-1038',
  lines: [[catalog[0].name, 1], [catalog[11].name, 1]],
  shipment: true
};
let viewSampleOrder = false;
let demoWishlistSeeded = false;
let wishlist = [];
let accountEmail = '';
let orderOwner = '';
const savedAddressKey = () => 'vacuum-pro-address:' + accountEmail;
const savedAddress = () => signed && accountEmail
  ? JSON.parse(sessionStorage.getItem(savedAddressKey()) || '{}')
  : {};
const canViewOrder = () => order && (!orderOwner || orderOwner === accountEmail);
const accountOrder = () => orderOwner && canViewOrder()
  ? { number: 'VP-1042', lines: orderLines }
  : signed && accountEmail === demoEmail ? sampleOrder : null;
const visibleOrder = () => viewSampleOrder && signed && accountEmail === demoEmail
  ? sampleOrder
  : accountOrder() || (canViewOrder() ? { number: 'VP-1042', lines: orderLines } : null);
let checkoutMethodChosen = false;
let screenContent;

function loadState() {
  try {
    const state = JSON.parse(sessionStorage.getItem(stateKey) || '{}');
    ({ current = 0, orderLines = [], resultIndexes = [], contact = {},
      delivery = 'shipping', signed = false, order = false,
      verified = false, checkoutReady = false, checkoutMethodChosen = false,
      productSource = 'browse', query = '', accountEmail = '', orderOwner = '', wishlist = [], demoWishlistSeeded = false, viewSampleOrder = false } = state);
    if (Array.isArray(state.quantities)) {
      catalog.forEach((_, index) => { quantities[index] = state.quantities[index] || 0; });
    }
    qty = quantities.reduce((sum, quantity) => sum + quantity, 0);
  } catch (error) {
    console.warn('Demo state could not be read.', error);
  }
}

function saveState() {
  sessionStorage.setItem(stateKey, JSON.stringify({
    current, orderLines, resultIndexes, contact, delivery,
    signed, order, verified, quantities, checkoutReady, checkoutMethodChosen, productSource, query, accountEmail, orderOwner, wishlist, demoWishlistSeeded, viewSampleOrder
  }));
}

function render(next) {
  saveState();
  if (next === page) {
    paint(page, screenContent);
    return;
  }
  location.assign(routes[next] || routes.welcome);
}

function mountScreen(content) {
  screenContent = content;
  reloadScreen();
}

function reloadScreen() {
  loadState();
  let next = page;
  if (page === 'orders' && !signed) next = 'login';
  if (['detail', 'tracking'].includes(page) && !visibleOrder()) next = 'account';
  if (page === 'thanks' && !canViewOrder()) next = 'account';
  if (['payment', 'failure'].includes(page) && !checkoutMethodChosen) next = 'delivery';
  if (['delivery', 'payment', 'failure'].includes(page) && !checkoutReady) next = 'checkout';
  if (['checkout', 'delivery', 'payment', 'failure'].includes(page) && !qty) next = 'cart';
  if (next !== page) {
    location.replace(routes[next]);
    return;
  }
  paint(page, screenContent);
}

window.addEventListener('pageshow', event => {
  if (event.persisted) reloadScreen();
});

function paint(page, screen){

 const stage=document.querySelector('.stage'); stage.dataset.page=page; stage.scrollTop=0;
 const auth=['login','signup','reset','inbox'].includes(page); const centered=auth||(page==='cart'&&!qty)||(page==='account'&&!signed);
 stage.dataset.centered=String(centered);
 view.classList.remove('motion-in');
 void view.offsetWidth;
 view.classList.add('motion-in');
 const content=screen();
 const icon=page==='cart'
   ? '<path d="M3 4h2l2.4 11h11.7l2-7H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>'
   : '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>';
 view.innerHTML=auth?'<div class="centered-content auth-content">'+content+'</div>':centered?'<div class="centered-content"><div class="state-mark" aria-hidden="true"><svg viewBox="0 0 24 24">'+icon+'</svg></div>'+content+'</div>':content;
 const back = {
   login: 'welcome', signup: 'welcome', reset: 'login', inbox: 'login',
   browse: 'home', results: 'find', scan: 'find', confirm: 'find', unknown: 'scan',
   product: productSource, checkout: 'cart', delivery: 'checkout', payment: 'delivery',
   failure: 'payment', thanks: 'home', orders: 'account', detail: signed ? 'orders' : 'home',
   tracking: 'detail', support: 'account'
 }[page];
 const header = document.querySelector('#shell header');
 header.classList.toggle('has-back', Boolean(back));
 header.querySelector('.app-back')?.remove();
 if (back) header.insertAdjacentHTML('afterbegin', '<button type="button" class="app-back" data-go="'+back+'" aria-label="Back"><span aria-hidden="true">‹</span></button>');
 let dock = document.querySelector('#purchase-dock');
 if (!dock && page === 'product') {
   nav.insertAdjacentHTML('beforebegin', '<section id="purchase-dock" aria-label="Purchase"></section>');
   dock = document.querySelector('#purchase-dock');
 }
 if (dock) dock.innerHTML = '<div><small>Price</small><strong>'+money(catalog[current].price)+'</strong></div>'+button('Add to cart','add');
 nav.hidden=['welcome','login','signup','reset','inbox','checkout','delivery','payment','failure','thanks'].includes(page);
 nav.style.display=nav.hidden?'none':'flex';
 renderTabs(page);
 view.querySelector('h1')?.focus({preventScroll:true});window.scrollTo(0,0);
}
document.addEventListener('click',e=>{
 const go=e.target.closest('button[data-go]')?.dataset.go;if(!go)return; if(go==='sample-number'){const field=view.querySelector('input[name=query]');field.value='430001047';field.focus();return}
 if(go.startsWith('item-')){current=Number(go.slice(5));if(page!=='product')productSource=page;return render('product')}
 if(go==='toggle-wishlist'){
  const sku=catalog[current].sku;
  const control=e.target.closest('button[data-go]');
  const saved=!wishlist.includes(sku);
  wishlist=saved?[...wishlist,sku]:wishlist.filter(item=>item!==sku);
  saveState();
  control.setAttribute('aria-pressed', String(saved));
  renderTabs(page);
  return;
 }
 if(go==='add'){qty++;quantities[current]++;return render('cart')}
 if(/^(increase|remove)-[0-9]+$/.test(go)){
  const i=Number(go.split('-')[1]), delta=go.startsWith('increase')?1:-1;
  if(quantities[i]+delta>=0){quantities[i]+=delta;qty+=delta}
  const stage = document.querySelector('.stage');
  const scroll = stage.scrollTop;
  render('cart');
  stage.scrollTop = scroll;
  view.querySelector('[data-go="'+go+'"]')?.focus({preventScroll:true});
  return;
 }
 if(go==='sample-order'&&signed&&accountEmail===demoEmail){
  viewSampleOrder=true;
  return render('detail');
 }
 if((page==='orders'||page==='thanks')&&go==='detail')viewSampleOrder=false;
 if(go==='demo-account'){
  signed=true;
  accountEmail=demoEmail;
  contact={first:'Deepak',last:'',...savedAddress(),email:demoEmail};
  checkoutReady=false;
  if(!demoWishlistSeeded){
   wishlist=[...new Set([...wishlist,...[0,8,11].map(index=>catalog[index].sku)])];
   demoWishlistSeeded=true;
  }
  return render('account');
 }
 if(go==='logout'){signed=false;accountEmail='';contact={};checkoutReady=false;return render('welcome')}
 render(go);
});
view.addEventListener('submit',e=>{
 e.preventDefault();const data=new FormData(e.target);
 const id=e.target.id;
 if(['login','signup'].includes(id)){
  signed=true;
  accountEmail=String(data.get('email')||'').trim().toLowerCase();
  checkoutReady=false;
  contact={first:data.get('first-name'),last:data.get('last-name'),...savedAddress(),email:data.get('email')};
  return render('home');
 }
 if(id==='saved-address'&&signed&&accountEmail){
  const address=Object.fromEntries(data);
  sessionStorage.setItem(savedAddressKey(),JSON.stringify(address));
  contact={...contact,...address};
  return render('account');
 }
 if(id==='reset')return render('inbox');
 if(id==='search'){
  query=String(data.get('query')).trim().replace(/^#\s*/, '').toLowerCase();
  verified=matches(query)&&/xl/i.test(query);
  resultIndexes=verified?[0]:catalog.flatMap((p,i)=>query&&query.split(/\s+/).every(term=>(p.name+' '+p.sku+' '+p.pack+' '+partCategory(p)).toLowerCase().includes(term))?[i]:[]);
  return render('results');
 }
 if(id==='model'){
  const model=String(data.get('model'));
  query=model;
  verified=matches(model)&&/xl/i.test(model);
  resultIndexes=verified?[0]:[];
  return render(verified?'results':'unknown');
 }
 if(id==='information'){contact=Object.fromEntries(data);checkoutReady=true;checkoutMethodChosen=false;return render('delivery')}
 if(id==='delivery'){delivery=String(data.get('method'));checkoutMethodChosen=true;return render('payment')}
 if(id==='payment'&&qty){
  if (!['credit-card','paypal','affirm','shop-pay','paypal-express','google-pay'].includes(data.get('method'))) return;
  orderLines=catalog.map((p,i)=>[p.name,quantities[i]]).filter(([,q])=>q);
  quantities.fill(0);
  qty=0;
  order=true;
  orderOwner=accountEmail;
  viewSampleOrder=false;
  checkoutReady=false;
  sessionStorage.setItem(orderCelebrationKey, 'pending');
  return render('thanks');
 }

});
view.addEventListener('change',e=>{
 if(e.target.id!=='photo'||!e.target.files[0])return;
 if(preview)URL.revokeObjectURL(preview);
 preview=URL.createObjectURL(e.target.files[0]);
 const img=document.querySelector('#preview');img.src=preview;img.hidden=false;
 const note=document.querySelector('#scan-preview-note');note.hidden=false;note.textContent='Photo selected. Enter the model or part number to search.';
});
