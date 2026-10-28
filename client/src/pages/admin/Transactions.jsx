import { useState } from 'react';
import useApi from '../../hooks/useApi';
import api, { errMsg } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Badge, Empty, ErrorBox, Pager, Spinner, fmt } from '../../components/ui';
export default function Transactions() {
  const [q, setQ] = useState(''); const [f, setF] = useState({ q: '', status: '', overdue: '', page: 1 }); const toast = useToast();
  const { data, pagination, loading, error, reload } = useApi('/admin/borrowings', f);
  const members = useApi('/admin/users', { limit: 100 }); const books = useApi('/books', { available: 'true', limit: 50 });
  const [issue, setIssue] = useState({ userId: '', bookId: '' });
  const [issuing, setIssuing] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const doIssue = async (e) => {
    e.preventDefault();
    setIssuing(true);
    try { await api.post('/admin/borrowings', issue); toast('Book issued successfully.'); setIssue({ userId: '', bookId: '' }); reload(); books.reload(); }
    catch (x) { toast(errMsg(x), 'error'); } finally { setIssuing(false); }
  };
  const giveBack = async (id) => {
    setReturningId(id);
    try {
      const res = await api.post(`/borrowings/${id}/return`);
      const fine = res.data?.data?.fineAmount;
      toast(fine > 0 ? `Return processed. Overdue fine: ₹${fine}` : 'Return processed.');
      reload(); books.reload();
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setReturningId(null);
    }
  };
  return <>
    <form className="card pad row" onSubmit={doIssue} aria-label="Issue a book">
      <select required aria-label="Member" value={issue.userId} onChange={(e) => setIssue({ ...issue, userId: e.target.value })}><option value="">Select member</option>{members.data?.filter((u) => u.role === 'MEMBER' && u.isActive).map((u) => <option key={u._id} value={u._id}>{u.name} ({u.studentId})</option>)}</select>
      <select required aria-label="Book" value={issue.bookId} onChange={(e) => setIssue({ ...issue, bookId: e.target.value })}><option value="">Select available book</option>{books.data?.map((b) => <option key={b._id} value={b._id}>{b.title} ({b.availableCopies} available)</option>)}</select>
      <button className="btn" disabled={issuing}>{issuing ? 'Issuing…' : 'Issue book'}</button></form>
    <form className="filters" style={{ marginTop: '1rem' }} onSubmit={(e) => { e.preventDefault(); setF({ ...f, q, page: 1 }); }}>
      <input aria-label="Search transactions" placeholder="Member, register no. or book" value={q} onChange={(e) => setQ(e.target.value)} />
      <select aria-label="Filter" value={f.overdue ? 'overdue' : f.status} onChange={(e) => setF({ ...f, page: 1, status: e.target.value === 'overdue' ? '' : e.target.value, overdue: e.target.value === 'overdue' ? 'true' : '' })}>
        <option value="">All</option><option value="BORROWED">Borrowed</option><option value="RETURNED">Returned</option><option value="overdue">Overdue</option></select><button className="btn">Search</button></form>
    <ErrorBox text={error} retry={reload} />
    {loading ? <Spinner /> : data?.length ? <div className="tablewrap"><table><thead><tr><th>Member</th><th>Book</th><th>Borrowed</th><th>Due</th><th>Returned</th><th>Status</th><th>Fine</th><th /></tr></thead><tbody>
      {data.map((b) => <tr key={b._id}><td>{b.user?.name} <span className="muted">{b.user?.studentId}</span></td><td>{b.book?.title}</td><td>{fmt(b.borrowedAt)}</td><td>{fmt(b.dueDate)}</td><td>{fmt(b.returnedAt)}</td>
        <td>{b.isOverdue ? <Badge tone="red">Overdue {b.overdueDays}d</Badge> : b.status === 'RETURNED' ? <Badge>Returned</Badge> : <Badge tone="blue">Borrowed</Badge>}</td><td>{b.fineAmount ? `₹${b.fineAmount}` : '—'}</td>
        <td>{b.status === 'BORROWED' && <button className="btn sm" disabled={returningId === b._id} onClick={() => giveBack(b._id)}>{returningId === b._id ? 'Processing…' : 'Process return'}</button>}</td></tr>)}</tbody></table></div> : !error && <Empty text="No transactions found." />}
    <Pager p={pagination} onPage={(page) => setF({ ...f, page })} />
  </>;
}
