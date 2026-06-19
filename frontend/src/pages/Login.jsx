import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { setAuth } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('rahul@xyzcorp.com');
  const [password, setPassword] = useState('password123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      setAuth({ token: data.token, user: data.user });
      nav(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <form onSubmit={submit} className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">HR Agent — Sign in</h1>
        <p className="text-sm text-slate-500">
          Try <code>rahul@xyzcorp.com</code> or <code>priya.hr@xyzcorp.com</code> · password: <code>password123</code>
        </p>
        <div>
          <label className="text-sm text-slate-600">Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>
        {err && <p className="text-red-600 text-sm">❌ {err}</p>}
        <button
          disabled={loading}
          className="w-full bg-slate-800 text-white rounded-lg py-2 font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}