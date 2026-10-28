import { useState } from 'react';
import useApi from '../../hooks/useApi';
import api, { errMsg } from '../../services/api';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { Badge, Empty, ErrorBox, Pager, Spinner, fmt } from '../../components/ui';
function History({ id, onClose }) {
  const { data, loading, error } = useApi(`/admin/users/${id}`);
  return <Modal title={data ? `${data.user.name} · borrowing history` : 'Borrowing history'} onClose={onClose}>
    {loading ? <Spinner /> : error ? <ErrorBox text={error} /> : data.borrowings.length ? <div className="tablewrap"><table><thead><tr><th>Book</th><th>Borrowed</th><th>Due</th><th>Returned</th><th>Fine</th></tr></thead><tbody>
      {data.borrowings.map((b) => <tr key={b._id}><td>{b.book?.title}</td><td>{fmt(b.borrowedAt)}</td><td>{fmt(b.dueDate)}</td><td>{b.returnedAt ? fmt(b.returnedAt) : b.overdueDays > 0 ? <Badge tone="red">Overdue {b.overdueDays}d</Badge> : 'Out'}</td><td>{b.fineAmount ? `₹${b.fineAmount}` : '—'}</td></tr>)}</tbody></table></div> : <Empty text="No borrowings." />}</Modal>;
}
export default function MemberManagement() {
  const [q, setQ] = useState(''); const [query, setQuery] = useState(''); const [page, setPage] = useState(1); const [view, setView] = useState(null); const toast = useToast();
  const { data, pagination, loading, error, reload } = useApi('/admin/users', { q: query, page });
  const toggle = async (u) => {
    try { await api.patch(`/admin/users/${u._id}/status`, { isActive: !u.isActive }); toast(u.isActive ? 'Member deactivated.' : 'Member activated.'); reload(); } catch (x) { toast(errMsg(x), 'error'); }
  };
  return <>
    <form className="filters" onSubmit={(e) => { e.preventDefault(); setQuery(q); setPage(1); }}><input aria-label="Search members" placeholder="Name, email or register number" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn">Search</button></form>
    <ErrorBox text={error} retry={reload} />
    {loading ? <Spinner /> : data?.length ? <div className="tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Register no.</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>
      {data.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.studentId || '—'}</td><td>{u.role}</td><td>{u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</td>
        <td className="row"><button className="btn sm" onClick={() => setView(u._id)}>History</button>{u.role === 'MEMBER' && <button className="btn sm ghost" onClick={() => toggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>}</td></tr>)}</tbody></table></div> : !error && <Empty text="No members found." />}
    <Pager p={pagination} onPage={setPage} />{view && <History id={view} onClose={() => setView(null)} />}
  </>;
}
