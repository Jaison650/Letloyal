'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, CheckCircle2, BarChart3,
  QrCode, LogOut, Menu, X, Zap, Star, Bell, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '@/components/ui/Badge';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  pulse?: boolean;
}

interface DashboardShellProps {
  slug: string;
  merchantName: string;
  planTier: string;
  logoSvg: string;
  brandColor: string;
  children: React.ReactNode;
}

export default function DashboardShell({
  slug, merchantName, planTier, logoSvg, brandColor, children
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoToastDismissed, setDemoToastDismissed] = useState(false);
  const [clock, setClock] = useState('');
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const dismissed = localStorage.getItem('letloyal_demo_dismissed') === '1';
    if (dismissed) setDemoToastDismissed(true);
  }, []);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const h = now.getHours();
      setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
      setClock(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const navItems: NavItem[] = [
    { label: 'Dashboard',  icon: <LayoutDashboard size={18} />, href: `/merchant/${slug}` },
    { label: 'Campaigns',  icon: <Target         size={18} />, href: `/merchant/${slug}/campaigns` },
    { label: 'Customers',  icon: <Users          size={18} />, href: `/merchant/${slug}/customers` },
    { label: 'Validate',   icon: <CheckCircle2   size={18} />, href: `/merchant/${slug}/validate`, pulse: true },
    { label: 'Analytics',  icon: <BarChart3      size={18} />, href: `/merchant/${slug}/analytics` },
    { label: 'Feedback',   icon: <Star           size={18} />, href: `/merchant/${slug}/feedback` },
    { label: 'Notify',     icon: <Bell           size={18} />, href: `/merchant/${slug}/notifications` },
  ];

  const isActive = (href: string) => {
    if (href === `/merchant/${slug}`) return pathname === href;
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    await fetch('/api/merchant/auth/logout', { method: 'POST' });
    router.push('/merchant/login');
  }

  const NavLinks = ({ dark = false }: { dark?: boolean }) => (
    <>
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer group',
              dark
                ? active
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
                : active
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-text-medium hover:bg-brand-bg hover:text-primary'
            )}
            aria-label={item.label}
          >
            <span className={clsx(
              'shrink-0 transition-transform duration-150 group-hover:scale-110',
              dark ? (active ? 'text-white' : 'text-white/60') : (active ? 'text-white' : 'text-text-light')
            )}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.pulse && (
              <span className={clsx('w-2 h-2 rounded-full animate-pulse shrink-0', dark ? 'bg-accent' : 'bg-accent')} />
            )}
            {active && !dark && <ChevronRight size={14} className="text-white/70 shrink-0" />}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-brand-bg flex">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-40"
        style={{ background: 'linear-gradient(180deg, #012d38 0%, #014451 40%, #028090 100%)' }}
      >
        {/* LetLoyal brand */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
              <QrCode size={15} className="text-[#012d38]" />
            </div>
            <span className="font-sora font-bold text-lg text-white tracking-tight">LetLoyal</span>
          </Link>
        </div>

        {/* Merchant profile */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div
              className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: `${brandColor}30` }}
              dangerouslySetInnerHTML={{ __html: logoSvg }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-white truncate">{merchantName}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent/90 mt-0.5">
                <Zap size={9} /> {planTier.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          <NavLinks dark />
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="px-3 py-2 rounded-xl bg-white/5 text-center">
            <p className="text-[10px] text-white/40 font-medium">🎬 Demo Mode</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 font-medium"
            aria-label="Sign out"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 h-14 flex items-center justify-between border-b border-white/10"
        style={{ background: 'linear-gradient(90deg, #014451, #028090)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <QrCode size={14} className="text-[#012d38]" />
          </div>
          <span className="font-sora font-bold text-white text-sm">{merchantName}</span>
        </div>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="p-2 text-white/80">
          <Menu size={22} />
        </button>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute left-0 top-0 h-full w-72 flex flex-col shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #012d38 0%, #014451 40%, #028090 100%)' }}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
                  <QrCode size={14} className="text-[#012d38]" />
                </div>
                <span className="font-sora font-bold text-white">LetLoyal</span>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-white/70 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
                  style={{ background: `${brandColor}30` }}
                  dangerouslySetInnerHTML={{ __html: logoSvg }}
                />
                <div>
                  <p className="font-semibold text-sm text-white">{merchantName}</p>
                  <span className="text-[10px] font-bold text-accent/80">{planTier.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
              <NavLinks dark />
            </nav>
            <div className="p-3 border-t border-white/10">
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-all">
                <LogOut size={18} /><span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen overflow-x-hidden">
        {/* Demo banner */}
        {!demoToastDismissed && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-800 font-medium">
              🎬 <strong>Demo Mode</strong> — Merchant data is pre-seeded for demonstration purposes.
            </p>
            <button
              onClick={() => { setDemoToastDismissed(true); localStorage.setItem('letloyal_demo_dismissed', '1'); }}
              className="text-amber-600 hover:text-amber-800 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-brand-border sticky top-0 z-20">
          <div>
            <h2 className="font-sora font-bold text-xl text-text-dark">
              {greeting ? `${greeting}, ${merchantName}!` : `Welcome, ${merchantName}!`}
            </h2>
            <p className="text-sm text-text-medium mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-sora font-bold text-2xl text-primary tabular-nums tracking-tight">{clock}</p>
            </div>
            <Link
              href={`/merchant/${slug}/validate`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #028090, #02C39A)' }}
            >
              <CheckCircle2 size={15} /> Validate
            </Link>
          </div>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border px-1 py-2 flex justify-around">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors relative',
                active ? 'text-primary' : 'text-text-light'
              )}
              aria-label={item.label}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 w-8 h-1 bg-primary rounded-full" />
              )}
              {item.icon}
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
