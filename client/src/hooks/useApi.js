import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';
// Fetches GET url with params; returns { data, pagination, loading, error, reload }
export default function useApi(url, params) {
  const [state, set] = useState({ data: null, pagination: null, loading: true, error: '' });
  const key = JSON.stringify(params || {});
  const load = useCallback(async () => {
    set((s) => ({ ...s, loading: true, error: '' }));
    try { const { data } = await api.get(url, { params: JSON.parse(key) }); set({ data: data.data, pagination: data.pagination, loading: false, error: '' }); }
    catch (e) { set({ data: null, pagination: null, loading: false, error: errMsg(e) }); }
  }, [url, key]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
