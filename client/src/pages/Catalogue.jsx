import { useState } from 'react';
import useApi from '../hooks/useApi';
import api from '../services/api';
import { BookCard, Empty, ErrorBox, Pager, Spinner } from '../components/ui';
export default function Catalogue() {
  const [f, setF] = useState({ q: '', category: '', available: '', sort: 'title', page: 1 });
  const [q, setQ] = useState('');
  const [seeding, setSeeding] = useState(false);
  const { data, pagination, loading, error, reload } = useApi('/books', { ...f, limit: 12 });
  const cats = useApi('/books/categories');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v, page: 1 }));
  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.get('/seed');
      reload();
      cats.reload();
    } catch (e) {
      alert('Initialization error: ' + (e.response?.data?.message || e.message));
    } finally {
      setSeeding(false);
    }
  };
  return <>
    <h1>Book catalogue</h1>
    <form className="filters" onSubmit={(e) => { e.preventDefault(); set('q', q); }} role="search">
      <input aria-label="Search" placeholder="Title, author or ISBN" value={q} onChange={(e) => setQ(e.target.value)} />
      <select aria-label="Category" value={f.category} onChange={(e) => set('category', e.target.value)}><option value="">All categories</option>{cats.data?.map((c) => <option key={c}>{c}</option>)}</select>
      <select aria-label="Availability" value={f.available} onChange={(e) => set('available', e.target.value)}><option value="">Any availability</option><option value="true">Available</option><option value="false">Unavailable</option></select>
      <select aria-label="Sort" value={f.sort} onChange={(e) => set('sort', e.target.value)}><option value="title">Title A–Z</option><option value="recent">Recently added</option></select>
      <button className="btn">Search</button></form>
    <ErrorBox text={error} retry={reload} />
    {loading ? <Spinner /> : data?.length ? <div className="grid">{data.map((b) => <BookCard key={b._id} b={b} />)}</div> : !error && (
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <Empty text={q || f.category ? "No books match your search." : "No books in the library catalogue yet."} />
        {!q && !f.category && (
          <button className="btn" style={{ marginTop: '1rem' }} disabled={seeding} onClick={handleSeed}>
            {seeding ? 'Initializing Books...' : 'Initialize Demo Catalog (22 Books)'}
          </button>
        )}
      </div>
    )}
    <Pager p={pagination} onPage={(page) => setF((s) => ({ ...s, page }))} />
  </>;
}
