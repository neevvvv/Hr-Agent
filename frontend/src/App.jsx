import { useEffect, useState } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(e => setErr(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-800">HR Agent — Phase 1</h1>
        <p className="text-slate-500 mt-1">Backend handshake test</p>
        <pre className="mt-4 bg-slate-100 rounded p-3 text-sm">
          {err ? `❌ ${err}` : JSON.stringify(health, null, 2) || 'loading…'}
        </pre>
      </div>
    </div>
  );
}