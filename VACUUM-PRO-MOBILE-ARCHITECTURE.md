# Vacuum PRO mobile app

**Product and engineering specification · iOS and Android · 26 November 2026**

This document describes the proposed production app. [The HTML prototype](./index.html) is a screen and interaction reference. Its catalog prices, accounts, payments, orders, wishlist state and tracking previews are demo data. It does not submit purchases or perform production image recognition.

## 1. Goal

Help customers identify the correct vacuum part, verify it against their exact model, and buy it through the same Vacuum PRO Shopify store used by the website. The app should let a customer start with a manufacturer part number, a vacuum model, a keyword, or a photo of a model or part label. Finding a plausible item and verifying fit are distinct customer decisions. The app should show what was matched and ask for clarification when the evidence is incomplete.

Primary outcomes are successful part identification and purchase. Track fitment precision, verified coverage, no-match and manual-fallback rates, part-related return reasons, and the share of carts that reach a completed checkout. Establish a baseline during the pilot before setting commercial targets.

### Release scope

| In v1 | Deferred or conditional |
| --- | --- |
| Product and category browsing, part search, label photo OCR, product details and fitment guidance | Identifying an unlabelled part purely from its shape or a photo of a whole vacuum |
| Guest shopping and checkout, signed-in order history and saved addresses, wishlist | Cross-channel cart and wishlist sync unless separately approved |
| Shopify-hosted checkout presented through Checkout Kit, confirmation, order details and available tracking links | Custom payments, carrier aggregation, a public order lookup form, customer-facing admin |
| Returns and support entry points with published policy and contact paths | Self-service RMA, return labels and refunds unless approved for a later release |
| Checkout and fulfillment analytics, crash reporting and store release QA | Push as an optional extension after the identity and consent gate below |

## 2. What is verified and what needs a decision

| Area | Store evidence and implication |
| --- | --- |
| Commerce | Vacuum PRO uses Shopify. In the admin review, guest checkout was enabled. Keep it available in the app and recheck it in the release environment. |
| Accounts | Admin showed **legacy customer accounts** and a Shopify deprecation banner. Confirm the production account strategy before implementing sign-in. The prototype’s email/password form does not determine the production auth flow. |
| Payment | A live desktop checkout showed credit card, PayPal and Affirm, plus Shop Pay, PayPal and Google Pay in express checkout. Device, market, cart and checkout eligibility affect what is offered. Use what Shopify returns. Verify iOS and Android separately. |
| Delivery | The store documents US standard shipping and eligible local pickup in Stafford, Virginia. Rates, taxes, eligibility and final totals come from checkout. |
| Fitment | Admin review found a Vacuum Model definition and product compatibility data exposed to Storefront. Audit model identifiers, variants, source evidence and mapping coverage before relying on these records for verified fit. |
| Search and apps | Searchanise was active on the live theme. Judge.me, AC Questions & Answers and bundle apps were observed. Website widgets do not automatically appear in the native app. Audit mobile API access, licensing and checkout behavior before promising parity. |
| Tracking | Admin showed a hidden Order Lookup page. Its public URL redirected to Contact. No dedicated parcel-tracking app was identified in the installed list reviewed. The Shopify shipping-confirmation preview showed **View your order**, **Track order with Shop** and carrier tracking. Build around those verified entry points. |

## 3. System architecture

One Shopify store is the system of record for catalog, variants, prices, inventory, customers, orders, payments and fulfillment. The mobile backend owns app-specific data such as wishlist entries and operational records. A search index is a rebuildable copy of approved fitment and catalog data. Shopify Admin remains the operations console.

~~~mermaid
flowchart LR
  U["Customer"] --> RN["Expo + React Native app"]
  W["Vacuum PRO web store"] --> S["One Shopify store"]
  RN --> SF["Storefront API: catalog and cart"]
  RN --> AUTH["Shopify customer authentication and account APIs"]
  RN --> KIT["Checkout Kit: hosted checkout"]
  RN --> API["Vacuum PRO mobile backend"]
  SF --> S
  AUTH --> S
  KIT --> S
  API --> IDX["Fitment index"]
  API --> DB["App database"]
  API --> OCR["OCR service"]
  S -->|"Signed webhooks"| API
  API -->|"Reconcile and refresh"| S
  S --> MAIL["Shipping email and order status"]
  MAIL --> TRACK["Shop or carrier tracking"]
~~~

| Component | Responsibilities |
| --- | --- |
| React Native app | Navigation, accessible UI, camera or photo selection, search and cart interactions, local guest state, Checkout Kit, external-link handoffs. Use Expo development builds and validate the native dependency matrix before committing to package versions. |
| Shopify Storefront API | Published catalog and variant availability, cart lines, buyer country and identity as supported, discounts and checkout URL. |
| Shopify customer accounts | Authentication and customer-scoped order access. Use authorized account data to show order history and fulfillment. |
| Mobile backend | Fitment lookup, bounded OCR requests, wishlist persistence, Shopify webhook intake, protected access to admin-side operations, rate limits and observability. Start with one deployable service and one managed relational database. |
| Fitment index | Normalized exact identifiers, aliases and approved compatibility references. Start with indexed relational queries. Add external search only if discovery proves it is required or offers verified reuse. |
| Shopify Checkout Kit | Displays the store checkout inside the app. Shopify determines payment methods, address eligibility, tax, discounts and checkout totals. Some provider flows can hand off to a browser or app. |

### Data ownership

| Entity | System of record and key |
| --- | --- |
| Product and variant | Shopify global IDs. Manufacturer part number and merchant SKU are distinct fields. |
| Vacuum model and approved fitment | Proposed Shopify model metaobjects and product or variant mappings. Fitment owner maintains source and approval. Backend indexes a publishable projection. |
| Customer | Shopify customer ID. Backend binds sessions and account wishlist to that stable identifier. |
| Cart | Shopify cart ID. App remembers its current cart securely. Website cart stays independent in v1. |
| Wishlist | Local storage for guests and backend for signed-in customers. Merge by variant ID on sign-in and deduplicate. Define removal and sync behavior before release. |
| Order and fulfillment | Shopify order and fulfillment IDs. Customer sees only authorized orders. Tracking may be absent or split across multiple shipments. |
| Photo and OCR | Transient backend processing. No long-term image storage by default. Set and test a deletion deadline if queued processing needs temporary storage. |

## 4. Customer workflows

### Browse and find a part

1. Home opens with categories, product cards and the central **Find a part** action. The bottom navigation contains Home, Wishlist, Find a part, Cart and Account.
2. Search accepts manufacturer part number, model, brand and keyword. Normalize case, separators and whitespace while preserving the submitted query. Try an exact part number first, then an exact model or approved alias, then keyword suggestions.
3. Results show the match reason, applicable model when known and a way to change the query. A matching part number identifies a product and does not certify fit against an unspecified vacuum.
4. Product detail shows image, part number, variant, pack size, availability, price and fitment guidance. Show saved state and the Add to cart action. Related parts use category or brand relevance and require their own fitment check.
5. Product and category links open the corresponding app screen when possible. Handle unavailable or unpublished products with an explanation and a search recovery path.

### Scan a label

~~~mermaid
flowchart TD
  A["Choose a model label or part photo"] --> B["Validate file and run OCR"]
  B --> C{"Readable identifier?"}
  C -->|"Yes"| D["Customer confirms or edits identifier"]
  C -->|"No"| E["Retake, enter number or get help"]
  D --> F{"Approved exact fitment evidence?"}
  F -->|"Yes"| G["Show verified compatible parts"]
  F -->|"Ambiguous"| H["Ask for full model or show possible matches"]
  F -->|"None"| I["No verified match and support path"]
~~~

Validate type and size on both device and backend. Strip location metadata before processing where feasible. Accept only supported image formats and make the manual search path available throughout. Return OCR candidates and confidence separately from look-up status. A high OCR score never upgrades an uncertain fitment mapping. Do not add a suggestion to cart automatically. If network or OCR fails, keep the manual entry path usable.

### Checkout and confirmation

~~~mermaid
sequenceDiagram
  participant C as Customer
  participant A as Mobile app
  participant S as Shopify
  participant K as Checkout Kit
  C->>A: Add variant and choose checkout
  A->>S: Update cart and obtain checkout URL
  S-->>A: Cart state and checkout URL
  A->>K: Present Shopify checkout
  C->>K: Contact, delivery and payment
  K->>S: Submit checkout
  S-->>K: Checkout outcome
  K-->>A: Completion, failure or dismissal
  A-->>C: Confirmation or recoverable cart
~~~

- Guests proceed without sign-in. Signed-in shoppers can use checkout identity and saved details where the chosen Shopify account flow supports it.
- Display cart prices as estimates until checkout determines the final amounts. Validate shipping and pickup with real test carts and supported US addresses. Never hardcode the prototype’s test card, totals or checkout steps.
- Clear the cart only after confirmed completion. Dismissal, delay, offsite provider handoff and failure are not success. Do not create a second Shopify order in the backend when processing the completion callback.
- After success, show order confirmation and a dismissible, reduced-motion-friendly success treatment. Handle duplicate callbacks once. Reconcile late outcomes with Shopify and make order history reflect authoritative state.

### Order history, tracking and returns

Signed-in customers see their own order history and details. Show statuses, quantities and fulfillment groups separately. For a shipped order with tracking, show available carrier, tracking number and the authorized tracking URL. If multiple packages exist, render each shipment with its own details. For processing orders or missing tracking, explain the current state and offer support.

Use the Shopify order-status or carrier link when available. The shipping email provides the verified handoff, including **Track order with Shop** when configured. Shop is an external experience and can match eligible orders using the checkout email. Do not attach invented dates, carrier updates or demo numbers to production orders. Guest shoppers use the confirmation or shipping email and can contact support if the link is missing.

For v1 returns, show the store’s current returns policy and a contact path from the order. Pre-fill the order reference only after the shopper chooses to contact support. The store handles eligibility and RMA authorization. Keep support accessible for guests and customers with no order yet.

## 5. Fitment quality and data stewardship

**Proposed data owner: Deepak**, pending stakeholder confirmation. Before implementation starts, confirm that he can approve mapping changes or name the Vacuum PRO catalog specialist accountable for them. Engineering owns import, index freshness and monitoring. The data owner approves source evidence and corrections. Support can flag disputes with the exact model, part, evidence and order reference if applicable.

Minimum data per approved record: canonical model and brand, model aliases, Shopify product and variant IDs as applicable, manufacturer part number, relationship status, source reference, verification date and reviewer. Model suffixes and variant exclusions must be explicit. Unknown records stay unknown. Conflicting evidence goes to manual review and remains out of verified results.

### Proposed pilot acceptance gates

Measure these on a labelled set of **at least 100 distinct queries** across **20–30 real parts**, including at least **25** negative or ambiguous cases. Include exact numbers, model variants, typographic separators, noisy photos, conflicting aliases and wrong-brand collisions. Reserve examples outside the set used to tune lookup rules.

| Measure | Proposed gate |
| --- | --- |
| Exact known part-number lookup | At least 98% correct top result on eligible cases |
| Verified-fit precision | At least 99% of returned verified matches correct, with zero false verified fits on the negative or ambiguous set |
| Verified-fit coverage | At least 90% of eligible, independently labelled model-to-part cases return a verified result |
| Clear-label OCR | At least 90% exact identifier extraction on readable pilot photos |
| Ambiguous or unreadable photo handling | 100% of test cases below the agreed confidence or evidence rule offer edit, retry or manual search without a verified-fit claim |

Report denominators, raw counts and exclusions. These are proposed acceptance criteria, not observed performance. Expand the test set as catalog coverage grows. Hold the verified-fit label if a critical false positive appears in the pilot.

## 6. Integration contracts

These are proposed backend contracts. Pin the Shopify API version and confirm available scopes and fields against the actual store during discovery.

| Operation | Input | Output or expected behavior |
| --- | --- | --- |
| POST /v1/fitment/search | Query, optional brand and selected model | Normalized query, match type, evidence state, ordered variant IDs and request ID |
| POST /v1/fitment/scan | Bounded multipart image | Candidate text, confidence, actionable unreadable or unavailable result |
| GET /v1/wishlist | Authenticated session | Saved variant IDs and update time |
| PUT /v1/wishlist/items/{variantId} | Authenticated session | Idempotently save one variant |
| DELETE /v1/wishlist/items/{variantId} | Authenticated session | Idempotently remove one variant |
| POST /v1/webhooks/shopify | Raw request and Shopify headers | Verify signature, record delivery ID, enqueue and acknowledge, then process asynchronously |

Use Shopify events for catalog and relevant order or fulfillment changes. Reconcile via a scheduled job to recover from missed or out-of-order events. Deduplicate deliveries, retry transient failures with backoff and monitor a dead-letter queue. Make projections idempotent and rebuildable. For account and fulfillment views use customer-scoped APIs when available. Any Admin API fallback must happen server-side and enforce ownership before returning data.

### Accounts, guest checkout and push dependency

Prefer Shopify’s supported customer-account architecture for a new app if storefront migration is approved. Validate account migration and the checkout identity handoff in a dev store before changing the live storefront. If the project must remain on legacy accounts temporarily, prove the supported signup, recovery, order access and checkout behavior on that path, and record the migration plan. Implement the chosen flow with Shopify-supported mobile authentication and secure device token storage. Never ship an Admin token or collect card details in app code.

Push needs a device token, permission, customer association and a trusted order-to-customer mapping. Signed-in order push can be added after those are verified. Guest checkout remains eligible without push permission. Guest shipment updates use Shopify email in v1. Guest push requires an approved, verified order-claim flow and consent model. Sign-out must remove the device association for private order notifications. Back-in-stock push depends on inventory events, consent and a maintained subscription, and is deferred unless approved.

### Third-party parity

| Integration | Implementation decision |
| --- | --- |
| Searchanise | Check API access and terms, portable ranking, index coverage and latency. Reuse only if fitment acceptance gates pass. |
| Judge.me and AC Q&A | Check supported read/write APIs and moderation. Include only approved experiences with verified data access. |
| Bundlex and Shopify Bundles | Validate line-item behavior, discounts, fulfillment and inventory end to end. Hide unsupported offers or provide a verified path for them. |
| Checkout providers | Test against actual offers for each platform and market. Verify return from external provider flows. |
| Shop and shipping notifications | Use authorized Shopify and carrier links. No public Track Order form is assumed. |
| Wholesale or B2B | Deferred. Keep customer IDs, variants and pricing context explicit so adding a company buyer later is possible. |

## 7. Security, accessibility and operations

- Store server secrets in managed secret storage and restrict Shopify scopes. Validate sessions and resource ownership server-side. Verify webhooks using raw-body signature checks and use separate credentials by environment.
- Rate-limit search and OCR, constrain upload types and sizes, and keep raw photos, OCR text, tokens, addresses and payment information out of analytics and logs.
- Define retention, deletion and consent before launch. Account deletion handling must cover app-owned data and explain how store-managed information is handled. Verify the applicable App Store and Google Play requirements during release preparation.
- Support screen readers, dynamic text, sufficient contrast, touch targets and reduced motion. Verify all states with real iOS and Android devices, including slower networks.
- Track consent-aware funnel events including search, scan outcome, result selection, verified fit, add to cart, checkout start and confirmed purchase. Deduplicate purchase events. Use aggregate logs for OCR failure, index lag, cart errors, provider handoffs and webhook backlog.
- Set up development, staging and production environments, CI builds, crash reporting, release signing and rollback procedures. Assign ownership for app incidents, catalog corrections and customer support before public release.

## 8. Build sequence and acceptance

| Phase | Deliverable and exit gate |
| --- | --- |
| Discovery | Confirm fitment owner and data source, sample mappings, account path, checkout plan and providers, third-party dependencies, returns scope, guest push boundary and release environment. |
| Foundation | Build iOS and Android app shells, configure test Shopify access, publish catalogue views, implement navigation, product detail and error states. |
| Core shopping | Ship exact search, fitment, OCR fallback, cart, Checkout Kit, account order access and support handoffs. Validate complete checkout in a test environment. |
| Beta and hardening | Validate privacy, accessibility, device matrix, order tracking, release telemetry and incident procedures. Use TestFlight and Google Play testing before production rollout. |

Release checks include guest and signed-in orders, checkout cancellation and return, sold-out variants, changed prices, bundle lines, iOS and Android payment availability, local pickup eligibility, split shipments, stale tracking, incorrect fitment, unreadable photos, offline retry, and direct product links. Separate Shopify test orders from production orders.

### Decisions to close before build

1. Confirm the named fitment owner and which Shopify records are authoritative for compatibility.
2. Decide whether to migrate to newer customer accounts before v1, including web impact and rollback.
3. Verify the production payment and delivery matrix on both platforms and decide which bundle offers are supported.
4. Approve the proposed v1 support-assisted returns scope and the owner for escalations.
5. Decide whether push is in launch scope. Keep the guest order-claim dependency explicit either way.
6. Confirm which storefront integrations and cross-channel sync behavior are required at launch.

## References

- [Shopify mobile checkout and Checkout Kit](https://shopify.dev/docs/storefronts/mobile/checkout-kit)
- [Shopify Customer Account API](https://shopify.dev/docs/api/customer)
- [Shopify webhooks](https://shopify.dev/docs/apps/build/webhooks)
- [Shopify delivery tracking with Shop](https://help.shopify.com/en/manual/online-sales-channels/shop/delivery-tracking)
- [Vacuum PRO shipping policy](https://www.vacuumpro.com/pages/shipping-policy)
- [Vacuum PRO contact and tracking FAQ](https://www.vacuumpro.com/pages/contact)
- [Vacuum PRO returns policy](https://www.vacuumpro.com/pages/returns-refunds)

