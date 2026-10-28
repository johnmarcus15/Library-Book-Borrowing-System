import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useApi from '../../hooks/useApi';
import { ErrorBox, Spinner } from '../../components/ui';
export default function AdminDashboard() {
  const { data: d, loading, error, reload } = useApi('/admin/dashboard');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox text={error} retry={reload} />;
  const stats = [['Book titles', d.totalTitles], ['Total copies', d.totalCopies], ['Available copies', d.availableCopies], ['Borrowed copies', d.borrowedCopies], ['Members', d.members], ['Overdue', d.overdueBorrowings], ['Outstanding fines', `₹${d.outstandingFines}`]];
  return <>
    <div className="grid">{stats.map(([l, v]) => <div className="card pad stat" key={l}><strong>{v}</strong><span className="muted">{l}</span></div>)}</div>
    <h2>Borrowing activity (30 days)</h2>
    {d.borrowActivity.length ? <div className="card pad" style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={d.borrowActivity}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="_id" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="count" stroke="#0e9aa7" strokeWidth={2} /></LineChart></ResponsiveContainer></div> : <p className="muted">No borrowing activity yet.</p>}
    <h2>Books by category</h2>
    {d.byCategory.length ? <div className="card pad" style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={d.byCategory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="_id" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#0f2a4a" /></BarChart></ResponsiveContainer></div> : <p className="muted">No books yet.</p>}
  </>;
}
