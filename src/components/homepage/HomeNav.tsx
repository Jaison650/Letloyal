'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'FAQ',          href: '#faq' },
];

export default function HomeNav() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handle, { passive: true });
    handle();
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md shadow-card border-b border-brand-border'
          : 'bg-white/60 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-sora font-extrabold text-xl text-primary shrink-0">
          <QrCode size={22} className="text-accent" />
          LetLoyal
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-medium">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-primary transition-colors">{l.label}</a>
          ))}
          <Link href="/auth/login" className="hover:text-primary transition-colors">For Customers</Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/merchant/login" className="btn-secondary py-2 px-5 text-sm">Merchant Login</Link>
          <Link href="/merchant/brewhouse-cafe" className="btn-primary py-2 px-5 text-sm">Get Started Free</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-text-medium"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile slide-down menu */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-md border-t border-brand-border"
          >
            <nav className="px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-3 text-sm font-semibold text-text-medium hover:text-primary hover:bg-primary-light rounded-xl transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="py-3 px-3 text-sm font-semibold text-text-medium hover:text-primary hover:bg-primary-light rounded-xl transition-colors"
              >
                For Customers
              </Link>
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-brand-border">
                <Link href="/merchant/login" className="btn-secondary text-center py-2.5">Merchant Login</Link>
                <Link href="/merchant/brewhouse-cafe" className="btn-primary text-center py-2.5">Get Started Free</Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
