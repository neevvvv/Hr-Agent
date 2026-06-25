import { Link } from 'react-router-dom';

import {
  Bot, Sparkles, Shield, Zap, Database, Users, ArrowRight,
  CheckCircle2, MessageSquare, Clock, ChevronRight, ExternalLink
} from 'lucide-react';

import MarketingNav from '../components/MarketingNav';
import Footer from '../components/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center max-w-4xl mx-auto animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Llama 3.3 70B · Function calling</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              The HR assistant that <br />
              <span className="gradient-text">actually takes action.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              An agentic AI that checks leave balance, drafts requests, and routes approvals — with a human-in-the-loop safety gate at every step.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all"
              >
                Try the live demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/neevvvv/hr-agent"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-slate-700 px-5 py-3.5 rounded-xl font-semibold border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View source
              </a>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Demo accounts pre-filled · No signup required
            </p>
          </div>

          {/* Hero mock card */}
          <div className="mt-16 max-w-5xl mx-auto animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-2xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="flex-1 text-center text-xs text-slate-400 font-mono">hr-agent.app/dashboard</div>
                </div>

                {/* Mock dashboard */}
                <div className="p-6 sm:p-8 bg-slate-50">
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                    {[
                      { label: 'Annual Leave', val: '17', total: '20', icon: '🌴', color: 'from-emerald-500 to-emerald-600' },
                      { label: 'Sick Leave',   val: '10', total: '10', icon: '🤒', color: 'from-rose-500 to-rose-600' },
                      { label: 'Casual Leave', val: '4',  total: '5',  icon: '☕', color: 'from-amber-500 to-amber-600' },
                    ].map((b) => (
                      <div key={b.label} className={`rounded-xl p-4 text-white bg-gradient-to-br ${b.color} shadow-md`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{b.icon}</span>
                          <span className="text-xs opacity-80">REMAINING</span>
                        </div>
                        <p className="text-3xl font-bold">{b.val}</p>
                        <p className="text-xs opacity-90 mt-1">of {b.total} days</p>
                      </div>
                    ))}
                  </div>

                  {/* Mock chat */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">HR Assistant</p>
                        <p className="text-xs text-slate-500">Online · Llama 3.3</p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-end">
                        <div className="bg-violet-600 text-white text-sm px-3 py-2 rounded-2xl max-w-xs">
                          I want leave from Aug 10 to Aug 12 for a wedding
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-slate-100 text-slate-800 text-sm px-3 py-2 rounded-2xl max-w-xs">
                          I've drafted that for you. Please review and confirm.
                        </div>
                      </div>
                      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 mt-2">
                        <p className="text-xs uppercase tracking-wider text-amber-700 font-semibold">📋 Draft</p>
                        <p className="text-sm text-slate-700 mt-1"><strong>ANNUAL</strong> · 2026-08-10 → 2026-08-12 · 3 days</p>
                        <div className="flex gap-2 mt-2">
                          <button className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-lg font-medium">✅ Confirm</button>
                          <button className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded-lg font-medium">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Built like a real product
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Multi-role auth, atomic database transactions, tool-calling LLM, and a safety-first agent loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bot, title: 'Agentic AI',
                desc: 'LLM picks from 4 tools — balance lookup, policy, request history, draft creation — instead of just chatting.',
                color: 'violet',
              },
              {
                icon: Shield, title: 'Human-in-the-loop',
                desc: 'AI drafts, user confirms, admin approves. Three checkpoints. The agent never auto-mutates data.',
                color: 'emerald',
              },
              {
                icon: Users, title: 'Role-based access',
                desc: 'Employees see their data. HR admins see the org queue. Enforced server-side with JWT middleware.',
                color: 'indigo',
              },
              {
                icon: Database, title: 'Atomic transactions',
                desc: 'Approval flips status and updates balance in a single rollback-safe block. No race conditions.',
                color: 'sky',
              },
              {
                icon: Zap, title: 'Fast inference',
                desc: 'Llama 3.3 70B on Groq returns answers in ~500ms. Tool-calling latency that feels instant.',
                color: 'amber',
              },
              {
                icon: MessageSquare, title: 'Natural language',
                desc: '"I want next Monday off for a doctor visit" becomes a structured draft request automatically.',
                color: 'rose',
              },
            ].map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all bg-white">
                <div className={`w-11 h-11 rounded-xl bg-${f.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-5 h-5 text-${f.color}-600`} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              From "I want a day off" to approved — in 3 steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              {
                step: '01', title: 'Ask in plain English',
                desc: 'Open the chat bubble and say what you need: "Can I take next Monday off for a doctor visit?"',
                icon: MessageSquare,
              },
              {
                step: '02', title: 'AI drafts, you confirm',
                desc: 'The LLM picks the right tool, infers dates and type, checks your balance, and produces a draft card.',
                icon: Sparkles,
              },
              {
                step: '03', title: 'Admin approves',
                desc: 'HR sees it in their queue with an AI-drafted badge. One click approves — balance updates atomically.',
                icon: CheckCircle2,
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 h-full shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-5xl font-extrabold gradient-text">{s.step}</span>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-slate-900">{s.title}</h3>
                  <p className="mt-3 text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
                {i < 2 && (
                  <ChevronRight className="hidden lg:block absolute top-1/2 -right-2 w-6 h-6 text-slate-300 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TECH STACK ============ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-2">Built with</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Production-grade free stack
            </h2>
            <p className="mt-4 text-slate-600">
              Three services. All free tier. Deployed end-to-end.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: 'React + Vite', role: 'Frontend' },
              { name: 'Node + Express', role: 'Backend' },
              { name: 'PostgreSQL', role: 'Database' },
              { name: 'Llama 3.3 70B', role: 'AI Model' },
              { name: 'Tailwind v4', role: 'Styling' },
              { name: 'Groq', role: 'Inference' },
              { name: 'Supabase', role: 'DB hosting' },
              { name: 'Vercel + Render', role: 'Deploy' },
            ].map((t) => (
              <div key={t.name} className="p-4 rounded-xl border border-slate-200 text-center hover:border-violet-300 hover:bg-violet-50/50 transition-colors">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500 mt-1">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 sm:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-900 to-indigo-900 rounded-3xl p-10 sm:p-16 text-center shadow-2xl">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(167,139,250,.4) 0px, transparent 50%), radial-gradient(circle at 80% 100%, rgba(129,140,248,.4) 0px, transparent 50%)'
            }}></div>
            <div className="relative">
              <Clock className="w-12 h-12 text-violet-300 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
                See it in action in 60 seconds.
              </h2>
              <p className="mt-4 text-lg text-violet-100 max-w-xl mx-auto">
                Demo accounts are pre-filled. No signup. Click a button and you're in.
              </p>
              <Link
                to="/login"
                className="group mt-8 inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold shadow-xl hover:scale-105 transition-transform"
              >
                Open the demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}