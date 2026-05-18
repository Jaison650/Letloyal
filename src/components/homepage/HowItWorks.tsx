'use client';
import { motion } from 'framer-motion';
import { Settings2, QrCode, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: <Settings2 size={28} />,
    title: 'Set Up Your Program',
    desc: 'Sign up, choose visit-based or spend-based rewards, and set your threshold. Your QR code is ready instantly.',
  },
  {
    num: '02',
    icon: <QrCode size={28} />,
    title: 'Display Your QR',
    desc: 'Print it, frame it, or show it on your phone. Customers scan and automatically join — no app needed.',
  },
  {
    num: '03',
    icon: <TrendingUp size={28} />,
    title: 'Watch Customers Return',
    desc: "Your dashboard shows who's earning, who's close to a reward, and your real re-scan rate.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="font-sora font-extrabold text-3xl sm:text-4xl text-text-dark">
            Live in 10 Minutes Flat
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center text-primary mx-auto mb-5">
                {step.icon}
              </div>
              <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">{step.num}</p>
              <h3 className="font-sora font-bold text-lg text-text-dark mb-3">{step.title}</h3>
              <p className="text-text-medium text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
