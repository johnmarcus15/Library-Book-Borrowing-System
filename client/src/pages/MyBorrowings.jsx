import { useState } from 'react';
import useApi from '../hooks/useApi';
import api, { errMsg } from '../services/api';
import { useToast } from '../components/Toast';
import { Badge, Empty, ErrorBox, Spinner, fmt } from '../components/ui';
const tabs = { all: ['History', () => true], active: ['Currently borrowed', (b) => b.status === 'BORROWED'],
  soon: ['Due soon', (b) => b.status === 'BORROWED' && !b.isOverdue && new Date(b.dueDate) - Date.now() <= 3 * 86400000],
  overdue: ['Overdue', (b) => b.isOverdue], returned: ['Returned', (b) => b.status === 'RETURNED'] };
export default function MyBorrowings() {
  const { data, loading, error, reload } = useApi('/borrowings/my');
  const [tab, setTab] = useState('active'); const toast = useToast();
  const [returningId, setReturningId] = useState(null);
  const giveBack = async (id) => {
    setReturningId(id);
    try {
      const res = await api.post(`/borrowings/${id}/return`);
      const fine = res.data?.data?.fineAmount;
      toast(fine > 0 ? `Book returned. Overdue fine: ₹${fine}` : 'Book returned successfully.');
      reload();
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setReturningId(null);
    }
  };
  if (loading) return <Spinner />;
  const rows = (data || []).filter(tabs[tab][1]);
  return <>
    <h1>My borrowings</h1><ErrorBox text={error} retry={reload} />
    <div className="tabs" role="tablist">{Object.entries(tabs).map(([k, [l]]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
    {rows.length ? <div className="tablewrap"><table><thead><tr><th>Book</th><th>Borrowed</th><th>Due</th><th>Returned</th><th>Status</th><th>Fine</th><th /></tr></thead><tbody>
      {rows.map((b) => <tr key={b._id}><td>{b.book?.title}</td><td>{fmt(b.borrowedAt)}</td><td>{fmt(b.dueDate)}</td><td>{fmt(b.returnedAt)}</td>
        <td>{b.isOverdue ? <Badge tone="red">Overdue {b.overdueDays}d</Badge> : b.status === 'RETURNED' ? <Badge>Returned</Badge> : <Badge tone="blue">Borrowed</Badge>}</td>
        <td>{b.fineAmount ? `₹${b.fineAmount}` : '—'}</td><td>{b.status === 'BORROWED' && <button className="btn sm" disabled={returningId === b._id} onClick={() => giveBack(b._id)}>{returningId === b._id ? 'Returning…' : 'Return'}</button>}</td></tr>)}</tbody></table></div>
      : !error && <Empty text="Nothing to show here." />}
  </>;
}
