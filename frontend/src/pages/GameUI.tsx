import React from 'react';
import { motion } from 'framer-motion';

export const GameUI: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
      <motion.div
        className="max-w-2xl mx-auto w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12">
          <motion.div
            className="text-6xl mb-6"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🎮
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-50 mb-4">
            Game UI
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 mb-8">
            Game UI is being built. Check back soon!
          </p>
          
          <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 rounded-full px-6 py-3">
            <span className="text-sm font-semibold text-indigo-400">
              Coming Soon
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

