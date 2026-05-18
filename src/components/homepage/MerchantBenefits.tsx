'use client';
import { motion } from 'framer-motion';
import { Sparkles, Smartphone, Target, BarChart3, MapPin, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: <Sparkles size={22} />,    title: 'Live in 10 Minutes',      desc: 'No complex setup, no POS integration, no hardware required.' },
  { icon: <Smartphone size={22} />,  title: 'No App for Customers',    desc: 'Customers scan with any phone camera — instant loyalty, zero friction.' },
  { icon: <Target size={22} />,      title: 'Visit & Spend Campaigns', desc: 'Run stamp-style or points-based rewards, or both simultaneously.' },
  { icon: <BarChart3 size={22} />,   title: 'Live Dashboard',          desc: "See today's scans, active customers, and redemptions in real time." },
  { icon: <MapPin size={22} />,      title: 'Multi-Location Ready',    desc: 'One customer account works across all your locations seamlessly.' },
  { icon: <ShieldCheck size={22} />, title: 'GDPR Compliant',          desc: 'Privacy-first by design. Customer data is never sold or shared.' },
];

export default function MerchantBenefits() {
  return (
    <section className="py-24 px-4 bg-brand-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">Why LetLoyal</p>
          <h2 className="font-sora font-extrabold text-3xl sm:text-4xl text-text-dark">
            Everything You Need, Nothing You Don&apos;t
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-brand-border p-6 shadow-card"
            >
              <div className="w-11 h-11 bg-primary-light rounded-xl flex items-center justify-center text-primary mb-4">
                {f.icon}
              </div>
              <h3 className="font-sora font-bold text-base text-text-dark mb-2">{f.title}</h3>
              <p className="text-sm text-text-medium leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
