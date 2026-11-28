import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {presentFinder} from '../setup-testing-theme.mjs';

test('dedicated page replaces homepage finder with banner and adds one product entry',()=>{
  const index={sections:{test:{type:'apps',blocks:{old:{type:'shopify://apps/finder/blocks/part-finder/abc',settings:{collection:'parts'}}},block_order:['old'],settings:{}}},order:['test']};
  const product={sections:{main:{blocks:{title:{type:'title'},buy_buttons:{type:'buy_buttons'}},block_order:['title','buy_buttons']}}};
  const header={sections:{header:{type:'header',settings:{main_menu:'main-menu'}}}};
  const result=presentFinder(index,product,header,'test-menu');
  assert.match(result.page.sections.finder.blocks.finder.type,/\/blocks\/part-finder\//);
  assert.equal(result.page.sections.finder.blocks.finder.settings.collection,'parts');
  assert.match(result.index.sections.test.blocks.old.type,/\/blocks\/finder-banner\//);
  assert.equal(result.index.sections.test.blocks.old.settings.finder_page,'part-finder');
  assert.deepEqual(result.product.sections.main.block_order,['title','finder_compatibility','buy_buttons']);
  assert.equal(result.header.sections.header.settings.mobile_menu,'test-menu');
});
test('all merchant settings and placement blocks have valid schemas',async()=>{
  for(const file of ['part-finder','finder-banner','finder-product-link']) {
    const source=await readFile(`extensions/part-finder/blocks/${file}.liquid`,'utf8');
    const schema=JSON.parse(source.split('{% schema %}')[1].split('{% endschema %}')[0]);
    assert.equal(schema.target,'section');
    const ids=schema.settings.map(setting=>setting.id);
    assert.equal(new Set(ids).size,ids.length);
    if(file==='part-finder')for(const id of ['enable_camera','enable_gallery','show_suggestions','suggestion_count','found_label','not_found_label'])assert.ok(ids.includes(id));
    else assert.ok(ids.includes('finder_page'));
  }
});
