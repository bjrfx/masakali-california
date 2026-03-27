import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay }} className={className}>
      {children}
    </motion.div>
  );
}

export default function Contact() {
  return (
    <div className="min-h-screen pt-20 relative">
      <div className="indian-mandala-tl" /><div className="indian-mandala-br" />

      {/* Hero */}
      <section className="py-20 bg-pattern bg-indian-paisley relative overflow-hidden bg-indian-arch">
        <div className="indian-vine-left" /><div className="indian-vine-right" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <AnimatedSection>
            <span className="text-amber-500 dark:text-amber-400 text-sm font-semibold uppercase tracking-wider">Contact Us</span>
            <div className="section-divider !mx-0" />
            <h1 className="font-display text-5xl md:text-6xl font-bold text-neutral-900 dark:text-white mt-4 mb-4">Get in <span className="text-gold-gradient">Touch</span></h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg max-w-2xl">Have a question, feedback, or just want to say hello? We'd love to hear from you.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-neutral-50 dark:bg-dark-950 bg-indian-jali relative overflow-hidden">
        <div className="indian-vine-left" /><div className="indian-vine-right" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MapPin, title: 'Our Location', lines: ['10310 S De Anza Blvd', 'Cupertino, CA 95014, USA'] },
              { icon: Phone, title: 'Phone', lines: ['Now Open', 'Contact us via email'] },
              { icon: Mail, title: 'Email', lines: ['contact@masakalicalifornia.com'] },
              { icon: Clock, title: 'Hours', lines: ['Daily', 'Please call for current timings'] },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimatedSection key={item.title} delay={i * 0.1}>
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm dark:shadow-none h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon size={20} className="text-amber-500 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-neutral-900 dark:text-white font-semibold text-sm mb-1">{item.title}</h3>
                        {item.lines.map((line, j) => <p key={j} className="text-neutral-500 text-sm">{line}</p>)}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
