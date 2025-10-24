import { motion } from 'framer-motion';
import { BookOpen, Award, Users, BarChart2, ArrowRight } from 'lucide-react';

const ValueCard = ({
  title,
  description,
  tags,
  visual,
  gradient,
  size = 'default',
  delay = 0,
  reverse = false,
}: {
  title: string;
  description: string;
  tags: string[];
  visual: React.ReactNode;
  gradient: string;
  size?: 'default' | 'large';
  delay?: number;
  reverse?: boolean;
}) => {
  return (
    <motion.div
      className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm transition-all duration-500 hover:border-indigo-500/50 ${
        size === 'large' ? 'md:col-span-2' : ''
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8 }}
    >
      <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        {/* Visual side */}
        <div 
          className={`p-8 md:p-12 flex-1 flex items-center justify-center ${gradient} min-h-[300px]`}
        >
          <motion.div 
            className="text-8xl"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {visual}
          </motion.div>
        </div>

        {/* Content side */}
        <div className="flex-1 p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-black text-slate-50 mb-4">
            {title}
          </h3>
          
          <p className="text-slate-400 mb-6 leading-relaxed">
            {description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag, i) => (
              <span 
                key={i}
                className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-slate-700/50 text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <a 
            href="#learn-more" 
            className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 group transition-colors"
          >
            Learn more
            <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
      
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-white/5 rounded-full" />
    </motion.div>
  );
};

export const ValueProps = () => {
  const values = [
    {
      title: 'Learn by Doing',
      description: 'No boring lectures. You learn financial responsibility by actually managing your pet\'s needs and budget.',
      tags: ['Hands-on', 'Practical', 'Engaging'],
      visual: '📚',
      gradient: 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20',
      size: 'large' as const,
    },
    {
      title: 'Real Consequences',
      description: 'Forget multiple choice. Your decisions have real impact on your pet\'s happiness and health.',
      tags: ['Accountability', 'Responsibility'],
      visual: '⚖️',
      gradient: 'bg-gradient-to-br from-rose-600/20 to-pink-600/20',
    },
    {
      title: 'Compete & Compare',
      description: 'See how others are doing. Climb the leaderboard. Or just focus on your own pet. Your call.',
      tags: ['Leaderboards', 'Social'],
      visual: '🏆',
      gradient: 'bg-gradient-to-br from-amber-600/20 to-orange-600/20',
    },
    {
      title: 'You Both Evolve',
      description: 'Pet grows from puppy to adult. You grow from novice to pro. Track progress. See patterns. Get insights.',
      tags: ['AI Insights', 'Analytics'],
      visual: '📈',
      gradient: 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20',
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-6">
            <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Why This Works
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-50 mb-4">
            Built different.
          </h2>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            No gimmicks. Just real learning through play.
          </p>
        </motion.div>

        {/* Grid with broken layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <ValueCard
              key={index}
              {...value}
              delay={index * 0.15}
              reverse={index % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
