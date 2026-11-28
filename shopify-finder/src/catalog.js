export function safeURL(value, origin) {
  const url=new URL(value,origin);
  if(url.origin!==origin || !['http:','https:'].includes(url.protocol))throw new Error('The store returned an invalid catalog link.');
  return url;
}
export async function loadCatalog(initial, fetchPage) {
  const products=new Map(),seen=new Set();
  let page=initial;
  while(page) {
    if(!Array.isArray(page.products))throw new Error('Could not read the store catalog. Please retry.');
    for(const product of page.products)products.set(product.id,product);
    if(!page.next)break;
    if(seen.has(page.next))throw new Error('The catalog did not finish loading. Please retry.');
    seen.add(page.next);
    page=await fetchPage(page.next);
  }
  return [...products.values()];
}
