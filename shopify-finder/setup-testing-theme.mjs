import {readFile,writeFile,mkdir} from 'node:fs/promises';

export function presentFinder(index,product,header,menuHandle) {
  const sectionId=Object.keys(index.sections).find(id=>Object.values(index.sections[id].blocks||{}).some(block=>block.type?.includes('/blocks/part-finder/')));
  if(!sectionId)throw new Error('The existing finder block was not found in the test theme.');
  const section=index.sections[sectionId];
  const blockId=Object.keys(section.blocks).find(id=>section.blocks[id].type.includes('/blocks/part-finder/'));
  const finder=structuredClone(section.blocks[blockId]);
  const prefix=finder.type.split('/blocks/')[0];
  const extension=finder.type.split('/').at(-1);
  const type=handle=>`${prefix}/blocks/${handle}/${extension}`;
  const page={sections:{finder:{type:'apps',blocks:{finder},block_order:['finder'],settings:{...section.settings,padding_top:10,padding_bottom:20}}},order:['finder']};
  finder.settings={...finder.settings,enable_camera:true,enable_gallery:true,show_suggestions:true,suggestion_count:4,found_label:'Product found',not_found_label:'Product not found'};
  section.blocks={[blockId]:{type:type('finder-banner'),settings:{finder_page:'part-finder',heading:'Not sure which part fits?',description:'Search by model or part number, or scan your label.',button_text:'Find your part',accent:'#1c3158'}}};
  section.block_order=[blockId];
  section.settings.padding_top=20;section.settings.padding_bottom=20;
  const main=product.sections.main;
  main.blocks.finder_compatibility={type:type('finder-product-link'),settings:{finder_page:'part-finder',heading:'Need help checking compatibility?',description:'Find parts using your vacuum’s model number.',link_text:'Check your model'}};
  main.block_order=main.block_order.filter(id=>id!=='finder_compatibility');
  const buy=main.block_order.indexOf('buy_buttons');
  main.block_order.splice(buy<0?main.block_order.length:buy,0,'finder_compatibility');
  const headerSection=Object.values(header.sections).find(section=>section.type==='header');
  if(!headerSection)throw new Error('Header section was not found.');
  headerSection.settings.main_menu=menuHandle;
  headerSection.settings.mobile_menu=menuHandle;
  return {index,product,header,page};
}

if(process.argv[1]?.endsWith('setup-testing-theme.mjs')) {
  const load=async file=>JSON.parse((await readFile('generated/theme/'+file,'utf8')).replace(/^\s*\/\*[\s\S]*?\*\/\s*/,''));
  const output=presentFinder(await load('templates/index.json'),await load('templates/product.json'),await load('sections/header-group.json'),'vacuum-pro-finder-test-menu');
  for(const directory of ['templates','sections'])await mkdir('theme-overrides/'+directory,{recursive:true});
  for(const [key,file] of Object.entries({index:'templates/index.json',product:'templates/product.json',header:'sections/header-group.json',page:'templates/page.part-finder.json'}))await writeFile('theme-overrides/'+file,JSON.stringify(output[key],null,2)+'\n');
  console.log('Generated four presentation files for draft theme 189779640638.');
}
