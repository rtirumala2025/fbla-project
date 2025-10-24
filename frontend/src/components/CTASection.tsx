import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="py-24 md:py-32 px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)
              `,
              backgroundSize: '200% 200%',
            }}
          />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-sm font-bold text-white">Ready to start?</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Your pet is waiting.
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Sign up free. Pick a pet. Start learning. It takes like 2 minutes.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <a
            href="#start"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:-translate-y-1 transition-all group"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          
          <a
            href="#demo"
            className="inline-flex items-center gap-2 bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 hover:border-white/50 transition-all"
          >
            Watch Demo
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span>No credit card required</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/30"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span>Free forever</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/30"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span>Cancel anytime</span>
          </div>
        </motion.div>
      </div>

      {/* Floating elements */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </section>
  );
};
