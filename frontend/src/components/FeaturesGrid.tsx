import { motion } from 'framer-motion';
import { FeatureCard } from './FeatureCard';

export const FeaturesGrid = () => {
  // Varied copy - not generic
  const features = [
    {
      title: 'Pick your companion',
      description: 'Dogs bark. Cats meow. Birds chirp. Each with their own quirks and preferences.',
      link: '#pets',
      gradient: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600',
      size: 'large' as const, // Intentionally larger
    },
    {
      title: 'Mini-games that don\'t suck',
      description: 'Fetch. Puzzles. Dream worlds. Actually fun, not just tapping buttons.',
      link: '#games',
      gradient: 'bg-gradient-to-br from-rose-500 via-pink-600 to-red-600',
    },
    {
      title: 'Care without the guilt',
      description: 'Feed them. Play with them. Watch them thrive. Or struggle. Your call.',
      link: '#care',
      gradient: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600',
    },
    {
      title: 'Shop for stuff',
      description: 'Toys, food, medicine. Spend wisely or watch your budget cry.',
      link: '#shop',
      gradient: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600',
      size: 'large' as const,
    },
    {
      title: 'Learn money stuff',
      description: 'Budget. Track expenses. Actually understand where your coins go.',
      link: '#finance',
      gradient: 'bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800',
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-900/50" id="features">
      <div className="max-w-7xl mx-auto">
        {/* Header with human voice */}
        <motion.div
          className="max-w-3xl mb-16 md:mb-20"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 rounded-full px-5 py-2 mb-6">
            <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
              What You Get
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-50 mb-6 leading-tight">
            Everything you need.
            <br />
            <span className="text-slate-400">Nothing you don't.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
            No fluff. Just the tools to raise a digital pet that actually feels alive.
          </p>
        </motion.div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Bottom accent (not centered) */}
        <motion.div
          className="mt-16 flex justify-end"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="text-sm text-slate-500 italic">
            And we're adding more. Constantly.
          </div>
        </motion.div>
      </div>
    </section>
  );
};
