import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
  const { auth, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-2xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome, {auth.user.name} 👋</h1>
            <p className="text-slate-500 mt-1">
              Role: <span className="font-mono">{auth.user.role}</span>
            </p>
          </div>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
            Logout
          </button>
        </div>
        <p className="mt-6 text-slate-600">
          Phase 2 complete — JWT auth working. Leave features land in Phase 3. 🌴
        </p>
      </div>
    </div>
  );
}