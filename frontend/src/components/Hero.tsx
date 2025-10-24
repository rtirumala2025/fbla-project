import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from './common/Button';
import { animations } from '@/config/constants';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container">
        {/* Badge */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-600/30 rounded-full px-6 py-2 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-indigo-400">AI-Powered Virtual Pet Platform</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-center mb-6 bg-gradient-to-r from-slate-50 via-indigo-400 to-violet-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Your pet learns.
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            You grow together.
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-lg md:text-xl text-slate-400 text-center max-w-3xl mx-auto mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Experience the future of virtual pet care with AI companions that adapt, evolve, and teach real-world skills through meaningful interactions.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button variant="primary" size="lg" href="#start">
            Start Your Journey
          </Button>
          <Button variant="secondary" size="lg" href="#demo">
            Watch Demo
          </Button>
        </motion.div>

        {/* Pet Preview Card */}
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="relative bg-gradient-to-br from-slate-800 to-indigo-600/10 rounded-3xl border border-slate-800 p-8 md:p-12 shadow-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e510_1px,transparent_1px),linear-gradient(to_bottom,#4f46e510_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            {/* Pet Display */}
            <motion.div
              className="text-9xl text-center mb-8 filter drop-shadow-2xl"
              animate={{
                y: [0, -20, 0],
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              🐕
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['❤️', '⚡', '🎨', '🧼', '💪'].map((icon, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-medium text-slate-300">
                      {['Health', 'Energy', 'Happy', 'Clean', 'Strong'][i]}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      style={{ width: `${[85, 70, 95, 60, 75][i]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
