import { Hero } from '../components/Hero';
import { StatsBar } from '../components/StatsBar';
import { FeaturesGrid } from '../components/FeaturesGrid';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { AIShowcase } from '../components/AIShowcase';
import { ValueProps } from '../components/ValueProps';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';

export const LandingPage = () => {
  return (
    <div className="bg-white">
      <main>
        <Hero />
        <StatsBar />
        <FeaturesGrid />
        <JourneyTimeline />
        <AIShowcase />
        <ValueProps />
        <CTASection />
        <Footer />
      </main>
    </div>
  );
};
