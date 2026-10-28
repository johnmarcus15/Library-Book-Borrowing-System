import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Library, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return <>
    <header className="nav"><div className="wrap navin">
      <Link to="/" className="brand"><Library size={22} /> Easwari Library</Link>
      <nav aria-label="Main">
        <NavLink to="/books">Catalogue</NavLink>
        {user?.role === 'MEMBER' && <><NavLink to="/dashboard">Dashboard</NavLink><NavLink to="/my-borrowings">My borrowings</NavLink></>}
        {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="auth">{user ? <>
        <span className="muted">{user.name}</span>
        <span className={`badge ${user.role === 'ADMIN' ? 'red' : 'blue'}`} style={{ textTransform: 'capitalize' }}>{user.role.toLowerCase()}</span>
        <button className="btn sm ghost" onClick={async () => { await logout(); nav('/'); }}><LogOut size={14} /> Logout</button></>
        : <><Link className="btn sm ghost" to="/login">Login</Link><Link className="btn sm" to="/register">Register</Link></>}</div>
    </div></header>
    <main className="wrap"><Outlet /></main>
    <footer className="foot"><div className="wrap">Library Book Borrowing Management System · Easwari Engineering College, Department of CSE</div></footer>
  </>;
}
