export const shopDomain = process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN || 'vacuumprollc.myshopify.com';
const productId = 'gid://shopify/Product/15517852401822';

const finderFields = `
  tags
  mpn: metafield(namespace: "custom", key: "mpn") { value }
  compatibleModels: metafield(namespace: "custom", key: "compatible_models") {
    type value
    reference { ... on Metaobject { modelNumber: field(key: "model_number") { value } } }
    references(first: 20) { nodes { ... on Metaobject { modelNumber: field(key: "model_number") { value } } } }
  }
  detailFields: metafields(identifiers: [
    { namespace: "custom", key: "product_specifications" },
    { namespace: "custom", key: "package_includes" },
    { namespace: "custom", key: "why_replace_this_part" },
    { namespace: "custom", key: "pack" },
    { namespace: "custom", key: "feature" },
    { namespace: "custom", key: "compatible_brands" },
    { namespace: "custom", key: "fits_series" },
    { namespace: "custom", key: "oem_status" },
    { namespace: "custom", key: "faq" }
  ]) { key type value }
`;
const productFields = `
  id title description vendor productType onlineStoreUrl category { id name }
  ${finderFields}
  featuredImage { url(transform: { maxWidth: 480 }) altText }
  images(first: 6) { nodes { url(transform: { maxWidth: 960 }) altText } }
  availableForSale
  variants(first: 1) { nodes { sku selectedOptions { name value } price { amount currencyCode } } }
`;
const pageFields = 'pageInfo { hasNextPage endCursor }';
const queries = {
  products: `query CatalogProducts($after: String) {
    products(first: 40, after: $after, sortKey: TITLE) { nodes { ${productFields} } ${pageFields} }
  }`,
  collections: `query CatalogCollections($after: String) {
    collections(first: 100, after: $after, sortKey: TITLE) { nodes { id title } ${pageFields} }
  }`,
  collectionProducts: `query CollectionProducts($id: ID!, $after: String) {
    collection(id: $id) { products(first: 40, after: $after) { nodes { ${productFields} } ${pageFields} } }
  }`,
};

async function request(query, variables, signal) {
  const headers = { 'Content-Type': 'application/json' };
  const token = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  if (token) headers['X-Shopify-Storefront-Access-Token'] = token;

  if (!token) query = query.replace(finderFields, '');
  const response = await fetch(`https://${shopDomain}/api/2026-10/graphql.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    signal,
  });
  if (response.status === 400) {
    if (query.includes(finderFields)) return request(query.replace(finderFields, ''), variables, signal);
    const body = (await response.text()).trim();
    let detail = '';
    try {
      const { errors, error, message } = JSON.parse(body);
      detail = Array.isArray(errors) ? errors.map(item => item?.message || item).join(' ') : errors || error || message;
    } catch {
      if (!body.startsWith('<')) detail = body;
    }
    const reason = typeof detail === 'string' && detail ? detail.slice(0, 300) : 'No error details supplied.';
    throw new Error(`${shopDomain} returned HTTP 400. ${reason}`);
  }
  if (!response.ok) {
    const guidance = {
      401: 'Check the public Storefront token for this store.',
      402: 'Check the store status in Shopify Admin.',
      403: 'Check Storefront API access for this store.',
      404: 'Verify the myshopify.com domain in Settings > Domains.',
      423: 'Check whether this store is locked in Shopify Admin.',
      429: 'Wait before retrying the catalog request.',
      430: 'Shopify blocked this request. Check the network used by the device.',
    };
    throw new Error(`${shopDomain} returned HTTP ${response.status}. ${guidance[response.status] || 'Try again.'}`);
  }
  const result = await response.json();
  if (result.errors?.length && query.includes(finderFields)) {
    return request(query.replace(finderFields, ''), variables, signal);
  }
  if (result.errors?.length || !result.data) {
    throw new Error('Shopify could not load the catalog. Check storefront access and try again.');
  }
  return result.data;
}

export async function fetchTestProduct(signal) {
  const data = await request(`query TestProduct($id: ID!) { product(id: $id) { ${productFields} } }`, { id: productId }, signal);
  return data.product;
}

export async function fetchCatalogPage(feed, id, after, signal) {
  const variables = feed === 'collectionProducts' ? { id, after } : { after };
  const data = await request(queries[feed], variables, signal);
  const connection = feed === 'collectionProducts' ? data.collection?.products : data[feed];
  if (!connection) throw new Error('This catalog is unavailable on the current storefront.');
  return connection;
}
