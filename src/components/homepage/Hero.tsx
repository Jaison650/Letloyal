'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-20 pb-28 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>
      <div className="max-w-5xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-accent/15 text-primary font-semibold text-sm px-4 py-2 rounded-full mb-6 border border-accent/30"
        >
          <Sparkles size={14} /> QR-first loyalty for SMB merchants
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="font-jakarta font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] text-text-dark mb-6"
        >
          Give Every Customer<br />
          <span className="text-gradient">a Reason to Come Back</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-lg sm:text-xl text-text-medium max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          LetLoyal turns your QR code into a professional loyalty program.
          No app downloads. No hardware. Live in 10 minutes.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/merchant/login" className="btn-primary px-8 py-4 text-base">
            Get Started Free
          </Link>
          <Link href="/store/brewhouse-cafe" className="btn-secondary px-8 py-4 text-base">
            See Live Demo
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
