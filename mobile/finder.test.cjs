const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function main() {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {value:'', hidden:true, disabled:false, listeners:{}, addEventListener(name, handler){this.listeners[name]=handler;}, replaceChildren(...children){this.children=children;}, blur(){this.blurred=true;}, scrollIntoView(){this.scrolled=true;}});
    return elements.get(selector);
  };
  let markup='', source='', response={candidates:['440005536','FH51000'],preview:'data:image/jpeg;base64,test'};
  let dispatched=0, saved=0;
  const context = vm.createContext({
    mountScreen: template => {markup=template();}, query:'', escapeHTML: value=>value, grid:()=>'<div class="product-grid"></div>',
    view:{querySelector:element,dispatchEvent:event=>{assert.equal(event.type,'finder-search');dispatched++;}},
    Event:class {constructor(type){this.type=type;}}, Option:class {constructor(text,value){this.text=text;this.value=value;}},
    saveState:()=>saved++, mobileScreens:{scan:async input=>{source=input;if(response instanceof Error)throw response;return response;}},
  });
  vm.runInContext(fs.readFileSync(__dirname+'/../finder.js','utf8'),context);
  assert.match(markup,/Scan with camera/);
  assert.match(markup,/or upload from gallery/);
  assert.doesNotMatch(markup,/data-go="(?:scan|confirm)"/);
  assert.match(markup,/id="finder-results"[^>]*hidden/);
  await element('#finder-camera').onclick();
  assert.equal(source,'camera');
  assert.equal(element('#finder-number').value,'440005536');
  assert.equal(context.query,'440005536','scan starts the catalog lookup automatically');
  assert.equal(element('#finder-feedback').hidden,false);
  assert.equal(element('#finder-candidates').children.length,2);
  let prevented=false, stopped=false;
  element('#search').listeners.submit({preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});
  assert.ok(prevented && stopped, 'search stays on the finder screen');
  assert.equal(context.query,'440005536');
  assert.equal(dispatched,2);
  assert.equal(element('#finder-results-title').scrolled,true);
  response=null;
  await element('#finder-gallery').onclick();
  assert.equal(source,'gallery');
  assert.equal(element('#finder-number').value,'440005536','cancel preserves input');
  response={candidates:[],preview:'data:image/jpeg;base64,test'};
  await element('#finder-camera').onclick();
  assert.equal(element('#finder-number').value,'');
  assert.match(element('#finder-status').textContent,/No clear number/);
  response=new Error('Camera access is off');
  await element('#finder-camera').onclick();
  assert.equal(element('#finder-camera').disabled,false);
  assert.equal(element('#finder-gallery').disabled,false);
  assert.match(element('#finder-status').textContent,/Camera access/);
  assert.ok(saved);
  console.log('PASS: one-screen number search, camera/gallery, inline OCR, cancel, unreadable photo and retry.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
