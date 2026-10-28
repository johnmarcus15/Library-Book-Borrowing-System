import { Link } from 'react-router-dom';
import { BookOpen, AlertTriangle, Clock } from 'lucide-react';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { Badge, Empty, ErrorBox, Spinner, fmt } from '../components/ui';
export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi('/borrowings/my');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox text={error} retry={reload} />;
  const active = data.filter((b) => b.status === 'BORROWED');
  const overdue = active.filter((b) => b.isOverdue);
  const soon = active.filter((b) => !b.isOverdue && new Date(b.dueDate) - Date.now() <= 3 * 86400000);
  const stats = [[BookOpen, 'Currently borrowed', active.length], [Clock, 'Due within 3 days', soon.length], [AlertTriangle, 'Overdue', overdue.length]];
  const totalFine = active.reduce((sum, b) => sum + (b.fineAmount || 0), 0);
  return <>
    <h1>Welcome, {user.name}</h1>
    <div className="grid">{stats.map(([I, l, n]) => <div className="card pad stat" key={l}><I className="accent" /><strong>{n}</strong><span className="muted">{l}</span></div>)}</div>
    {totalFine > 0 && <div className="alert" role="alert" style={{ margin: '1rem 0' }}>You have ₹{totalFine} in outstanding overdue fines. Please return your overdue books to prevent further charges.</div>}
    <div className="row" style={{ margin: '1rem 0' }}><Link className="btn" to="/books">Search the catalogue</Link><Link className="btn ghost" to="/my-borrowings">Manage borrowings</Link></div>
    <h2>Recent history</h2>
    {data.length ? <div className="tablewrap"><table><thead><tr><th>Book</th><th>Borrowed</th><th>Due</th><th>Status</th></tr></thead><tbody>
      {data.slice(0, 5).map((b) => <tr key={b._id}><td>{b.book?.title}</td><td>{fmt(b.borrowedAt)}</td><td>{fmt(b.dueDate)}</td>
        <td>{b.isOverdue ? <Badge tone="red">Overdue</Badge> : b.status === 'RETURNED' ? <Badge>Returned</Badge> : <Badge tone="blue">Borrowed</Badge>}</td></tr>)}</tbody></table></div>
      : <Empty text="You have not borrowed any books yet." />}
  </>;
}
