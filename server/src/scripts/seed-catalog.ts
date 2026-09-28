import { getPrismaClient } from '../config/database.js';
import type { PricingModel } from '@prisma/client';

export interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  iconName: string;
  services: {
    title: string;
    slug: string;
    description: string;
    pricingModel: PricingModel;
    basePrice?: number;
    durationMinutes?: number;
    includedFeatures: string[];
  }[];
}

export const CATALOG_SEED_DATA: SeedCategory[] = [
  {
    name: 'Cleaning',
    slug: 'cleaning',
    description: 'Deep house cleaning, kitchen, and bathroom sanitation services.',
    iconName: 'Sparkles',
    services: [
      {
        title: 'Full Home Deep Cleaning',
        slug: 'full-home-deep-cleaning',
        description: 'Comprehensive sanitation of all rooms, scrubbing, dusting, and floor machine buffing.',
        pricingModel: 'FIXED',
        basePrice: 1999,
        durationMinutes: 240,
        includedFeatures: ['Living room & bedrooms', 'Kitchen degreasing', 'Bathroom descaling', 'Balcony wash'],
      },
      {
        title: 'Kitchen Deep Cleaning',
        slug: 'kitchen-deep-cleaning',
        description: 'Oil, grease, and grime removal from cabinets, slabs, exhaust fan, and sink area.',
        pricingModel: 'FIXED',
        basePrice: 899,
        durationMinutes: 120,
        includedFeatures: ['Chimney outer cleaning', 'Countertop sanitation', 'Cabinet exterior wipe', 'Floor scrub'],
      },
      {
        title: 'Bathroom Sanitation & Deep Clean',
        slug: 'bathroom-sanitation-deep-clean',
        description: 'Hard-water stain removal, toilet descaling, tile joint scrubbing, and chrome polishing.',
        pricingModel: 'FIXED',
        basePrice: 499,
        durationMinutes: 60,
        includedFeatures: ['Tile descaling', 'WC & washbasin disinfection', 'Mirror & fixture polish'],
      },
      {
        title: 'Sofa & Upholstery Shampooing',
        slug: 'sofa-upholstery-shampooing',
        description: 'Dry vacuuming and fabric shampoo extraction for sofas and dining chairs.',
        pricingModel: 'PER_TASK',
        basePrice: 699,
        durationMinutes: 90,
        includedFeatures: ['Dust mite extraction', 'Spot stain treatment', 'Quick-dry conditioning'],
      },
    ],
  },
  {
    name: 'Electrician',
    slug: 'electrician',
    description: 'Wiring, fixtures, appliances repair, and electrical safety.',
    iconName: 'Zap',
    services: [
      {
        title: 'Ceiling Fan Installation & Repair',
        slug: 'ceiling-fan-installation-repair',
        description: 'Standard mounting, hook verification, balancing, regulator connection, and safety testing.',
        pricingModel: 'FIXED',
        basePrice: 299,
        durationMinutes: 60,
        includedFeatures: ['Hook inspection', 'Blade balancing', 'Switch & regulator check', 'Safety test'],
      },
      {
        title: 'Switchboard & Circuit Diagnostics',
        slug: 'switchboard-circuit-diagnostics',
        description: 'Full voltage inspection, loose wire repair, modular switch replacement, and MCB trip diagnosis.',
        pricingModel: 'PER_VISIT',
        basePrice: 199,
        durationMinutes: 45,
        includedFeatures: ['Voltage test', 'Loose connection repair', 'Short circuit trace'],
      },
      {
        title: 'Appliance Voltage & Wiring Testing',
        slug: 'appliance-voltage-wiring-testing',
        description: 'Load checking and heavy line wiring for air conditioners, geysers, and induction stoves.',
        pricingModel: 'HOURLY',
        basePrice: 349,
        durationMinutes: 60,
        includedFeatures: ['Earthing check', 'Load calculation', 'Phase verification'],
      },
      {
        title: 'MCB & Fuse Box Replacement',
        slug: 'mcb-fuse-box-replacement',
        description: 'Installation of high-sensitivity Miniature Circuit Breakers and distribution boards.',
        pricingModel: 'FIXED',
        basePrice: 449,
        durationMinutes: 90,
        includedFeatures: ['Main isolator wiring', 'Trip mechanism verification', 'Proper line labelling'],
      },
    ],
  },
  {
    name: 'Plumber',
    slug: 'plumber',
    description: 'Pipe repairs, leakage detection, taps, and sanitary fitting.',
    iconName: 'Wrench',
    services: [
      {
        title: 'Tap Repair & Leakage Fixing',
        slug: 'tap-repair-leakage-fixing',
        description: 'Washer replacement, spindle fixing, threaded seal tightening, and mixer tap repair.',
        pricingModel: 'PER_VISIT',
        basePrice: 199,
        durationMinutes: 45,
        includedFeatures: ['Leak test', 'Gasket replacement', 'Pressure check'],
      },
      {
        title: 'Toilet & Cistern Repair',
        slug: 'toilet-cistern-repair',
        description: 'Flush valve replacement, internal mechanism overhaul, and leak arrest.',
        pricingModel: 'FIXED',
        basePrice: 399,
        durationMinutes: 60,
        includedFeatures: ['Syphon inspection', 'Inlet valve overhaul', 'Seal leak check'],
      },
      {
        title: 'Water Pipe Blockage Removal',
        slug: 'water-pipe-blockage-removal',
        description: 'Drain line clearing, grease trap clean-up, and unclogging kitchen and bathroom drains.',
        pricingModel: 'FIXED',
        basePrice: 499,
        durationMinutes: 60,
        includedFeatures: ['Snake auger clearing', 'Chemical-safe flush', 'Free flow test'],
      },
      {
        title: 'Water Purifier & Geyser Plumbing',
        slug: 'water-purifier-geyser-plumbing',
        description: 'Inlet/outlet pipe installation, brass nipple fittings, and pressure relief valve setup.',
        pricingModel: 'FIXED',
        basePrice: 599,
        durationMinutes: 90,
        includedFeatures: ['Pressure compatibility check', 'Teflon seal wrapping', 'No-drip warranty'],
      },
    ],
  },
  {
    name: 'Carpenter',
    slug: 'carpenter',
    description: 'Furniture assembly, repair, woodwork, and custom fittings.',
    iconName: 'Hammer',
    services: [
      {
        title: 'Furniture Assembly & Setup',
        slug: 'furniture-assembly-setup',
        description: 'Assembly of flat-pack beds, wardrobes, study desks, and modular units.',
        pricingModel: 'HOURLY',
        basePrice: 399,
        durationMinutes: 120,
        includedFeatures: ['Hardware check', 'Level alignment', 'Firm dowel & screw securing'],
      },
      {
        title: 'Door Lock & Latch Replacement',
        slug: 'door-lock-latch-replacement',
        description: 'Mortise lock installation, cylinder replacement, tower bolts, and magnetic stoppers.',
        pricingModel: 'FIXED',
        basePrice: 299,
        durationMinutes: 60,
        includedFeatures: ['Precision mortising', 'Strike plate adjustment', 'Smooth key check'],
      },
      {
        title: 'Woodwork Repairs & Hinge Fixing',
        slug: 'woodwork-repairs-hinge-fixing',
        description: 'Hydraulic soft-close hinge fitting, loose drawer repair, and wooden channel alignment.',
        pricingModel: 'PER_TASK',
        basePrice: 249,
        durationMinutes: 45,
        includedFeatures: ['Alignment testing', 'Lubrication', 'Screw re-anchoring'],
      },
    ],
  },
  {
    name: 'Maid & Housekeeping',
    slug: 'maid',
    description: 'Reliable domestic help, housekeeping, and daily chores.',
    iconName: 'Home',
    services: [
      {
        title: 'Daily Housekeeping & Mopping',
        slug: 'daily-housekeeping-mopping',
        description: 'Dusting surfaces, sweeping floors, damp mopping with disinfectant, and garbage disposal.',
        pricingModel: 'HOURLY',
        basePrice: 249,
        durationMinutes: 60,
        includedFeatures: ['Floor mopping', 'Dusting', 'Linen straightening', 'Waste disposal'],
      },
      {
        title: 'Utensil Washing & Kitchen Chores',
        slug: 'utensil-washing-kitchen-chores',
        description: 'Scrubbing pots, washing cutlery, drying, and orderly placement in racks.',
        pricingModel: 'PER_VISIT',
        basePrice: 199,
        durationMinutes: 45,
        includedFeatures: ['Degrease scrubbing', 'Warm rinse', 'Rack stacking'],
      },
      {
        title: 'Post-Party Cleaning Assistance',
        slug: 'post-party-cleaning-assistance',
        description: 'Tidying up after dinner parties, plate clearance, trash bagging, and kitchen restoration.',
        pricingModel: 'FIXED',
        basePrice: 799,
        durationMinutes: 120,
        includedFeatures: ['Trash bagging', 'Living space tidy up', 'Counter sanitization'],
      },
    ],
  },
  {
    name: 'Driver',
    slug: 'driver',
    description: 'Verified professional drivers for personal, daily, or outstation trips.',
    iconName: 'Car',
    services: [
      {
        title: 'City Driver (Hourly Dispatch)',
        slug: 'city-driver-hourly-dispatch',
        description: 'Professional chauffeuring in your personal vehicle for intra-city transit and meetings.',
        pricingModel: 'HOURLY',
        basePrice: 199,
        durationMinutes: 120,
        includedFeatures: ['Licensed driver', 'Safe urban navigation', 'Punctual report'],
      },
      {
        title: 'Outstation Trip Driver',
        slug: 'outstation-trip-driver',
        description: 'Highway-certified driver for weekend getaways and multi-city personal tours.',
        pricingModel: 'PER_TASK',
        basePrice: 1499,
        durationMinutes: 480,
        includedFeatures: ['Highway driving experience', 'Night driving capability', 'Route familiarity'],
      },
    ],
  },
];

export async function seedCatalog(): Promise<{ categoriesCount: number; servicesCount: number }> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error('Database client unavailable');
  }

  let categoriesCount = 0;
  let servicesCount = 0;

  for (const catData of CATALOG_SEED_DATA) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: catData.slug },
      update: {
        name: catData.name,
        description: catData.description,
        iconName: catData.iconName,
        isActive: true,
      },
      create: {
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        iconName: catData.iconName,
        isActive: true,
      },
    });
    categoriesCount++;

    for (const svcData of catData.services) {
      await prisma.service.upsert({
        where: { slug: svcData.slug },
        update: {
          categoryId: category.id,
          title: svcData.title,
          description: svcData.description,
          pricingModel: svcData.pricingModel,
          basePrice: svcData.basePrice,
          durationMinutes: svcData.durationMinutes,
          includedFeatures: svcData.includedFeatures,
          isActive: true,
        },
        create: {
          categoryId: category.id,
          title: svcData.title,
          slug: svcData.slug,
          description: svcData.description,
          pricingModel: svcData.pricingModel,
          basePrice: svcData.basePrice,
          durationMinutes: svcData.durationMinutes,
          includedFeatures: svcData.includedFeatures,
          isActive: true,
        },
      });
      servicesCount++;
    }
  }

  return { categoriesCount, servicesCount };
}

// Allow direct CLI execution: npx tsx src/scripts/seed-catalog.ts
if (process.argv[1]?.endsWith('seed-catalog.ts')) {
  seedCatalog()
    .then(({ categoriesCount, servicesCount }) => {
      console.log(`[Seed Catalog] Success: Seeded ${categoriesCount} categories and ${servicesCount} services.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Catalog] Failed:', err);
      process.exit(1);
    });
}
