import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from './common/Button';

export const Hero = () => {
  return (
    <section className="relative pt-20 pb-10 px-6 overflow-hidden bg-white">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-200/50 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-indigo-100 border border-indigo-200 rounded-full px-6 py-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">AI-Powered Virtual Pet Platform</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-center mb-4 bg-gradient-to-r from-gray-900 via-indigo-700 to-violet-800 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Grow Together,
          <br />
          <span className="bg-gradient-to-r from-indigo-700 via-violet-800 to-fuchsia-800 bg-clip-text text-transparent">
            One Adventure At a Time.
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-lg md:text-xl text-gray-700 text-center max-w-3xl mx-auto mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
        </motion.p>

        {/* CTA Button */}
        <motion.div
          className="flex justify-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button variant="primary" size="lg" href="#start" className="mx-auto">
            Start Your Journey
          </Button>
        </motion.div>

        {/* Pet Preview Card */}
        <motion.div
          className="max-w-6xl mx-auto"
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
