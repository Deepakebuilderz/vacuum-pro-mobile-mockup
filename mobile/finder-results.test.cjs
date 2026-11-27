const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname+'/screens/catalog-ui.js','utf8');
const nodes = new Map();
const element = selector => {if (!nodes.has(selector)) nodes.set(selector,{}); return nodes.get(selector);};
const context = vm.createContext({
  page:'find',query:'', mobileScreens:{}, document:{createElement:()=>({setAttribute(){}})},
  view:{querySelector:selector=>['#category','#collection'].includes(selector)?null:element(selector),closest:()=>({before(){}})},
  escapeHTML:value=>value, liveGrid:rows=>'<grid>'+rows.map(row=>row.id).join(',')+'</grid>',
  fixture:[{id:'belt',title:'Vacuum Belt',vendor:'Hoover',variants:{nodes:[{sku:'440005536'}]}},{id:'filter',title:'Vacuum Filter',vendor:'Hoover',variants:{nodes:[{sku:'123456'}]}}],
});
vm.runInContext(source.slice(0,source.indexOf('function metafieldText')) + source.slice(source.indexOf("  const slot = view.querySelector('#mobile-products');"),source.indexOf('  let pending = false;')),context);
vm.runInContext('list=fixture;draw(false);',context);
assert.equal(element('#finder-results').hidden,true);
assert.equal(element('#mobile-products').innerHTML,'');
vm.runInContext("finderSearching=true;query='440005536';draw(false);",context);
assert.equal(element('#finder-results').hidden,false);
assert.equal(element('#finder-results-title').textContent,'Product found');
assert.match(element('#mobile-products').innerHTML,/<grid>belt<\/grid>[\s\S]*Suggested parts[\s\S]*<grid>filter<\/grid>/);
vm.runInContext("query='967040-01';draw(false);",context);
assert.equal(element('#finder-results-title').textContent,'Product not found');
assert.match(element('#mobile-products').innerHTML,/Suggested parts/);
vm.runInContext("draw(false,'Network unavailable');",context);
assert.equal(element('#finder-results-title').textContent,'Could not check products');
assert.doesNotMatch(element('#mobile-products').innerHTML,/Suggested parts/);
console.log('PASS: empty finder, found/not found, separate suggestions and network failure.');
