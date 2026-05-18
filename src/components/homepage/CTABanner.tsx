'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTABanner() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="relative bg-primary rounded-3xl px-8 py-16 text-center overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="font-sora font-extrabold text-3xl sm:text-4xl text-white mb-4">
              Ready to Build Loyal Customers?
            </h2>
            <p className="text-white/75 text-lg mb-8 max-w-xl mx-auto">
              Join hundreds of merchants who use LetLoyal to turn one-time visitors into regulars.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/merchant/login"
                className="inline-flex items-center gap-2 bg-accent text-text-dark font-bold px-8 py-4 rounded-xl hover:bg-accent-light transition-colors"
              >
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link
                href="/store/brewhouse-cafe"
                className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors border border-white/20"
              >
                See Live Demo
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
