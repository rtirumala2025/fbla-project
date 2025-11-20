/**
 * App Navigation Configuration
 * Defines navigation links for the application
 */
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Gamepad2,
  Droplets,
  Moon,
  ShoppingBag,
  BarChart3,
  User,
  HeartPulse,
  CircleDollarSign,
  Sparkles,
  HelpCircle,
  Palette,
} from 'lucide-react';

export type AppNavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  ariaLabel?: string;
  category?: 'core' | 'care' | 'insights' | 'extras';
};

export const primaryNav: AppNavLink[] = [
  {
    to: '/dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    ariaLabel: 'Dashboard overview',
    category: 'core',
  },
  // Feed and Play removed - integrated into Dashboard
  {
    to: '/clean',
    label: 'Clean',
    icon: Droplets,
    ariaLabel: 'Clean pet',
    category: 'care',
  },
  {
    to: '/rest',
    label: 'Rest',
    icon: Moon,
    ariaLabel: 'Rest time',
    category: 'care',
  },
];

export const secondaryNav: AppNavLink[] = [
  {
    to: '/shop',
    label: 'Shop',
    icon: ShoppingBag,
    ariaLabel: 'Open shop',
    category: 'extras',
  },
  {
    to: '/customize/avatar',
    label: 'Avatar Studio',
    icon: Palette,
    ariaLabel: 'Customize pet avatar',
    category: 'extras',
  },
  {
    to: '/budget',
    label: 'Budget',
    icon: BarChart3,
    ariaLabel: 'Open budget dashboard',
    category: 'insights',
  },
  {
    to: '/health',
    label: 'Health',
    icon: HeartPulse,
    ariaLabel: 'Track health',
    category: 'insights',
  },
  // Earn removed - integrated into Dashboard
  {
    to: '/profile',
    label: 'Profile',
    icon: User,
    ariaLabel: 'Open profile',
    category: 'core',
  },
  {
    to: '/help',
    label: 'Help',
    icon: HelpCircle,
    ariaLabel: 'Get help',
    category: 'extras',
  },
];

