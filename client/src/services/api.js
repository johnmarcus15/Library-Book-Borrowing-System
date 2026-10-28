import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true });
export const errMsg = (e) => {
  const d = e.response?.data;
  if (d?.details?.length) return d.details.map((x) => x.message).join(', ');
  return d?.message || 'Network error. Is the server running?';
};
export default api;
