import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Sparkles, Shield, Zap, Database, Users, ArrowRight,
  CheckCircle2, MessageSquare, Clock, ChevronRight, ExternalLink,
  Brain, Workflow, Lock, Eye, Layers,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import MarketingNav from '../components/MarketingNav';
import Footer from '../components/Footer';

export default function Landing() {
  const { setAuth } = useAuth();
  const nav = useNavigate();
  const [loggingIn, setLoggingIn] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function quickLogin(email) {
    if (loggingIn) return;
    setLoggingIn(email);
    setErrorMsg('');
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password: 'password123' },
      });
      if (!data?.token) throw new Error('Login response missing token');
      setAuth({ token: data.token, user: data.user });
      nav(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e) {
      console.error('Demo login failed:', e);
      setErrorMsg(
        e.message?.includes('Failed to fetch')
          ? 'Backend is waking up — please wait 30 seconds and try again.'
          : e.message || 'Login failed. Try the standard login page.'
      );
      // Fallback: still let user reach the login page
      setTimeout(() => {
        if (errorMsg === '') return;
      }, 100);
    } finally {
      setLoggingIn(null);
    }
  }

  function goToLogin() {
    nav('/login');
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 sm:pt-28 sm:pb-24">
          <div className="text-center max-w-4xl mx-auto animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Llama 3.3 70B · Multi-step planning · Long-term memory
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              The HR assistant that <br />
              <span className="gradient-text">actually takes action.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              An agentic AI platform across 4 HR workflows. Streams its reasoning step-by-step. Remembers your preferences. Asks before doing.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => quickLogin('rahul@xyzcorp.com')}
                disabled={!!loggingIn}
                className="group inline-flex items-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                {loggingIn === 'rahul@xyzcorp.com' ? 'Logging in…' : 'Try as Employee'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => quickLogin('priya.hr@xyzcorp.com')}
                disabled={!!loggingIn}
                className="group inline-flex items-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-xl font-semibold shadow border-2 border-slate-200 hover:border-slate-400 transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                {loggingIn === 'priya.hr@xyzcorp.com' ? 'Logging in…' : 'Try as HR Admin'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
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

            {errorMsg && (
              <div className="mt-6 max-w-md mx-auto bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
                <p>⚠️ {errorMsg}</p>
                <button
                  onClick={goToLogin}
                  className="mt-2 text-rose-900 underline font-medium"
                >
                  Use the regular login page →
                </button>
              </div>
            )}

            <p className="mt-5 text-xs text-slate-500">
              No signup · No credit card · First request takes ~30s while backend wakes from idle
            </p>
          </div>

          {/* Stats strip */}
          <div className="mt-16 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'HR workflows', value: '4' },
              { label: 'AI tools', value: '17' },
              { label: 'Multi-step plans', value: 'SSE streamed' },
              { label: 'Memory', value: 'pgvector' },
            ].map(s => (
              <div key={s.label} className="bg-white/70 backdrop-blur border border-slate-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Hero mock card */}
          <div className="mt-16 max-w-5xl mx-auto animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-2xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="flex-1 text-center text-xs text-slate-400 font-mono">hr-agent.app/dashboard</div>
                </div>

                <div className="p-6 sm:p-8 bg-slate-50">
                  <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-5 text-white mb-5">
                    <p className="text-xs text-violet-100">Friday, 26 June</p>
                    <p className="text-2xl font-bold mt-1">Good morning, Rahul 🌞</p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">HR Assistant</p>
                        <p className="text-xs text-slate-500">Online · multi-step reasoning</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-violet-600 text-white text-sm px-3 py-2 rounded-2xl max-w-xs">
                          Plan my Diwali week off
                        </div>
                      </div>
                      <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 my-2">
                        <p className="text-[10px] uppercase tracking-wider text-violet-700 font-semibold flex items-center gap-1.5 mb-2">
                          <Brain className="w-3 h-3" /> Agent reasoning
                        </p>
                        <ol className="space-y-1 text-xs">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                            <span className="text-slate-700">Step 1: Check leave balance → <strong>17 days</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                            <span className="text-slate-700">Step 2: Locate Diwali → <strong>Oct 22</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                            <span className="text-slate-700">Step 3: Draft 5-day annual leave</span>
                          </li>
                        </ol>
                      </div>
                      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
                        <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">📋 Draft</p>
                        <p className="text-xs text-slate-700 mt-1"><strong>ANNUAL</strong> · Oct 19 → Oct 23 · 5 days</p>
                        <div className="flex gap-2 mt-2">
                          <button className="bg-emerald-600 text-white text-[11px] px-3 py-1 rounded font-medium">✅ Confirm</button>
                          <button className="bg-slate-200 text-slate-700 text-[11px] px-3 py-1 rounded font-medium">Cancel</button>
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

      {/* ============ WATCH IT THINK ============ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-2">Watch it think</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                Multi-step reasoning, <span className="gradient-text">visible in real time.</span>
              </h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Complex requests like <em>"plan my Diwali week off"</em> trigger a ReAct planning loop. The agent produces a JSON plan, executes each tool sequentially, and streams progress via Server-Sent Events. You see exactly what it's doing — no black box.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Workflow, text: 'JSON plan generated up-front by the LLM' },
                  { icon: Zap, text: 'Each step streamed live to the UI via SSE' },
                  { icon: Shield, text: 'Drafts always require explicit confirmation' },
                  { icon: Eye, text: 'Full reasoning visibility, never hidden' },
                ].map(item => (
                  <li key={item.text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <p className="text-slate-700 leading-relaxed">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-violet-700 font-semibold flex items-center gap-1.5 mb-3">
                    <Brain className="w-3.5 h-3.5 animate-pulse" />
                    Agent reasoning
                  </p>
                  <ol className="space-y-2.5">
                    {[
                      { reason: 'Check user leave balance', summary: 'Annual: 17 days remaining' },
                      { reason: 'Look up Diwali 2026 date', summary: 'October 22 (Thursday)' },
                      { reason: 'Check team capacity', summary: 'No major conflicts' },
                      { reason: 'Draft 5-day annual leave', summary: 'Oct 19 – Oct 23' },
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800">Step {i + 1}: <span className="font-normal text-slate-600">{s.reason}</span></p>
                          <p className="text-slate-500 text-xs mt-0.5">→ {s.summary}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="text-xs text-slate-400 text-center mt-3">Streamed live via Server-Sent Events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ IT REMEMBERS YOU ============ */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="lg:order-2">
              <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-2">It remembers you</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                Semantic memory <span className="gradient-text">that persists.</span>
              </h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Powered by pgvector and Cohere embeddings. The agent quietly captures preferences from natural conversation and retrieves the most relevant memories per query via cosine similarity — injected into the system prompt before responding.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Brain, text: 'Auto-captures persistent facts from chat history' },
                  { icon: Database, text: 'Stored as 384-d vectors with HNSW index' },
                  { icon: Lock, text: 'Per-user · fully isolated · GDPR-friendly' },
                  { icon: Eye, text: 'Full visibility — see and delete anytime' },
                ].map(item => (
                  <li key={item.text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <p className="text-slate-700 leading-relaxed">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:order-1 relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-violet-600" />
                  <h3 className="font-bold text-slate-900">What I remember about you</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: '👤', label: 'You told me', text: 'User prefers Friday afternoons off', age: '3d ago' },
                    { icon: '✨', label: 'Auto-captured', text: 'User is vegetarian', age: '1d ago' },
                    { icon: '👤', label: 'You told me', text: 'User remote-works on Wednesdays', age: 'just now' },
                  ].map((m, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 flex items-start gap-3">
                      <div className="text-lg">{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">{m.text}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{m.label} · {m.age}</p>
                      </div>
                    </div>
                  ))}
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
              17 AI tools across 4 workflows. Multi-role auth, atomic transactions, draft-confirm safety on every mutation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: 'Agentic AI', desc: 'LLM picks tools from a registry. Function-calling with strict schemas. Tool execution server-side with auth context.' },
              { icon: Brain, title: 'Long-term memory', desc: 'pgvector + Cohere embeddings. Auto-captures user preferences across sessions and retrieves them at query time.' },
              { icon: Workflow, title: 'Multi-step planning', desc: 'ReAct loop: plan → execute → critique. Steps streamed via SSE so users see reasoning unfold in real time.' },
              { icon: Shield, title: 'Human-in-the-loop', desc: 'AI never auto-mutates. Every leave, profile change, document or ticket needs explicit user Confirm. Triple-gate for state changes.' },
              { icon: Users, title: 'Role-based access', desc: 'Employees see their data. HR admins see the org queue. JWT middleware enforces it server-side, on every request.' },
              { icon: Database, title: 'Atomic transactions', desc: 'Approval flips status and updates balance in a single rollback-safe block. No race conditions.' },
              { icon: Layers, title: '4 HR workflows', desc: 'Leave · Profile · Documents · Tickets. Each follows the same draft → confirm → audit pipeline.' },
              { icon: MessageSquare, title: 'Conversation threads', desc: 'Tickets support 2-way message threads with role-aware authoring. 4-state status machine.' },
              { icon: Zap, title: 'Real-time inference', desc: 'Llama 3.3 70B on Groq returns answers in ~500ms. Multi-step plans complete in 2-4 seconds.' },
            ].map(f => (
              <div key={f.title} className="group p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all bg-white">
                <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-5 h-5 text-violet-600" />
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
              From plain English to approved — in 3 steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Ask in plain English', desc: 'Open the chat. Say what you need: "Plan my Diwali week off". The agent decides whether it needs multi-step reasoning.', icon: MessageSquare },
              { step: '02', title: 'AI plans, then drafts', desc: 'For complex requests, you watch each step unfold: checking balance, looking up dates, computing the optimal window. Then a draft card.', icon: Sparkles },
              { step: '03', title: 'Human confirms · HR approves', desc: 'You click Confirm. HR sees the request in their unified queue with an AI-drafted badge. One click approves. Balance updates atomically.', icon: CheckCircle2 },
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
              { name: 'pgvector', role: 'Memory store' },
              { name: 'Llama 3.3 70B', role: 'Reasoning' },
              { name: 'Groq', role: 'LLM inference' },
              { name: 'Cohere', role: 'Embeddings' },
              { name: 'Supabase', role: 'Postgres + auth' },
              { name: 'Vercel', role: 'Frontend deploy' },
              { name: 'Render', role: 'Backend deploy' },
              { name: 'Tailwind v4', role: 'Styling' },
              { name: 'Lucide', role: 'Icons' },
            ].map(t => (
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
                See it reason in 60 seconds.
              </h2>
              <p className="mt-4 text-lg text-violet-100 max-w-xl mx-auto">
                Click below, type "plan my Diwali week off", watch the agent think.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => quickLogin('rahul@xyzcorp.com')}
                  disabled={!!loggingIn}
                  className="group inline-flex items-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-xl font-semibold shadow-xl hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-wait"
                >
                  {loggingIn === 'rahul@xyzcorp.com' ? 'Logging in…' : 'Try as Employee'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => quickLogin('priya.hr@xyzcorp.com')}
                  disabled={!!loggingIn}
                  className="group inline-flex items-center gap-2 bg-violet-700 text-white px-7 py-3.5 rounded-xl font-semibold shadow-xl hover:bg-violet-600 transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {loggingIn === 'priya.hr@xyzcorp.com' ? 'Logging in…' : 'Try as HR Admin'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
