# Vacuum PRO mobile

The Android and iOS app opens the same Welcome screen as the HTML prototype. Continue as guest to see Home, or use the prototype's demo account flow. Home, Browse, and Find a part use the published Shopify catalog. Browse groups the two-column product cards by taxonomy category and includes collection selection. Wishlist, cart, account, and checkout are prototype interactions scoped to the open app session.

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
