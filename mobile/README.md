# Vacuum PRO mobile

The Android and iOS app opens the same Welcome screen as the HTML prototype. Continue as guest to see Home, or use the prototype's demo account flow. Home, Browse, and Find a part use the published Shopify catalog. Browse groups the two-column product cards by taxonomy category and includes collection selection. Wishlist, cart, account, and checkout are prototype interactions scoped to the open app session.

On Home, Browse, Find a part, or Search results, scroll to the top and pull down until the circular arrow turns. Release to fetch the latest Shopify products and collections. Content follows the pull with resistance, then settles beneath a compact spinner. Existing cards stay stable until the refresh completes; network failures show a retry button. Browse and Search results also retain the Refresh products button.

Metro packages the root HTML pages, their inline styles, the shared stylesheet and the local images on startup. After editing those files, restart Metro with `npm start` to regenerate the packaged screens. The native shell respects the device safe areas. Product and collection reads use the existing Storefront configuration.

The store defaults to `vacuumprollc.myshopify.com` based on the supplied admin link. If the store's permanent domain differs, set `EXPO_PUBLIC_SHOPIFY_DOMAIN` in `mobile/.env.local` to the hostname. The default request uses tokenless product access. To use a specific Headless storefront, set `EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` to its **public Storefront access token** in the same file. Expo embeds public variables in the app bundle. Keep Admin and private tokens server-side.

Shopify controls listings by storefront publication and market. Products marked Active in Admin can still be unpublished on this channel. The app issues read-only GraphQL queries. Reload the app after changing configuration.

If Shopify returns `Online Store channel is locked`, configure a public Storefront token from the store's Headless channel in `mobile/.env.local`. Tokenless access uses the locked Online Store channel. The testing store has a Headless storefront configured for this app. Restart Metro for development builds; rebuild and reinstall release builds because Expo embeds these variables at bundle time.

## Run locally

Use Node.js 22.13 or newer and npm. From the repository root, run:

```sh
cd mobile
npm install
```

- **Android** — Set up Android Studio and the Android SDK, then start an emulator or connect a device with USB debugging enabled. Run `npm run android`.
- **iOS** — On macOS with Xcode and CocoaPods installed, run `npm run ios` to use the simulator.

The platform commands generate the native project, build the development client and start Metro. For later JavaScript edits, run `npm start` and reopen the installed app. Use `npm run bundle` to check the JavaScript bundles for both platforms.

Both platforms use the development identifier `com.vacuumpro.mobile.dev`.

## Photo scanner

Find a part combines number search, camera capture and gallery upload on one screen. Scan with camera opens the camera directly; detected numbers are editable in the same search box, with inline results and a small photo preview. Android uses bundled ML Kit Latin text recognition; iOS uses Apple Vision through the local `modules/vacuum-ocr` Expo module. OCR runs on the device. A new native build is required after adding these modules; an HTML refresh cannot install them.

Detected number candidates are editable and must be checked against the label before searching. No number is silently substituted for similar OCR characters. Photos without a readable number offer retry, manual entry and fitment support. Number confirmation searches the live Shopify finder, including non-Oreck models.

Optional visual similarity uses the service in `../visual-search`. Set `EXPO_PUBLIC_VISUAL_SEARCH_URL` to its HTTPS endpoint and rebuild to enable the button. Only pressing that button sends the chosen photo to the service; normal OCR does not upload it. Similarity results require a separate model/dimension check. No hosted endpoint is currently configured.

Run `node scanner.test.cjs` for number extraction checks. The iOS OCR source is included but requires a macOS/Xcode build and device testing.

## Product detail content

Product pages include quantity selection, cart and Buy now actions, wishlist, native sharing, image thumbnails when multiple images exist, and expandable About the Product, Product Specifications, Package Includes, Why Replace This Part, and FAQs sections. Related items support their own cart and wishlist actions. Cart and checkout continue to use the prototype session flow.

Extra Storefront-readable product fields use the `custom` namespace: `product_specifications`, `package_includes`, `why_replace_this_part`, `faq`, `pack`, `feature`, `compatible_brands`, `fits_series`, and `oem_status`. Rich text is displayed as safe plain text. Existing pack/specification imports were converted to their defined types in the testing store. The default variant's pack option takes precedence over a product-level pack value. Replacement guidance can also use an existing replacement sentence from the product description.

Shipping, returns and fitment policy links use the Vacuum PRO website. Payment options and review links appear when Shopify supplies a public product URL; the current locked testing store does not supply one. The screen does not generate ratings or delivery-date estimates.
