import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {finderMatch} from '../generated/matching.mjs';
import {loadCatalog,safeURL} from '../src/catalog.js';
import numbers from '../../mobile/scan-identifiers.js';

const product={id:'belt',title:'Vacuum Belt',vendor:'Hoover',tags:[],variants:{nodes:[{sku:'SKU-001'}]},mpn:{value:'440005536'},compatibleModels:{type:'list.single_line_text_field',value:'["FH51000","FH51001"]'}};
test('website uses exact mobile model/part rules and rejects unrelated numbers',()=>{
  assert.equal(finderMatch(product,'440005536'),'Part number match');
  assert.equal(finderMatch(product,'FH51000'),'Model match');
  assert.equal(finderMatch(product,'967040-01'),'');
  assert.equal(finderMatch(product,'FH5100'),'');
  assert.equal(numbers.scanIdentifiers('19HORT\nDyson 967040-01 Brush Bar')[0],'967040-01');
});
test('catalog pagination follows every page and deduplicates products',async()=>{
  const products=await loadCatalog({products:[product],next:'/page2'},async url=>{assert.equal(url,'/page2');return {products:[product,{id:'other'}],next:null};});
  assert.equal(products.length,2);
  await assert.rejects(loadCatalog({products:[],next:'/loop'},async()=>({products:[],next:'/loop'})),/did not finish/);
});
test('remote catalog pages cannot send the shopper to another origin',()=>{
  assert.equal(safeURL('/pages/find?page=2','https://example.com').origin,'https://example.com');
  assert.throws(()=>safeURL('https://evil.test','https://example.com'));
  assert.throws(()=>safeURL('javascript:alert(1)','https://example.com'));
});
test('block starts without results, separates camera/gallery, and has valid settings',async()=>{
  const liquid=await readFile('extensions/part-finder/blocks/part-finder.liquid','utf8');
  assert.match(liquid,/data-results[^>]*hidden/);
  assert.match(liquid,/data-camera-file[^>]*capture="environment"/);
  assert.doesNotMatch(liquid.match(/<input data-gallery-file[^>]*>/)[0],/capture=/);
  assert.match(liquid,/replace: '<', '\\u003c'/);
  const schema=JSON.parse(liquid.split('{% schema %}')[1].split('{% endschema %}')[0]);
  assert.equal(schema.target,'section');
  for(const asset of [schema.javascript,schema.stylesheet,'ocr.js','worker.min.js'])assert.ok((await stat('extensions/part-finder/assets/'+asset)).size>0);
});
