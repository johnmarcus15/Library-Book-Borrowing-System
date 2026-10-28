import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useApi from '../../hooks/useApi';
import { downloadCsv } from '../../utils/csv';
import { Empty, ErrorBox, Spinner, fmt } from '../../components/ui';
const Table = ({ head, rows }) => rows.length ? <div className="tablewrap"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div> : <Empty text="No data yet." />;
export default function Reports() {
  const { data: d, loading, error, reload } = useApi('/admin/reports');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox text={error} retry={reload} />;
  const csvBtn = (name, rows, cols) => <button className="btn sm ghost" onClick={() => downloadCsv(name, rows, cols)} disabled={!rows.length}>Export CSV</button>;
  return <>
    <div className="card pad stat"><strong>₹{d.outstandingFines}</strong><span className="muted">Outstanding fines</span></div>
    <div className="row between"><h2>Most borrowed books</h2>{csvBtn('most-borrowed', d.mostBorrowed, [['Title', (r) => r.title], ['Author', (r) => r.author], ['Times borrowed', (r) => r.count]])}</div>
    {d.mostBorrowed.length > 0 && <div className="card pad" style={{ height: 240 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={d.mostBorrowed}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="title" fontSize={10} interval={0} tickFormatter={(t) => t.slice(0, 12)} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#0e9aa7" /></BarChart></ResponsiveContainer></div>}
    <div className="row between"><h2>Overdue books</h2>{csvBtn('overdue', d.overdue, [['Member', (r) => r.user?.name], ['Register no.', (r) => r.user?.studentId], ['Book', (r) => r.book?.title], ['Due', (r) => fmt(r.dueDate)], ['Days overdue', (r) => r.overdueDays], ['Fine', (r) => r.fineAmount]])}</div>
    <Table head={['Member', 'Book', 'Due', 'Days', 'Fine']} rows={d.overdue.map((r) => [r.user?.name, r.book?.title, fmt(r.dueDate), r.overdueDays, `₹${r.fineAmount}`])} />
    <div className="row between"><h2>Member activity</h2>{csvBtn('member-activity', d.memberActivity, [['Name', (r) => r.name], ['Register no.', (r) => r.studentId], ['Borrowings', (r) => r.count]])}</div>
    <Table head={['Member', 'Register no.', 'Borrowings']} rows={d.memberActivity.map((r) => [r.name, r.studentId, r.count])} />
    <h2>Borrowing activity (90 days)</h2><Table head={['Date', 'Borrowings']} rows={d.borrowingActivity.map((r) => [r._id, r.count])} />
  </>;
}
