import type { ServiceCategory } from '../types';

export const CORE_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-cleaning',
    name: 'Cleaning',
    slug: 'cleaning',
    description: 'Deep house cleaning, kitchen, and bathroom sanitation services.',
    iconName: 'Sparkles',
    isActive: true,
  },
  {
    id: 'cat-electrician',
    name: 'Electrician',
    slug: 'electrician',
    description: 'Wiring, fixtures, appliances repair, and electrical safety.',
    iconName: 'Zap',
    isActive: true,
  },
  {
    id: 'cat-plumber',
    name: 'Plumber',
    slug: 'plumber',
    description: 'Pipe repairs, leakage detection, taps, and sanitary fitting.',
    iconName: 'Wrench',
    isActive: true,
  },
  {
    id: 'cat-carpenter',
    name: 'Carpenter',
    slug: 'carpenter',
    description: 'Furniture assembly, repair, woodwork, and custom fittings.',
    iconName: 'Hammer',
    isActive: true,
  },
  {
    id: 'cat-maid',
    name: 'Maid & Housekeeping',
    slug: 'maid',
    description: 'Reliable domestic help, housekeeping, and daily chores.',
    iconName: 'Home',
    isActive: true,
  },
  {
    id: 'cat-driver',
    name: 'Driver',
    slug: 'driver',
    description: 'Verified professional drivers for personal, daily, or outstation trips.',
    iconName: 'Car',
    isActive: true,
  },
];
