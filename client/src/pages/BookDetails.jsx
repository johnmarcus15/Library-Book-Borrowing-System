import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import api, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Badge, Cover, ErrorBox, Spinner } from '../components/ui';
export default function BookDetails() {
  const { id } = useParams(); const { user } = useAuth(); const toast = useToast(); const nav = useNavigate();
  const { data: b, loading, error, reload } = useApi(`/books/${id}`);
  const [busy, setBusy] = useState(false);
  const borrow = async () => {
    setBusy(true);
    try { await api.post('/borrowings', { bookId: id }); toast('Book borrowed. See My borrowings for the due date.'); reload(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };
  if (loading) return <Spinner />;
  if (error) return <ErrorBox text={error} />;
  const rows = [['ISBN', b.isbn || '—'], ['Category', b.category], ['Publication year', b.publicationYear || '—'], ['Total copies', b.totalCopies], ['Available copies', b.availableCopies]];
  return <>
    <div style={{ margin: '1rem 0 0.5rem' }}>
      <Link to="/books" className="btn sm ghost">← Back to catalogue</Link>
    </div>
    <div className="detail"><Cover title={b.title} /><div>
      <h1>{b.title}</h1><p className="muted">by {b.author}</p>
      {b.availableCopies > 0 ? <Badge tone="green">Available</Badge> : <Badge tone="red">Unavailable</Badge>}
      <p>{b.description || 'No description available.'}</p>
      <dl className="facts">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
        {user?.role === 'MEMBER' ? <button className="btn" disabled={busy || b.availableCopies < 1} onClick={borrow}>{busy ? 'Borrowing…' : b.availableCopies < 1 ? 'Out of stock' : 'Borrow this book'}</button>
          : user?.role === 'ADMIN' ? <Link className="btn ghost" to="/admin/books">Manage in Admin Console</Link>
          : <button className="btn" onClick={() => nav('/login', { state: { from: `/books/${id}` } })}>Login to borrow</button>}
      </div>
    </div></div>
  </>;
}
