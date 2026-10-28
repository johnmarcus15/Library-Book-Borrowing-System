import { NavLink, Outlet } from 'react-router-dom';
const tabs = [['/admin', 'Dashboard', true], ['/admin/books', 'Books'], ['/admin/members', 'Members'], ['/admin/borrowings', 'Borrowings'], ['/admin/reports', 'Reports']];
export default function AdminLayout() {
  return <><h1>Librarian console</h1><div className="tabs adminTabs">{tabs.map(([to, l, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>{l}</NavLink>)}</div><Outlet /></>;
}
