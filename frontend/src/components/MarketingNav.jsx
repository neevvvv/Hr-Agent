import { Link } from 'react-router-dom';
import { Bot, ExternalLink } from 'lucide-react';

export default function MarketingNav() {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-violet-500/30 transition-shadow">
              <Bot className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">HR Agent</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="https://github.com/neevvvv/hr-agent"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              GitHub
            </a>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 shadow-sm transition-colors"
            >
              Try the demo
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}