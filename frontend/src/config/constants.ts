export const colors = {
  primary: {
    600: '#6366f1',
    700: '#4f46e5',
  },
  secondary: {
    600: '#8b5cf6',
  },
  accent: {
    500: '#06b6d4',
  },
  dark: {
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
  },
  light: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
  },
} as const;

export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
} as const;

export const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'AI Technology', href: '#ai' },
  { label: 'Pricing', href: '#pricing' },
] as const;

export const features = [
  {
    title: 'AI-Powered Companions',
    description: 'Experience pets with advanced AI that learn and grow with you.',
    icon: '🤖',
  },
  {
    title: 'Real-time Emotions',
    description: 'Pets respond with realistic emotions and behaviors.',
    icon: '😊',
  },
  {
    title: 'Skill Development',
    description: 'Learn real-world skills through interactive pet care.',
    icon: '📚',
  },
  {
    title: 'Multi-Device Sync',
    description: 'Access your pet from any device, anytime.',
    icon: '📱',
  },
] as const;
