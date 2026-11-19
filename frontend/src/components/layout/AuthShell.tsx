import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Shared shell for sign-in and sign-up: brand panel on the left, form on the right. */
const AuthShell: React.FC<Props> = ({ eyebrow, title, subtitle, children, footer }) => {
  return (
    <div className="flex min-h-screen items-stretch bg-paper text-ink">
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-r border-line bg-surface-2 p-10 lg:flex">
        <div className="paper-grid pointer-events-none absolute inset-0 opacity-70" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-black text-white dark:text-[#1a130b]">
            B
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Boost<span className="text-brand">UP</span>
          </span>
        </Link>

        <div className="relative">
          <p className="font-display text-4xl leading-tight tracking-tight">
            Small teams,
            <br />
            <span className="text-brand">honest progress.</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
            One backlog, one board, one set of numbers. No ceremony, no dashboards that flatter you.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { value: '3', label: 'Board columns' },
              { value: '2', label: 'Project roles' },
              { value: '1', label: 'Source of truth' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-line bg-surface p-3">
                <p className="font-display text-2xl font-semibold text-brand tnum">{stat.value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-ink-faint">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-ink-faint">
          Accounts created here are standard members. Platform administrators are provisioned by the operator.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-black text-white dark:text-[#1a130b]">
                B
              </span>
              <span className="font-display text-lg font-semibold">BoostUP</span>
            </Link>
            <ThemeToggle />
          </div>

          <div className="hidden justify-end lg:flex">
            <ThemeToggle />
          </div>

          <p className="mt-6 label-xs">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-sm text-ink-soft">{footer}</div>
        </div>
      </main>
    </div>
  );
};

export default AuthShell;
