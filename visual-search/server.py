"""Index Shopify photos once, then compare uploaded photos with CLIP embeddings."""
import io
import json
import os
from pathlib import Path
import sys
import threading

import numpy as np
from PIL import Image, ImageOps
import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool

ROOT = Path(__file__).parent
MODEL = 'openai/clip-vit-base-patch32'
app = FastAPI()
lock = threading.Lock()
encoder = None


def embedding(data):
    global encoder
    import torch
    from transformers import CLIPModel, CLIPProcessor
    with Image.open(io.BytesIO(data)) as source:
        if source.width * source.height > 20_000_000:
            raise ValueError('Photo is too large. Choose a smaller image.')
        image = ImageOps.exif_transpose(source).convert('RGB')
    with lock, torch.inference_mode():
        if encoder is None:
            encoder = (CLIPModel.from_pretrained(MODEL).eval(), CLIPProcessor.from_pretrained(MODEL))
        model, processor = encoder
        vector = model.get_image_features(**processor(images=image, return_tensors='pt')).numpy()[0]
        return vector / np.linalg.norm(vector)


def index_catalog():
    domain = os.environ['SHOPIFY_DOMAIN']
    token = os.environ['SHOPIFY_STOREFRONT_TOKEN']
    if not domain.endswith('.myshopify.com') or '/' in domain:
        raise ValueError('Use the store myshopify.com domain')
    query = '''query($after:String){products(first:40,after:$after){nodes{id images(first:6){nodes{url}}} pageInfo{hasNextPage endCursor}}}'''
    after, rows, vectors = None, [], []
    while True:
        response = requests.post(f'https://{domain}/api/2026-10/graphql.json', headers={'X-Shopify-Storefront-Access-Token':token}, json={'query':query,'variables':{'after':after}}, timeout=30)
        response.raise_for_status()
        page = response.json()
        if page.get('errors'):
            raise ValueError('Shopify could not return catalog images')
        page = page['data']['products']
        for product in page['nodes']:
            for image in product['images']['nodes']:
                # Only Shopify-hosted catalog images are fetched by this service.
                from urllib.parse import urlparse
                url = urlparse(image['url'])
                if url.scheme != 'https' or url.hostname != 'cdn.shopify.com':
                    continue
                photo = requests.get(image['url'], timeout=30)
                photo.raise_for_status()
                vectors.append(embedding(photo.content))
                rows.append(product['id'])
        if not page['pageInfo']['hasNextPage']:
            break
        cursor = page['pageInfo']['endCursor']
        if not cursor or cursor == after:
            raise ValueError('Incomplete Shopify catalog page')
        after = cursor
    if not rows:
        raise ValueError('No published catalog images found')
    np.savez(ROOT / 'index.npz', vectors=np.asarray(vectors), ids=np.asarray(rows), model=MODEL)
    print(f'Indexed {len(rows)} images across {len(set(rows))} products')


def find_similar(data):
    if not (ROOT / 'index.npz').exists():
        raise HTTPException(503, 'Catalog photo search is being prepared. Search by number for now.')
    with np.load(ROOT / 'index.npz') as index:
        if str(index['model']) != MODEL:
            raise HTTPException(503, 'Catalog image index needs rebuilding.')
        scores = index['vectors'] @ embedding(data)
        ids, seen = [], set()
        for position in np.argsort(-scores):
            product = str(index['ids'][position])
            if product not in seen:
                seen.add(product)
                ids.append(product)
            if len(ids) == 5:
                break
    return {'ids': ids}


@app.post('/visual-search')
async def search(request: Request):
    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > 5_000_000:
            raise HTTPException(413, 'Choose a photo smaller than 5 MB.')
    try:
        return await run_in_threadpool(find_similar, bytes(data))
    except HTTPException:
        raise
    except (OSError, ValueError):
        raise HTTPException(400, 'Could not read this photo. Choose a clear JPG or PNG.')


if __name__ == '__main__' and sys.argv[1:] == ['index']:
    index_catalog()
