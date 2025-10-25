import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  link: string;
  gradient: string;
  size?: 'default' | 'large';
  delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  link,
  gradient,
  size = 'default',
  delay = 0
}) => {
  // title is required by the prop type, so this is safe
  const showAccent = title.length % 2 === 0;

  return (
    <motion.div
      className={`group relative bg-white border-2 border-gray-300 rounded-2xl overflow-hidden hover:border-indigo-500 transition-all duration-500 shadow-lg hover:shadow-xl ${
        size === 'large' ? 'md:col-span-2' : ''
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.01 }}
    >
      {/* Gradient header with varied heights */}
      <div
        className={`${gradient} ${
          size === 'large' ? 'h-64' : 'h-48'
        } relative overflow-hidden flex items-center justify-center`}
      >
        {/* Animated gradient overlay (stable animation + backgroundSize to avoid flicker) */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
          style={{ backgroundSize: '200% 200%', backgroundPosition: '0% 0%' }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear',
          }}
        />

        {/* Custom SVG illustration */}
        <div className="relative z-10">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <div className="text-5xl filter drop-shadow-lg" aria-hidden="true">
              <svg
                className="w-16 h-16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <title>{`${title} icon`}</title>
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        <h3
          className={`font-black text-gray-900 mb-3 ${
            size === 'large' ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
          }`}
        >
          {title}
        </h3>

        <p className="text-gray-600 leading-relaxed mb-4 text-base md:text-lg">
          {description}
        </p>

        <a
          href={link}
          aria-label={`Explore ${title}`}
          className="inline-flex items-center gap-2 text-indigo-400 font-bold text-sm md:text-base group-hover:gap-4 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 rounded"
        >
          Explore
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Decorative corner accent */}
      {showAccent && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-bl-3xl" />
      )}
    </motion.div>
  );
};
