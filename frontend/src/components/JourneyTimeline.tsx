import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  number: string;
  title: string;
  description: string;
}

export const JourneyTimeline = () => {
  const steps: Step[] = [
    {
      number: '01',
      title: 'Sign up. Fast.',
      description: 'Email and password. That\'s it. No 47 fields asking for your life story.',
    },
    {
      number: '02',
      title: 'Pick your pet',
      description: 'Dog? Cat? Bird? Rabbit? Each comes with personality traits you\'ll discover.',
    },
    {
      number: '03',
      title: 'Name it',
      description: 'Give it a name. Or let the AI suggest one. Either way, it\'s yours now.',
    },
    {
      number: '04',
      title: 'Keep it alive',
      description: 'Feed it. Play with it. Clean up after it. Watch the stats. Don\'t let it die.',
    },
    {
      number: '05',
      title: 'Manage your budget',
      description: 'Earn coins. Spend coins. Learn what happens when you overspend. It\'s like real life but less stressful.',
    },
    {
      number: '06',
      title: 'Watch it grow',
      description: 'Your pet evolves. You get better at this. Maybe you both level up.',
    },
  ];

  return (
    <section className="py-16 md:py-20 px-6 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-block bg-cyan-500/10 border border-cyan-500/20 rounded-full px-5 py-2 mb-6">
            <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
              How It Works
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4">
            Six steps.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Infinite possibilities.
            </span>
          </h2>
        </motion.div>

        {/* Non-linear timeline */}
        <div className="relative">
          {/* Connecting line (not perfectly straight) */}
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gray-300 to-transparent ml-6" />

          {/* Steps */}
          <div className="space-y-10 md:space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`relative grid md:grid-cols-12 gap-8 items-center ${
                  index % 2 === 0 ? '' : 'md:flex-row-reverse'
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Step number indicator */}
                <div className="hidden md:flex absolute left-0 w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-500/50">
                  <Check className="w-6 h-6" />
                </div>

                {/* Content - alternating sides */}
                <div className={`md:col-span-5 ${
                  index % 2 === 0 ? 'md:col-start-3' : 'md:col-start-8'
                }`}>
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-indigo-500/50 transition-colors shadow-lg hover:shadow-xl">
                    <div className="text-sm font-bold text-indigo-400 mb-2">
                      Step {step.number}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Visual placeholder - alternating sides */}
                <div className={`md:col-span-4 ${
                  index % 2 === 0 ? 'md:col-start-8' : 'md:col-start-1'
                }`}>
                  <div className={`h-48 md:h-64 rounded-2xl overflow-hidden ${
                    index % 3 === 0 ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' :
                    index % 2 === 0 ? 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20' :
                    'bg-gradient-to-br from-rose-500/20 to-pink-500/20'
                  }`}>
                    {/* Decorative element */}
                    <div className="w-full h-full flex items-center justify-center opacity-30">
                      <div className="text-6xl">
                        {['🐶', '🐱', '🐰', '🐦', '🐢', '🦊'][index % 6]}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
