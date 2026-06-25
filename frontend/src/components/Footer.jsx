import { Bot, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-700">HR Agent</span>
            <span className="text-slate-400 text-sm hidden sm:inline">· A portfolio project by Neev Sahu</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-slate-500">
            <a href="https://github.com/neevvvv/hr-agent" target="_blank" rel="noreferrer" className="hover:text-slate-900 flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" /> Source
            </a>
            <span>© 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}