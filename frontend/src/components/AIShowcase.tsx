import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap, Cpu, Shield } from 'lucide-react';
import { useInView } from '../hooks/useInView';

export const AIShowcase = () => {
  const { ref, isInView } = useInView();
  
  const features = [
    {
      icon: <Brain className="w-6 h-6 text-indigo-400" />,
      title: "Advanced AI Personalization",
      description: "Your pet learns and grows based on your interactions, developing a unique personality that reflects your care style."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      title: "Emotional Intelligence",
      description: "Our AI understands and responds to your emotions, providing comfort and companionship when you need it most."
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      title: "Lightning Fast Responses",
      description: "Experience near-instant responses and smooth interactions with our optimized AI engine."
    },
    {
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      title: "Smart Learning",
      description: "Your companion remembers your preferences and adapts to your routine for a truly personalized experience."
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-400" />,
      title: "Privacy First",
      description: "Your data stays yours. We use on-device processing whenever possible to protect your privacy."
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden" id="ai">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTR2LTJoNHptLTYgMGgtNHYyaDR2LTJ6bS04IDBoLTR2Mmg0di0yem0tNiAwaC00djJoNHYtMnptLTIgNnYtMmg0djJoLTR6bTAgNnYtMmg0djJoLTR6bTAgNnYtMmg0djJoLTR6bTI0IDB2LTJoNHYyaC00em0tNiAwdjJoLTR2LTJoNHptLTYgMHYyaC00di0yaDR6bS02IDB2MmgtNHYtMmg0em0tNiAwdjJoLTR2LTJoNHptMC02aC00djJoNHYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')]" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 text-sm font-semibold text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-full mb-4">
            Powered by AI
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Smarter Than Your Average Pet
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our advanced AI technology creates a companion that learns, grows, and adapts to you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6 }}
        >
          <div className="inline-block px-4 py-2 bg-indigo-100 border border-indigo-200 rounded-full text-indigo-700 text-sm font-medium">
            <span className="flex items-center">
              <span className="flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              AI is learning and improving every day
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AIShowcase;
