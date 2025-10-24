import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Stat {
  number: string;
  label: string;
  prefix?: string;
}

export const StatsBar = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Intentionally varied data (not perfectly round numbers)
  const stats: Stat[] = [
    { number: '1,247', label: 'Active Users' }, // Specific, not "1000+"
    { number: '4', label: 'Pet Species' },
    { number: '23', label: 'Unique Breeds' }, // Not "20+"
    { number: '97.8', label: 'Satisfaction', prefix: '%' }, // Precise, not "98%"
  ];

  return (
    <motion.div
      className="max-w-6xl mx-auto px-6 -mt-20 relative z-10"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 40 }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      {/* Intentional asymmetric container */}
      <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
          }}
        />

        {/* Stats grid with organic spacing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8 relative">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.4 + index * 0.15,
                type: "spring",
                stiffness: 100
              }}
            >
              {/* Number with varied sizing */}
              <div className={`${
                index === 0 ? 'text-5xl' : // First stat slightly larger
                index === 3 ? 'text-3xl' : // Last stat smaller
                'text-4xl'
              } font-black bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-500 bg-clip-text text-transparent mb-2 tracking-tight`}>
                {stat.number}{stat.prefix}
              </div>
              
              {/* Label with character */}
              <div className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Decorative element (not perfectly centered) */}
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl" />
      </div>
    </motion.div>
  );
};
