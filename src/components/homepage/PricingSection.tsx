'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const PRICING = [
  {
    name: 'Free', price: '€0', period: '/month', highlight: false,
    cta: 'Get Started Free', href: '/merchant/login',
    features: ['2 active campaigns', 'Up to 500 customers', 'Basic analytics', 'QR code generator'],
  },
  {
    name: 'Starter', price: '€49', period: '/month', highlight: true,
    cta: 'Start Starter Plan', href: '/merchant/login',
    features: ['5 active campaigns', 'Up to 1,000 customers', 'Full analytics', 'Email support', 'CSV exports'],
  },
  {
    name: 'Professional', price: '€99', period: '/month', highlight: false,
    cta: 'Go Professional', href: '/merchant/login',
    features: ['Unlimited campaigns', 'Up to 5,000 customers', 'Multi-location', 'Priority support', 'Advanced analytics', 'API access'],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="font-jakarta font-extrabold text-3xl sm:text-4xl text-text-dark mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-text-medium max-w-xl mx-auto">
            Start free. Upgrade when you need more. No contracts, cancel anytime.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className={`rounded-2xl border p-7 flex flex-col ${
                plan.highlight
                  ? 'border-primary bg-primary text-white shadow-xl scale-[1.02]'
                  : 'border-brand-border bg-white shadow-card'
              }`}
            >
              <p className={`font-jakarta font-bold text-lg mb-1 ${plan.highlight ? 'text-white' : 'text-text-dark'}`}>
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`font-jakarta font-extrabold text-4xl ${plan.highlight ? 'text-white' : 'text-text-dark'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-text-light'}`}>{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={15} className={plan.highlight ? 'text-accent-light' : 'text-accent'} />
                    <span className={plan.highlight ? 'text-white/90' : 'text-text-medium'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-white text-primary hover:bg-gray-50'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
