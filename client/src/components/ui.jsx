import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
export const Spinner = () => <div className="spinner" role="progressbar" aria-label="Loading" />;
export const Empty = ({ text }) => <div className="empty">{text}</div>;
export const ErrorBox = ({ text, retry }) => text ? <div className="alert" role="alert">{text} {retry && <button className="btn sm" onClick={retry}>Retry</button>}</div> : null;
export const Badge = ({ tone = 'gray', children }) => <span className={`badge ${tone}`}>{children}</span>;
export const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export function Cover({ title }) { // generated placeholder, no external images
  const h = [...title].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return <div className="cover" style={{ background: `linear-gradient(135deg,hsl(${h} 45% 28%),hsl(${(h + 40) % 360} 50% 40%))` }}><BookOpen size={28} /><span>{title}</span></div>;
}
export function BookCard({ b }) {
  return <Link to={`/books/${b._id}`} className="card book">
    <Cover title={b.title} /><div className="body"><h3>{b.title}</h3><p className="muted">{b.author}</p>
      <div className="row"><Badge tone="blue">{b.category}</Badge>
        {b.availableCopies > 0 ? <Badge tone="green">{b.availableCopies} available</Badge> : <Badge tone="red">Unavailable</Badge>}</div></div></Link>;
}
export function Pager({ p, onPage }) {
  if (!p || p.pages <= 1) return null;
  return <div className="pager"><button className="btn sm" disabled={p.page <= 1} onClick={() => onPage(p.page - 1)}>Previous</button>
    <span>Page {p.page} of {p.pages}</span><button className="btn sm" disabled={p.page >= p.pages} onClick={() => onPage(p.page + 1)}>Next</button></div>;
}
