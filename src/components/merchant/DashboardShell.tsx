'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, CheckCircle2, BarChart3,
  Settings2, QrCode, LogOut, Menu, X, Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '@/components/ui/Badge';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
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
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: `/merchant/${slug}` },
    { label: 'Campaigns', icon: <Target size={20} />, href: `/merchant/${slug}/campaigns` },
    { label: 'Customers', icon: <Users size={20} />, href: `/merchant/${slug}/customers` },
    { label: 'Validate', icon: <CheckCircle2 size={20} />, href: `/merchant/${slug}/validate` },
    { label: 'Analytics', icon: <BarChart3 size={20} />, href: `/merchant/${slug}/analytics` },
  ];

  const isActive = (href: string) => {
    if (href === `/merchant/${slug}`) return pathname === href;
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    await fetch('/api/merchant/auth/logout', { method: 'POST' });
    router.push('/merchant/login');
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={clsx('sidebar-link', isActive(item.href) && 'active')}
          aria-label={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.label === 'Validate' && (
            <span className="ml-auto w-2 h-2 rounded-full bg-accent animate-pulse" />
          )}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex merchant-sidebar flex-col">
        <div className="px-6 py-5 border-b border-brand-border">
          <Link href="/" className="flex items-center gap-2">
            <QrCode size={22} className="text-primary" />
            <span className="font-sora font-800 text-lg text-primary">LetLoyal</span>
          </Link>
        </div>

        <div className="px-4 py-5 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
              dangerouslySetInnerHTML={{ __html: logoSvg }}
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-text-dark truncate">{merchantName}</p>
              <Badge variant="pro" className="mt-0.5">
                <Zap size={10} /> {planTier}
              </Badge>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-brand-border space-y-2">
          <Badge variant="demo" className="w-full justify-center py-1.5">🎬 Demo Mode</Badge>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-text-light hover:text-status-error hover:bg-red-50"
            aria-label="Sign out"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-brand-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: logoSvg }} />
          <span className="font-sora font-bold text-primary text-sm">{merchantName}</span>
        </div>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="p-2 text-text-medium">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <QrCode size={20} className="text-primary" />
                <span className="font-sora font-bold text-primary">LetLoyal</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={22} /></button>
            </div>
            <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
              <NavLinks />
            </nav>
            <div className="p-4 border-t border-brand-border">
              <button onClick={handleLogout} className="sidebar-link w-full text-text-light">
                <LogOut size={18} /><span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen overflow-x-hidden">
        {/* Demo banner */}
        {!demoToastDismissed && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-yellow-800 font-medium">
              🎬 <strong>Demo Mode</strong> — Merchant data is pre-seeded for demonstration purposes.
            </p>
            <button onClick={() => { setDemoToastDismissed(true); localStorage.setItem('letloyal_demo_dismissed', '1'); }} className="text-yellow-600 hover:text-yellow-800 shrink-0">
              <X size={14} />
            </button>
          </div>
        )}
        {/* Desktop content top bar with live clock */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-brand-border sticky top-0 z-20">
          <div>
            <h2 className="font-sora font-bold text-xl">
              {greeting ? `${greeting}, ${merchantName}!` : `Welcome, ${merchantName}!`}
            </h2>
            <p className="text-sm text-text-medium mt-0.5">{dateStr}</p>
          </div>
          <div className="font-sora font-bold text-2xl text-primary tabular-nums tracking-tight">
            {clock}
          </div>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border px-2 py-2 flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[44px]',
              isActive(item.href) ? 'text-primary bg-primary-light' : 'text-text-light'
            )}
            aria-label={item.label}
          >
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
