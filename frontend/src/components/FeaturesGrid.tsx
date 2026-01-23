import { motion } from 'framer-motion';
import { FeatureCard } from './FeatureCard';

export const FeaturesGrid = () => {
  // Varied copy - not generic
  const features = [
    {
      title: 'Choose Your Pet!',
      description: 'Dogs, cats, birds, or bunnies — pick your favorite friend!',
      link: '#pets',
      gradient: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600',
      size: 'large' as const,
    },
    {
      title: 'Play Fun Games!',
      description: 'Race, jump, and play with your pet to earn coins!',
      link: '#games',
      gradient: 'bg-gradient-to-br from-rose-500 via-pink-600 to-red-600',
    },
    {
      title: 'Keep Your Pet Happy!',
      description: 'Feed, play, and clean your pet to keep them healthy!',
      link: '#care',
      gradient: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600',
    },
    {
      title: 'Visit the Pet Shop!',
      description: 'Buy cool toys, yummy treats, and accessories for your pet!',
      link: '#shop',
      gradient: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600',
      size: 'large' as const,
    },
    {
      title: 'Learn About Money!',
      description: 'Save your coins, spend wisely, and track your budget!',
      link: '#finance',
      gradient: 'bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800',
    },
  ];

  return (
    <section className="py-16 md:py-20 px-6 bg-white" id="features">
      <div className="max-w-7xl mx-auto">
        {/* Header with human voice */}
        <motion.div
          className="max-w-3xl mb-12 md:mb-14"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 rounded-full px-5 py-2 mb-6">
            <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
              So Much To Do!
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Take care of your pet,
            <br />
            <span className="text-gray-600">and learn about money!</span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            There are so many fun ways to play and learn with your new best friend.
          </p>
        </motion.div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>


      </div>
    </section>
  );
};
