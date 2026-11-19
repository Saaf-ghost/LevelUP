import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Columns3, ListChecks, Sparkles, Users } from 'lucide-react';
import ThemeToggle from '../components/layout/ThemeToggle';

const FEATURES = [
  {
    icon: Columns3,
    title: 'A board that keeps up',
    desc: 'Drag work across To Do, In Progress and Done. Every move is persisted and written to task history.',
    accent: 'text-brand bg-brand-soft',
  },
  {
    icon: ListChecks,
    title: 'Backlog to sprint in one pass',
    desc: 'Group work under requirements, scope a sprint, and watch the point distribution settle.',
    accent: 'text-leaf bg-leaf-soft',
  },
  {
    icon: Users,
    title: 'Roles that mean something',
    desc: 'Project owners run their workspace, members deliver, and platform administrators stay separate.',
    accent: 'text-brand bg-brand-soft',
  },
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-black text-white dark:text-[#1a130b]">
            B
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Boost<span className="text-brand">UP</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:text-brand"
          >
            Log in
          </Link>
          <Link to="/register" className="btn-primary px-4 py-2 text-sm">
            Start free
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="grid items-end gap-10 border-b border-line pb-14 pt-10 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              <Sparkles size={13} className="text-brand" />
              Delivery workspace
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
              Plan the sprint.
              <br />
              <span className="text-brand">Finish the work.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
              BoostUP keeps the backlog, the board and the numbers in one place, so a small team can
              see exactly what is moving and what has stalled.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary px-5 py-2.5 text-sm">
                Create a workspace
                <ArrowUpRight size={16} />
              </Link>
              <Link to="/login" className="btn-quiet px-5 py-2.5 text-sm">
                Sign in
              </Link>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
              <span className="label-xs">Sprint 04 · Payments</span>
              <span className="chip border-leaf/30 bg-leaf-soft text-leaf">Active</span>
            </div>
            <div className="space-y-2.5 p-4">
              {[
                { label: 'To do', points: 13, width: '100%', tone: 'bg-line-strong' },
                { label: 'In progress', points: 8, width: '62%', tone: 'bg-brand' },
                { label: 'Done', points: 18, width: '88%', tone: 'bg-leaf' },
              ].map(row => (
                <div key={row.label} className="rounded-lg border border-line bg-surface-2 p-3">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-ink-soft">
                    <span>{row.label}</span>
                    <span className="tnum text-ink-faint">{row.points} SP</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
                    <div className={`h-full rounded-full ${row.tone}`} style={{ width: row.width }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-line px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              39 of 44 committed points complete
            </div>
          </div>
        </section>

        <section className="grid gap-6 py-14 md:grid-cols-3">
          {FEATURES.map(feature => (
            <div key={feature.title} className="card p-5">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${feature.accent}`}>
                <feature.icon size={17} />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{feature.desc}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-surface-2 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold">Start with an empty backlog.</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Bring a PRD, decompose it later. The board is ready on day one.
            </p>
          </div>
          <Link to="/register" className="btn-leaf px-5 py-2.5 text-sm">
            Open BoostUP
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </main>

      <footer className="border-t border-line px-6 py-6 text-center text-xs text-ink-faint">
        BoostUP · agile delivery workspace
      </footer>
    </div>
  );
};

export default Landing;
