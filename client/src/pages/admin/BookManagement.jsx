import { useState } from 'react';
import useApi from '../../hooks/useApi';
import api, { errMsg } from '../../services/api';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { Empty, ErrorBox, Pager, Spinner } from '../../components/ui';
const blank = { title: '', author: '', isbn: '', category: '', publicationYear: '', totalCopies: 1, description: '' };
export default function BookManagement() {
  const [q, setQ] = useState(''); const [query, setQuery] = useState(''); const [page, setPage] = useState(1);
  const { data, pagination, loading, error, reload } = useApi('/books', { q: query, page, limit: 10 });
  const cats = useApi('/books/categories');
  const [edit, setEdit] = useState(null); const [err, setErr] = useState(''); const toast = useToast();
  const save = async (e) => {
    e.preventDefault(); setErr('');
    const body = { ...edit }; delete body._id;
    ['isbn', 'publicationYear', 'description'].forEach((k) => { if (body[k] === '' || body[k] == null) delete body[k]; });
    try {
      if (edit._id) await api.put(`/books/${edit._id}`, body); else await api.post('/books', body);
      toast('Book saved.'); setEdit(null); reload(); cats.reload();
    } catch (x) { setErr(errMsg(x)); }
  };
  const del = async (b) => {
    if (!window.confirm(`Delete "${b.title}"? Books with history are archived instead.`)) return;
    try { const { data: r } = await api.delete(`/books/${b._id}`); toast(r.message); reload(); } catch (x) { toast(errMsg(x), 'error'); }
  };
  const f = (k, l, type = 'text', extra = {}) => <label>{l}<input type={type} value={edit[k] ?? ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} {...extra} /></label>;
  return <>
    <div className="filters"><form className="row" style={{ flex: 1 }} onSubmit={(e) => { e.preventDefault(); setQuery(q); setPage(1); }}>
      <input aria-label="Search books" placeholder="Search title, author, ISBN" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} /><button className="btn">Search</button></form>
      <button className="btn" onClick={() => { setErr(''); setEdit({ ...blank }); }}>+ Add book</button></div>
    <ErrorBox text={error} retry={reload} />
    {loading ? <Spinner /> : data?.length ? <div className="tablewrap"><table><thead><tr><th>Title</th><th>Author</th><th>Category</th><th>ISBN</th><th>Total</th><th>Available</th><th>Borrowed</th><th /></tr></thead><tbody>
      {data.map((b) => <tr key={b._id}><td>{b.title}</td><td>{b.author}</td><td>{b.category}</td><td>{b.isbn || '—'}</td><td>{b.totalCopies}</td><td>{b.availableCopies}</td><td>{b.totalCopies - b.availableCopies}</td>
        <td className="row"><button className="btn sm" onClick={() => { setErr(''); setEdit({ ...b }); }}>Edit</button><button className="btn sm ghost" onClick={() => del(b)}>Delete</button></td></tr>)}</tbody></table></div> : !error && <Empty text="No books found." />}
    <Pager p={pagination} onPage={setPage} />
    {edit && <Modal title={edit._id ? 'Edit book' : 'Add book'} onClose={() => setEdit(null)}><form className="form" style={{ margin: '1rem 0 0', maxWidth: 'none' }} onSubmit={save}><ErrorBox text={err} />
      {f('title', 'Title', 'text', { required: true })}{f('author', 'Author', 'text', { required: true })}{f('isbn', 'ISBN (optional, unique)')}
      <label>Category<input list="cats" required value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /><datalist id="cats">{cats.data?.map((c) => <option key={c} value={c} />)}</datalist></label>
      {f('publicationYear', 'Publication year', 'number')}{f('totalCopies', 'Total copies', 'number', { required: true, min: 0 })}
      <label>Description<textarea rows="3" value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></label>
      <button className="btn">Save</button></form></Modal>}
  </>;
}
