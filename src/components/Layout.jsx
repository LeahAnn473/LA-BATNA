import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const onHome = location.pathname === '/';

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-40 border-b border-[#EFE5D5] bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-deep font-display text-lg text-cream shadow-lg shadow-deep/20">
              ل
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-semibold tracking-tight">LA’BATNA</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-ink/45">لعبتنا · game day</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link
              to="/"
              className={`rounded-full px-3 py-2 transition-colors ${onHome ? 'bg-white text-deep shadow-sm' : 'text-ink/60 hover:bg-white/60'}`}
            >
              Home
            </Link>
            <Link
              to="/games"
              className={`rounded-full px-3 py-2 transition-colors ${!onHome ? 'bg-white text-deep shadow-sm' : 'text-ink/60 hover:bg-white/60'}`}
            >
              Games
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:pt-10">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-10 text-center text-xs text-ink/40">
        LA’BATNA keeps the rules, the family keeps the fun.
      </footer>
    </div>
  );
}