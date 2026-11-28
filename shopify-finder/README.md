# Vacuum PRO Part Finder — Shopify app

Target testing store: `ebuilderz-testing-store.myshopify.com`.

Registered app: **Vacuum PRO Part Finder**, client ID `386d5c555bd02bcf1d025f4266ebd89c`, eBuilderz Infotech organization. The app and extensions are deployed and installed on the testing store. Finder is enabled on `/pages/part-finder` in **Vacuum PRO Finder - Test** (ID `189779640638`), currently the testing store's live theme. The original Vacuum PRO production store is unchanged.

The testing store includes a Find a Part desktop/mobile navigation entry, homepage entry banner, and product-page compatibility link. The app dashboard has Setup, Finder settings and Appearance pages. Its links open Shopify's actual theme app-block controls, where merchants can set the catalog collection, camera/gallery availability, suggestions/count, labels, color and help link. Banner and product-entry copy and destination are separate app-block settings.

`setup-testing-theme.mjs` generates the four reviewed theme files in `theme-overrides/` from backups in `generated/theme/`. These overrides are specific to this testing theme; do not upload them to another store or overwrite unrelated theme files.

This is a theme app extension for custom distribution. It adds a responsive finder app block, number search, camera capture on supported mobile browsers, gallery upload and browser OCR. Product matches and separate suggestions appear only after searching or scanning. Customers open the real Shopify product page to select options and purchase.

## Development

Use Node 22.12+ and npm. From this directory:

```sh
npm install
npm test
npx shopify app config link
npm run build
npm run dev
```

This project is already linked through `shopify.app.vacuum-pro-part-finder.toml`. Use that configuration and the existing app; do not create a duplicate. `shopify.app.example.toml` is only an example and has no working client ID.

The app requires no Admin API data scopes. Products and metafields are rendered by Shopify Liquid from the current store's published Online Store catalog. No Admin or Storefront API token is embedded in the block.

## Install and enable

Deploy using `npm run deploy`. In the Dev Dashboard choose custom distribution and generate the installation link restricted to the testing store. Install the app, then open the theme editor on a duplicate/test theme. Add **Apps → Vacuum PRO Part Finder** to a page or homepage, optionally set the fitment-help link and button color, and save. Preview before publishing the theme.

## Catalog behavior

- Read `custom.mpn`, `custom.compatible_models`, SKU, tags, title and vendor. Matching and OCR identifier parsing reuse the mobile project's source at build time.
- Select the finder collection in the block settings. This testing store uses **Vacuum PRO Finder Parts**, an automatic collection whose product-title condition contains `Vacuum`. It contains 8 products, of which 5 are currently available through the Online Store. The existing `all` collection is an empty collection named Summer, so it must not be used as the finder catalog.
- Products must be published to the Online Store channel. Headless-only publication does not make them available to Liquid.
- Catalog is loaded when the shopper searches, following Liquid pagination through the Section Rendering API. All pages must succeed before reporting a definitive no-match. A fetch failure offers retry rather than reporting product not found.
- Shopify Liquid pagination is limited to 25,000 items. A larger catalog needs a backend search index; browser indexing should also be replaced for large stores to reduce download size and latency.
- Suggested parts are other published parts, prioritizing the brand of found products. They are not compatibility claims.
- The current match uses the selected/first available variant SKU and product-level MPN/models. Use product-level MPNs or part tags for additional variant identifiers.

## Scanner and privacy

The camera input uses `capture="environment"`; mobile browsers may offer a system chooser rather than immediately opening the camera. The gallery button is separate. Desktop users can upload a label image.

Tesseract runs in a Web Worker. The app assets/worker are served by Shopify; its OCR core and English language data load from jsDelivr on first scan. Photos stay in the browser and are not uploaded. OCR assets are lazy-loaded after photo selection. Poor lighting, monitor glare and similar-looking characters can still produce incorrect text; the detected number remains editable. Part-only visual matching is not part of this extension.

## Validation

`npm test` checks actual shared matching/OCR rules, pagination, loop detection, same-origin URL validation, initial hidden results and block schema/assets. `npm run build` runs Shopify's extension validation once the app is linked. Test real Chrome Android and Safari iPhone cameras, denied/cancelled camera selection, bad photos, correct and absent identifiers, unpublished products, Shopify locale paths and theme-editor section reloads before publishing.

Completed checks: all six Node tests (including presentation transforms and block settings), Shopify theme-check/build and release, and actual Tesseract OCR on the synthetic label (both `FH51000` and `440005536` detected). Verified on the testing storefront: navbar/homepage banner, dedicated finder page, initially hidden results, part-number `440005536` match, model `FH51000` match, missing `967040-01` result with separate suggestions, product-page compatibility link and return to finder. Browser photo OCR previously detected `FH51000` and opened the matching results. The app dashboard and its navigation render in Shopify Admin. Mobile stacked layout was visually checked in Shopify theme-editor mobile preview. Physical Android/iPhone camera capture still needs device testing.

## Preview links

- Theme editor: https://admin.shopify.com/store/ebuilderz-testing-store/themes/189779640638/editor
- Finder: https://ebuilderz-testing-store.myshopify.com/pages/part-finder
- App dashboard: https://admin.shopify.com/store/ebuilderz-testing-store/apps/vacuum-pro-part-finder

The testing store is password protected. Use an authenticated storefront session or Preview from the theme editor. This theme is currently live only on the testing store.
