import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Shield,
  Zap,
  Database,
  Users,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Brain,
  Workflow,
  Lock,
  Eye,
  Layers,
} from 'lucide-react';

import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import MarketingNav from '../components/MarketingNav';
import Footer from '../components/Footer';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Landing() {
  const { setAuth } = useAuth();
  const nav = useNavigate();

  const [loggingIn, setLoggingIn] = useState(null);
  const [loginSeconds, setLoginSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // ✅ Backend pre-warm on mount (masks Render cold start)
  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/health`, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => {
      // Silent pre-warm — login will surface real errors if backend is down
    });

    return () => controller.abort();
  }, []);

  // ✅ Countup timer while logging in
  useEffect(() => {
    if (!loggingIn) {
      setLoginSeconds(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setLoginSeconds((s) => s + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loggingIn]);

  async function quickLogin(email) {
    if (loggingIn) return;

    setLoggingIn(email);
    setLoginSeconds(0);
    setErrorMsg('');

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password: 'password123' },
      });

      if (!data?.token) {
        throw new Error('Login response missing token');
      }

      setAuth({ token: data.token, user: data.user });
      nav(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e) {
      console.error('Demo login failed:', e);

      setErrorMsg(
        e.message?.includes('Failed to fetch')
          ? 'Backend is waking up — please wait a few seconds and try again.'
          : e.message || 'Login failed. Try the standard login page.'
      );
    } finally {
      setLoggingIn(null);
    }
  }

  function goToLogin() {
    nav('/login');
  }

  // Helper to render a quick-login button with countup label
  function loginButtonLabel(email, defaultLabel) {
    if (loggingIn !== email) return defaultLabel;
    return `Logging in… ${loginSeconds}s`;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      <MarketingNav />

      {/* ============ HERO ============ */}
      <section className="relative gradient-bg">
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Llama 3.3 70B · Multi-step planning · Long-term memory
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              The HR assistant that{' '}
              <span className="gradient-text">actually takes action.</span>
            </h1>

            <p className="text-lg text-slate-600 mt-6 max-w-xl leading-relaxed">
              An agentic AI platform across 4 HR workflows. Streams its reasoning
              step-by-step. Remembers your preferences. Asks before doing.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={() => quickLogin('rahul@xyzcorp.com')}
                disabled={!!loggingIn}
                className="group inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                {loginButtonLabel('rahul@xyzcorp.com', 'Try as Employee')}
                {loggingIn !== 'rahul@xyzcorp.com' && (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </button>

              <button
                onClick={() => quickLogin('priya.hr@xyzcorp.com')}
                disabled={!!loggingIn}
                className="group inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-xl font-semibold shadow border-2 border-slate-200 hover:border-slate-400 transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                {loginButtonLabel('priya.hr@xyzcorp.com', 'Try as HR Admin')}
                {loggingIn !== 'priya.hr@xyzcorp.com' && (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="mt-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
                <p>⚠️ {errorMsg}</p>
                <button
                  onClick={goToLogin}
                  className="mt-1 font-semibold hover:underline"
                >
                  Use the regular login page →
                </button>
              </div>
            )}

            <p className="text-sm text-slate-500 mt-5">
              No signup · No credit card · First request takes ~30s while backend wakes from idle
            </p>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
              {[
                { label: 'HR workflows', value: '4' },
                { label: 'AI tools', value: '17' },
                { label: 'Multi-step plans', value: 'SSE streamed' },
                { label: 'Memory', value: 'pgvector' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-4 shadow-sm"
                >
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero mock card */}
          <div className="relative animate-fade-in">
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-400 to-indigo-400 blur-3xl opacity-20 rounded-full" />

            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 px-5 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-slate-400 text-sm">hr-agent.app/dashboard</span>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-5 text-white">
                  <p className="text-violet-100 text-sm">Friday, 26 June</p>
                  <h3 className="text-2xl font-bold mt-1">Good morning, Rahul 🌞</h3>
                  <p className="text-violet-100 mt-1">What would you like to do today?</p>
                </div>

                <div className="border rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-violet-700" />
                    </div>
                    <div>
                      <p className="font-semibold">HR Assistant</p>
                      <p className="text-xs text-slate-500">Online · multi-step reasoning</p>
                    </div>
                  </div>

                  <div className="bg-slate-100 rounded-xl p-3 text-sm text-slate-700">
                    Plan my Diwali week off
                  </div>

                  <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-3 text-sm">
                    <p className="font-semibold text-violet-900 mb-2">Agent reasoning</p>
                    <ul className="space-y-1 text-violet-800">
                      <li>✓ Step 1: Check leave balance → 17 days</li>
                      <li>✓ Step 2: Locate Diwali → Oct 22</li>
                      <li>✓ Step 3: Draft 5-day annual leave</li>
                    </ul>
                  </div>

                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs uppercase text-amber-700 font-semibold">📋 Draft</p>
                    <p className="text-sm mt-1">ANNUAL · Oct 19 → Oct 23 · 5 days</p>
                    <div className="flex gap-2 mt-3">
                      <button className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-sm">
                        ✅ Confirm
                      </button>
                      <button className="bg-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WATCH IT THINK ============ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">
              Watch it think
            </p>

            <h2 className="text-4xl font-bold tracking-tight">
              Multi-step reasoning, visible in real time.
            </h2>

            <p className="text-slate-600 mt-5 leading-relaxed">
              Complex requests like “plan my Diwali week off” trigger a ReAct planning loop.
              The agent produces a JSON plan, executes each tool sequentially, and streams
              progress via Server-Sent Events. You see exactly what it's doing — no black box.
            </p>

            <div className="mt-6 space-y-3">
              {[
                { icon: Workflow, text: 'JSON plan generated up-front by the LLM' },
                { icon: Zap, text: 'Each step streamed live to the UI via SSE' },
                { icon: Shield, text: 'Drafts always require explicit confirmation' },
                { icon: Eye, text: 'Full reasoning visibility, never hidden' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-violet-700" />
                  </div>
                  <p className="text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6">
            <p className="font-semibold text-slate-900 mb-4">Agent reasoning</p>

            <div className="space-y-4">
              {[
                { reason: 'Check user leave balance', summary: 'Annual: 17 days remaining' },
                { reason: 'Look up Diwali 2026 date', summary: 'October 22 (Thursday)' },
                { reason: 'Check team capacity', summary: 'No major conflicts' },
                { reason: 'Draft 5-day annual leave', summary: 'Oct 19 – Oct 23' },
              ].map((s, i) => (
                <div key={s.reason} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Step {i + 1}: {s.reason}</p>
                    <p className="text-sm text-slate-500">→ {s.summary}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-slate-50 rounded-xl p-3 text-sm text-slate-500">
              Streamed live via Server-Sent Events
            </div>
          </div>
        </div>
      </section>

      {/* ============ IT REMEMBERS YOU ============ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 bg-slate-900 text-white rounded-3xl p-6 shadow-2xl">
            <p className="text-slate-400 text-sm mb-4">Memory inspector</p>

            <h3 className="text-xl font-bold mb-5">What I remember about you</h3>

            <div className="space-y-3">
              {[
                { icon: '👤', label: 'You told me', text: 'User prefers Friday afternoons off', age: '3d ago' },
                { icon: '✨', label: 'Auto-captured', text: 'User is vegetarian', age: '1d ago' },
                { icon: '👤', label: 'You told me', text: 'User remote-works on Wednesdays', age: 'just now' },
              ].map((m) => (
                <div key={m.text} className="bg-white/10 rounded-xl p-4 flex gap-3">
                  <div className="text-2xl">{m.icon}</div>
                  <div>
                    <p className="text-sm">{m.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{m.label} · {m.age}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">
              It remembers you
            </p>

            <h2 className="text-4xl font-bold tracking-tight">
              Semantic memory that persists.
            </h2>

            <p className="text-slate-600 mt-5 leading-relaxed">
              Powered by pgvector and Cohere embeddings. The agent quietly captures
              preferences from natural conversation and retrieves the most relevant
              memories per query via cosine similarity — injected into the system prompt
              before responding.
            </p>

            <div className="mt-6 space-y-3">
              {[
                { icon: Brain, text: 'Auto-captures persistent facts from chat history' },
                { icon: Database, text: 'Stored as 384-d vectors with HNSW index' },
                { icon: Lock, text: 'Per-user · fully isolated · GDPR-friendly' },
                { icon: Eye, text: 'Full visibility — see and delete anytime' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-indigo-700" />
                  </div>
                  <p className="text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl font-bold tracking-tight">Built like a real product</h2>
            <p className="text-slate-600 mt-4">
              17 AI tools across 4 workflows. Multi-role auth, atomic transactions,
              draft-confirm safety on every mutation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Bot,
                title: 'Agentic AI',
                desc: 'LLM picks tools from a registry. Function-calling with strict schemas. Tool execution server-side with auth context.',
              },
              {
                icon: Brain,
                title: 'Long-term memory',
                desc: 'pgvector + Cohere embeddings. Auto-captures user preferences across sessions and retrieves them at query time.',
              },
              {
                icon: Workflow,
                title: 'Multi-step planning',
                desc: 'ReAct loop: plan → execute → critique. Steps streamed via SSE so users see reasoning unfold in real time.',
              },
              {
                icon: Shield,
                title: 'Human-in-the-loop',
                desc: 'AI never auto-mutates. Every leave, profile change, document or ticket needs explicit user Confirm.',
              },
              {
                icon: Users,
                title: 'Role-based access',
                desc: 'Employees see their data. HR admins see the org queue. JWT middleware enforces it server-side, on every request.',
              },
              {
                icon: Database,
                title: 'Atomic transactions',
                desc: 'Approval flips status and updates balance in a single rollback-safe block. No race conditions.',
              },
              {
                icon: Layers,
                title: '4 HR workflows',
                desc: 'Leave · Profile · Documents · Tickets. Each follows the same draft → confirm → audit pipeline.',
              },
              {
                icon: MessageSquare,
                title: 'Conversation threads',
                desc: 'Tickets support 2-way message threads with role-aware authoring. 4-state status machine.',
              },
              {
                icon: Zap,
                title: 'Real-time inference',
                desc: 'Llama 3.3 70B on Groq returns answers in ~500ms. Multi-step plans complete in 2-4 seconds.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-violet-700" />
                </div>

                <h3 className="font-bold text-lg text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">
              How it works
            </p>

            <h2 className="text-4xl font-bold tracking-tight">
              From plain English to approved — in 3 steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Ask in plain English',
                desc: 'Open the chat. Say what you need: "Plan my Diwali week off". The agent decides whether it needs multi-step reasoning.',
                icon: MessageSquare,
              },
              {
                step: '02',
                title: 'AI plans, then drafts',
                desc: 'For complex requests, you watch each step unfold: checking balance, looking up dates, computing the optimal window. Then a draft card.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'Human confirms · HR approves',
                desc: 'You click Confirm. HR sees the request in their unified queue with an AI-drafted badge. One click approves. Balance updates atomically.',
                icon: CheckCircle2,
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative bg-slate-50 rounded-3xl p-7 border border-slate-200"
              >
                <div className="text-5xl font-black text-violet-100">{s.step}</div>

                <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center mt-4">
                  <s.icon className="w-5 h-5" />
                </div>

                <h3 className="text-xl font-bold mt-5">{s.title}</h3>
                <p className="text-slate-600 mt-3 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight">
            See it reason in 60 seconds.
          </h2>

          <p className="text-violet-100 mt-5 text-lg">
            Click below, type "plan my Diwali week off", watch the agent think.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={() => quickLogin('rahul@xyzcorp.com')}
              disabled={!!loggingIn}
              className="group inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-xl font-semibold shadow-xl hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-wait"
            >
              {loginButtonLabel('rahul@xyzcorp.com', 'Try as Employee')}
              {loggingIn !== 'rahul@xyzcorp.com' && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>

            <button
              onClick={() => quickLogin('priya.hr@xyzcorp.com')}
              disabled={!!loggingIn}
              className="group inline-flex items-center justify-center gap-2 bg-violet-700 text-white px-7 py-3.5 rounded-xl font-semibold shadow-xl hover:bg-violet-600 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {loginButtonLabel('priya.hr@xyzcorp.com', 'Try as HR Admin')}
              {loggingIn !== 'priya.hr@xyzcorp.com' && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}