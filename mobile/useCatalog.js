import { useEffect, useRef, useState } from 'react';
import { fetchCatalogPage } from './shopify';

const empty = { items: [], loading: true };

export function useCatalog(feed, id) {
  const key = feed + '/' + (id || '');
  const cache = useRef(new Map()).current;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(empty);

  useEffect(() => {
    const previous = cache.get(key);
    if (previous?.fresh) {
      setState({ key, items: previous.items, loading: false });
      return;
    }
    const controller = new AbortController();
    let active = true;
    let timer;
    async function load() {
      const rows = new Map();
      const cursors = new Set();
      let after = null;
      setState({ key, items: previous?.items || [], loading: true });
      try {
        do {
          timer = setTimeout(() => controller.abort(), 20000);
          const page = await fetchCatalogPage(feed, id, after, controller.signal);
          clearTimeout(timer);
          if (!active) return;
          for (const row of page.nodes) rows.set(row.id, row);
          if (!page.pageInfo.hasNextPage) break;
          after = page.pageInfo.endCursor;
          if (!after || cursors.has(after)) throw new Error('Shopify returned an incomplete page. Try again.');
          cursors.add(after);
          if (!previous) setState({ key, items: [...rows.values()], loading: true });
        } while (active);
        const items = [...rows.values()];
        cache.set(key, { items, fresh: true });
        setState({ key, items, loading: false });
      } catch (err) {
        if (active) setState({
          key, items: previous?.items || [...rows.values()], loading: false,
          error: controller.signal.aborted ? 'Shopify took too long to respond. Try again.' : err.message,
        });
      } finally {
        clearTimeout(timer);
      }
    }
    load();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [feed, id, key, cache, attempt]);

  function refresh() {
    // Membership and category changes can affect multiple views.
    for (const entry of cache.values()) entry.fresh = false;
    setAttempt(value => value + 1);
  }
  return { ...(state.key === key ? state : empty), refresh };
}
