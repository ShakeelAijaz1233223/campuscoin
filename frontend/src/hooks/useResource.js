import { useCallback, useEffect, useRef, useState } from 'react';

/** Small shared query layer: cancellation, search debounce and mutation invalidation. */
export default function useResource(api, params = {}) {
  const key = JSON.stringify(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const current = useRef(api);
  current.current = api;
  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const query = JSON.parse(key);
    setLoading(true);
    setError(null);
    const timer = setTimeout(
      () => {
        current.current
          .list(query, controller.signal)
          .then((result) => {
            if (!controller.signal.aborted) setData(result);
          })
          .catch((reason) => {
            if (!controller.signal.aborted) setError(reason);
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      query.q ? 200 : 0
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, version, api]);

  useEffect(() => {
    let timer;
    // Coalesce related writes; the next read always goes back to the API.
    const changed = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 80);
    };
    window.addEventListener('data-changed', changed);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('data-changed', changed);
    };
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    items: Array.isArray(data) ? data : data?.items || []
  };
}
