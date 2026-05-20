'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, CheckCircle2, BarChart3,
  LogOut, Menu, X, Zap, Star, Bell, ChevronRight,
  MoreHorizontal, Maximize2, Settings
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '@/components/ui/Badge';
import QRKioskOverlay from '@/components/merchant/QRKioskOverlay';

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
  /** Pass these so the mobile QR bottom-nav button opens the full kiosk overlay */
  qrDataUrl?: string;
  campaignId?: string;
  rewardDescription?: string;
  rewardThreshold?: number;
  campaignType?: 'visit_based' | 'spend_based';
  qrOverlayNode?: React.ReactNode;
}

export default function DashboardShell({
  slug, merchantName, planTier, logoSvg, brandColor, children,
  qrDataUrl, campaignId, rewardDescription = '', rewardThreshold = 0,
  campaignType = 'visit_based', qrOverlayNode,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [kioskOpen, setKioskOpen] = useState(false);
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

  const primaryNav: NavItem[] = [
    { label: 'Dashboard',  icon: <LayoutDashboard size={18} />, href: `/merchant/${slug}` },
    { label: 'Campaigns',  icon: <Target         size={18} />, href: `/merchant/${slug}/campaigns` },
    { label: 'Customers',  icon: <Users          size={18} />, href: `/merchant/${slug}/customers` },
    { label: 'Validate',   icon: <CheckCircle2   size={18} />, href: `/merchant/${slug}/validate`, pulse: true },
    { label: 'Analytics',  icon: <BarChart3      size={18} />, href: `/merchant/${slug}/analytics` },
    { label: 'Feedback',   icon: <Star           size={18} />, href: `/merchant/${slug}/feedback` },
    { label: 'Notify',     icon: <Bell           size={18} />, href: `/merchant/${slug}/notifications` },
    { label: 'Settings',   icon: <Settings       size={18} />, href: `/merchant/${slug}/settings` },
  ];

  const isActive = (href: string) => {
    if (href === `/merchant/${slug}`) return pathname === href;
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    await fetch('/api/merchant/auth/logout', { method: 'POST' });
    router.push('/merchant/login');
  }

  const SidebarLinks = () => (
    <>
      {primaryNav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer group',
              active
                ? 'bg-white/15 text-white font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            <span className={clsx('shrink-0 transition-transform duration-150 group-hover:scale-110',
              active ? 'text-white' : 'text-white/60')}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.pulse && <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />}
            {active && <ChevronRight size={14} className="text-white/40 shrink-0" />}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-brand-bg flex">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-40"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #134E4A 60%, #0D9488 100%)' }}
      >
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
              <line x1="13" y1="9" x2="13" y2="44" stroke="white" strokeWidth="7" strokeLinecap="round"/>
              <line x1="13" y1="44" x2="34" y2="44" stroke="white" strokeWidth="7" strokeLinecap="round"/>
              <line x1="22" y1="35" x2="46" y2="10" stroke="#CCFBF1" strokeWidth="5.5" strokeLinecap="round"/>
              <polyline points="35,10 46,10 46,22" stroke="#CCFBF1" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-jakarta font-bold text-lg text-white tracking-tight"><span className="font-medium text-[#5EEAD4]">Let</span>Loyal</span>
          </Link>
        </div>

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

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          <SidebarLinks />
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="px-3 py-2 rounded-xl bg-white/5 text-center">
            <p className="text-[10px] text-white/40 font-medium">🎬 Demo Mode</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 font-medium"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 px-3 h-14 flex items-center justify-between border-b border-white/10"
        style={{ background: 'linear-gradient(135deg, #134E4A, #0D9488)' }}
      >
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="56" rx="13" fill="#0D9488"/>
            <line x1="13" y1="9" x2="13" y2="44" stroke="white" strokeWidth="7" strokeLinecap="round"/>
            <line x1="13" y1="44" x2="34" y2="44" stroke="white" strokeWidth="7" strokeLinecap="round"/>
            <line x1="22" y1="35" x2="46" y2="10" stroke="#CCFBF1" strokeWidth="5.5" strokeLinecap="round"/>
            <polyline points="35,10 46,10 46,22" stroke="#CCFBF1" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-jakarta font-bold text-white text-sm">{merchantName}</span>
        </div>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="p-2 text-white/80">
          <Menu size={22} />
        </button>
      </div>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute left-0 top-0 h-full w-72 flex flex-col shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #0F172A 0%, #134E4A 60%, #0D9488 100%)' }}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="28" height="28" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                  <line x1="13" y1="9" x2="13" y2="44" stroke="white" strokeWidth="7" strokeLinecap="round"/>
                  <line x1="13" y1="44" x2="34" y2="44" stroke="white" strokeWidth="7" strokeLinecap="round"/>
                  <line x1="22" y1="35" x2="46" y2="10" stroke="#CCFBF1" strokeWidth="5.5" strokeLinecap="round"/>
                  <polyline points="35,10 46,10 46,22" stroke="#CCFBF1" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-jakarta font-bold text-white"><span className="font-medium text-[#5EEAD4]">Let</span>Loyal</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/70 hover:text-white">
                <X size={22} />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
                  style={{ background: `${brandColor}30` }}
                  dangerouslySetInnerHTML={{ __html: logoSvg }} />
                <div>
                  <p className="font-semibold text-sm text-white">{merchantName}</p>
                  <span className="text-[10px] font-bold text-accent/80">{planTier.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
              <SidebarLinks />
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
      <main className="flex-1 min-w-0 lg:ml-64 pt-14 lg:pt-0 min-h-screen overflow-x-hidden">
        {!demoToastDismissed && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-800 font-medium">
              🎬 <strong>Demo Mode</strong> — Merchant data is pre-seeded for demonstration purposes.
            </p>
            <button onClick={() => { setDemoToastDismissed(true); localStorage.setItem('letloyal_demo_dismissed', '1'); }}
              className="text-amber-600 hover:text-amber-800 shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-brand-border sticky top-0 z-20">
          <div>
            <h2 className="font-jakarta font-bold text-xl text-text-dark">
              {greeting ? `${greeting}, ${merchantName}!` : `Welcome, ${merchantName}!`}
            </h2>
            <p className="text-sm text-text-medium mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-jakarta font-bold text-2xl text-primary tabular-nums tracking-tight">{clock}</p>
            <Link
              href={`/merchant/${slug}/validate`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0D9488, #5EEAD4)' }}
            >
              <CheckCircle2 size={15} /> Validate
            </Link>
          </div>
        </div>

        <div className="p-3 xs:p-4 lg:p-8 max-w-7xl mx-auto pb-28 lg:pb-8">
          {children}
        </div>
      </main>

      {/* ── QR Kiosk Overlay (passed from parent, or opened by mobile QR btn) */}
      {qrOverlayNode}

      {/* Mobile QR kiosk — opened by bottom nav button */}
      {campaignId && (
        <QRKioskOverlay
          isOpen={kioskOpen}
          onClose={() => setKioskOpen(false)}
          qrDataUrl={qrDataUrl ?? ''}
          merchantName={merchantName}
          merchantSlug={slug}
          campaignId={campaignId}
          logoSvg={logoSvg}
          brandColor={brandColor}
          rewardDescription={rewardDescription}
          campaignType={campaignType}
          rewardThreshold={rewardThreshold}
        />
      )}

      {/* ── Mobile Bottom Nav — 4 slots ─────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border safe-bottom">
        <div className="flex items-end justify-around px-1 pb-safe pt-1" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>

          {/* Dashboard */}
          <Link href={`/merchant/${slug}`}
            className={clsx('flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors relative',
              isActive(`/merchant/${slug}`) ? 'text-primary' : 'text-text-light')}>
            {isActive(`/merchant/${slug}`) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
            <LayoutDashboard size={20} />
            <span className="text-[9px] font-semibold">Home</span>
          </Link>

          {/* Validate */}
          <Link href={`/merchant/${slug}/validate`}
            className={clsx('flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors relative',
              isActive(`/merchant/${slug}/validate`) ? 'text-primary' : 'text-text-light')}>
            {isActive(`/merchant/${slug}/validate`) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
            <div className="relative">
              <CheckCircle2 size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
            <span className="text-[9px] font-semibold">Validate</span>
          </Link>

          {/* ── QR CENTER BUTTON ── */}
          <div className="flex flex-col items-center flex-1 -mt-5">
            <button
              onClick={() => setKioskOpen(true)}
              className="w-14 h-14 rounded-2xl shadow-btn-hover flex flex-col items-center justify-center gap-0.5 text-white transition-all active:scale-95 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #134E4A, #0D9488)' }}
              aria-label="Show QR code"
            >
              <Maximize2 size={18} className="text-accent" />
              <span className="text-[8px] font-bold text-white/80">QR</span>
            </button>
            <span className="text-[9px] font-semibold text-primary mt-1">QR Code</span>
          </div>

          {/* Customers */}
          <Link href={`/merchant/${slug}/customers`}
            className={clsx('flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors relative',
              isActive(`/merchant/${slug}/customers`) ? 'text-primary' : 'text-text-light')}>
            {isActive(`/merchant/${slug}/customers`) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
            <Users size={20} />
            <span className="text-[9px] font-semibold">Customers</span>
          </Link>

          {/* More drawer */}
          <button
            onClick={() => setMoreOpen(true)}
            className={clsx('flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors text-text-light hover:text-primary')}>
            <MoreHorizontal size={20} />
            <span className="text-[9px] font-semibold">More</span>
          </button>
        </div>
      </nav>

      {/* ── "More" bottom sheet ──────────────────────────────────────────── */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="relative bg-white rounded-t-3xl px-4 pt-3 pb-8 space-y-1">
            <div className="w-10 h-1 bg-brand-border rounded-full mx-auto mb-3" />
            {[
              { label: 'Campaigns', icon: <Target size={18} />, href: `/merchant/${slug}/campaigns` },
              { label: 'Analytics', icon: <BarChart3 size={18} />, href: `/merchant/${slug}/analytics` },
              { label: 'Feedback',  icon: <Star size={18} />,   href: `/merchant/${slug}/feedback` },
              { label: 'Notify',    icon: <Bell size={18} />,     href: `/merchant/${slug}/notifications` },
              { label: 'Settings',  icon: <Settings size={18} />, href: `/merchant/${slug}/settings` },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-colors',
                  isActive(item.href) ? 'bg-primary-light text-primary font-semibold' : 'text-text-dark hover:bg-brand-bg'
                )}
              >
                <span className="text-text-medium">{item.icon}</span>
                {item.label}
                <ChevronRight size={16} className="ml-auto text-text-light" />
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm text-status-error hover:bg-red-50 font-medium transition-colors"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
