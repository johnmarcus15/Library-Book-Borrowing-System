import { Link } from 'react-router-dom';
import { Search, Clock, ShieldCheck, BookMarked } from 'lucide-react';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { BookCard, Spinner } from '../components/ui';
const features = [[Search, 'Smart search', 'Find books by title, author or ISBN.'], [Clock, 'Due-date tracking', 'See what is due soon or overdue.'], [ShieldCheck, 'Secure accounts', 'Role-based access for members and librarians.'], [BookMarked, 'Live availability', 'Copy counts update as books are issued and returned.']];
export default function Landing() {
  const { user } = useAuth();
  const { data, loading } = useApi('/books', { sort: 'recent', limit: 4 });
  return <>
    <section className="hero"><h1>Your college library, online.</h1><p>Search the catalogue, borrow books and track due dates in one place.</p>
      <div className="row">
        <Link className="btn lg" to="/books"><Search size={16} /> Search books</Link>
        {user?.role === 'MEMBER' ? <Link className="btn lg ghost" to="/dashboard">Member Dashboard</Link>
          : user?.role === 'ADMIN' ? <Link className="btn lg ghost" to="/admin">Admin Console</Link>
          : <Link className="btn lg ghost" to="/register">Join the library</Link>}
      </div></section>
    <h2>Recently added</h2>{loading ? <Spinner /> : <div className="grid">{data?.map((b) => <BookCard key={b._id} b={b} />)}</div>}
    <h2>Features</h2><div className="grid">{features.map(([I, t, d]) => <div className="card pad" key={t}><I className="accent" /><h3>{t}</h3><p className="muted">{d}</p></div>)}</div>
    <h2>How borrowing works</h2><ol className="steps"><li>Register with your register number.</li><li>Search the catalogue and open a book.</li><li>Borrow it if a copy is available; the due date is set automatically.</li><li>Return it on time to avoid overdue fines.</li></ol>
  </>;
}
