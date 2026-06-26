import { CheckCircle2, AlertCircle, Loader2, Brain } from 'lucide-react';

const statusIcon = (status) => {
  if (status === 'pending') return <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />;
  if (status === 'ok')      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'fail')    return <AlertCircle className="w-4 h-4 text-rose-500" />;
  return null;
};

export default function ThoughtStream({ phase, steps }) {
  if (!steps || steps.length === 0) {
    if (phase === 'planning') {
      return (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 my-2 flex items-center gap-2 text-sm text-violet-800">
          <Brain className="w-4 h-4 animate-pulse" />
          Thinking through your request…
        </div>
      );
    }
    return null;
  }

  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 my-2">
      <p className="text-xs uppercase tracking-wider text-violet-700 font-semibold flex items-center gap-1.5 mb-2">
        <Brain className="w-3.5 h-3.5" />
        Agent reasoning
      </p>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <div className="mt-0.5 flex-shrink-0">{statusIcon(s.status)}</div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">
                Step {s.index + 1}: <span className="font-normal text-slate-600">{s.reason || s.action}</span>
              </p>
              {s.summary && (
                <p className="text-slate-500 mt-0.5">→ {s.summary}</p>
              )}
              {s.error && (
                <p className="text-rose-600 mt-0.5">✗ {s.error}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}