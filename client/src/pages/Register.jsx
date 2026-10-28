import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import { useToast } from '../components/Toast';
import { ErrorBox } from '../components/ui';
const fields = [['name', 'Full name', 'text'], ['email', 'Email address', 'email'], ['studentId', 'Student / register number', 'text'], ['password', 'Password (min 8 characters)', 'password'], ['confirmPassword', 'Confirm password', 'password']];
export default function Register() {
  const nav = useNavigate(); const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', studentId: '', password: '', confirmPassword: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (f.password !== f.confirmPassword) return setErr('Passwords do not match');
    setBusy(true);
    try { await api.post('/auth/register', f); toast('Account created. Please log in.'); nav('/login'); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return <form className="card pad form" onSubmit={submit}><h1>Register</h1><ErrorBox text={err} />
    {fields.map(([k, l, t]) => <label key={k}>{l}<input type={t} required value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>)}
    <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button><p className="muted">Already registered? <Link to="/login">Login</Link></p></form>;
}
