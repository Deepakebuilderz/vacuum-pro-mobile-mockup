# Part photo matching

This service compares photos with published Shopify catalog images using pretrained CLIP. Results are suggestions, never a compatibility decision. It does not store uploaded photos.

Use Python 3.11 or newer in a virtual environment, then install `requirements.txt`. The first index run downloads the pretrained model from Hugging Face.

Set `SHOPIFY_DOMAIN` and `SHOPIFY_STOREFRONT_TOKEN` in the service environment. Use the same store/public Storefront access as the mobile app, without committing credentials.

From this directory:

```sh
python server.py index
uvicorn server:app --host 127.0.0.1 --port 8000
```

Re-run indexing after product images are added, removed or changed. Check suggestions against real customer photos (different lighting, angles and backgrounds) before launch. A visually similar belt or filter may have completely different dimensions.

To enable the app button, deploy behind an HTTPS reverse proxy with request limits, rate limiting and bounded concurrency, then set `EXPO_PUBLIC_VISUAL_SEARCH_URL=https://YOUR_HOST/visual-search` in `mobile/.env.local` and rebuild the app. There is no hosted endpoint configured in this repository; until it exists, the app explains that photo matching is not connected and offers number search or fitment help.

Do not expose the development Uvicorn port directly to the internet. The model and index are loaded on the server; Shopify access tokens are not sent with photo requests.
