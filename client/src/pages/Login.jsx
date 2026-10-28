import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { ErrorBox } from '../components/ui';
export default function Login() {
  const { login } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const u = await login(f.email, f.password); nav(u.role === 'ADMIN' ? '/admin' : loc.state?.from || '/dashboard', { replace: true }); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return <form className="card pad form" onSubmit={submit}><h1>Login</h1><ErrorBox text={err} />
    <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
    <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
    <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
    <div style={{ margin: '0.75rem 0', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', fontWeight: 600, color: '#475569' }}>Quick Demo Logins:</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className="btn ghost" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }} onClick={() => setF({ email: 'admin@example.com', password: 'AdminStrongPass#2026' })}>
          Admin Demo
        </button>
        <button type="button" className="btn ghost" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }} onClick={() => setF({ email: 'member1@example.com', password: 'DevOnly#12345' })}>
          Member Demo
        </button>
      </div>
    </div>
    <p className="muted">New here? <Link to="/register">Create an account</Link></p></form>;
}
