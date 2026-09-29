import http from 'http';
import { createApp } from '../app.js';
import { getPrismaClient } from '../config/database.js';
import { hashPassword } from '../utils/password.js';

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  error?: string;
}

interface TestProviderSearchResult {
  id: string;
  businessName?: string | null;
  displayName: string;
  experienceYears: number;
  skills: Array<{ id: string; name: string }>;
  matchedService?: { serviceTitle: string; price?: number };
  isAvailableForSchedule?: boolean;
  matchScore: number;
  matchReasons: Array<{ code: string; reason: string }>;
  rating?: unknown;
  reviewCount?: unknown;
  completedJobs?: unknown;
}

interface TestAvailabilityItem {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface TestOverrideItem {
  id: string;
  date: string;
  isAvailable: boolean;
  reason?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  console.log('=== STARTING SEVASETU FUNCTIONAL PHASE 3 TEST SUITE ===');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error('Database client unavailable for testing');
  }

  const runTest = async (num: number, name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ num, name, passed: true });
      console.log(`  [PASS] Test ${num}: ${name}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      results.push({ num, name, passed: false, error: errMsg });
      console.error(`  [FAIL] Test ${num}: ${name} -> ${errMsg}`);
    }
  };

  const testId = Date.now();
  const testPassword = 'Password123!';
  const passwordHash = await hashPassword(testPassword);

  // Look up catalog services seeded in Phase 2
  const cleaningService = await prisma.service.findFirst({
    where: { category: { slug: 'cleaning' } },
    include: { category: true },
  });
  const electricalService = await prisma.service.findFirst({
    where: { category: { slug: 'electrician' } },
    include: { category: true },
  });

  if (!cleaningService || !electricalService) {
    throw new Error('Seeded catalog services not found. Ensure catalog is seeded.');
  }

  // Setup test accounts:
  // Customer
  const customerEmail = `p3_cust_${testId}@test.sevasetu.in`;
  await prisma.user.create({
    data: { email: customerEmail, fullName: 'Customer Three', passwordHash, role: 'CUSTOMER', status: 'ACTIVE' },
  });

  // 1. Eligible Provider (Sharma Cleaners)
  const provEligibleEmail = `p3_prov_eligible_${testId}@test.sevasetu.in`;
  const userProvEligible = await prisma.user.create({
    data: { email: provEligibleEmail, fullName: 'Rohit Sharma', passwordHash, role: 'PROVIDER', status: 'ACTIVE' },
  });
  const profileEligible = await prisma.serviceProviderProfile.create({
    data: {
      userId: userProvEligible.id,
      businessName: 'Sharma Deep Cleaners',
      bio: 'Professional residential deep cleaning specialists with 7 years experience.',
      experienceYears: 7,
      languages: ['Hindi', 'English'],
      serviceAreaSummary: 'Gurugram and South Delhi',
      isPubliclyListed: true,
      onboardingStatus: 'COMPLETED',
      services: {
        create: {
          serviceId: cleaningService.id,
          customTitle: 'Eco-Friendly Deep Home Cleaning',
          description: 'Comprehensive sanitization with eco-safe agents.',
          pricingModel: 'PER_VISIT',
          customPrice: 1800,
          isActive: true,
        },
      },
      skills: {
        create: {
          name: 'Home Sanitization & Deep Cleaning',
          category: 'Cleaning',
          experienceLevel: 'expert',
        },
      },
      serviceAreas: {
        create: {
          city: 'Gurugram',
          locality: 'Sector 14',
          postalCode: '122001',
          radiusKm: 15,
        },
      },
      availabilities: {
        createMany: {
          data: [
            { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', isAvailable: true },
            { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', isAvailable: true },
            { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '15:00', isAvailable: true },
            { dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '14:00', isAvailable: false },
          ],
        },
      },
    },
  });

  // 2. Incomplete Provider (not completed onboarding)
  const provIncompleteEmail = `p3_prov_incomplete_${testId}@test.sevasetu.in`;
  const userProvIncomplete = await prisma.user.create({
    data: { email: provIncompleteEmail, fullName: 'Incomplete Provider', passwordHash, role: 'PROVIDER', status: 'ACTIVE' },
  });
  await prisma.serviceProviderProfile.create({
    data: {
      userId: userProvIncomplete.id,
      businessName: 'Incomplete Cleaning Services',
      isPubliclyListed: false,
      onboardingStatus: 'NOT_STARTED',
      services: {
        create: {
          serviceId: cleaningService.id,
          isActive: true,
        },
      },
    },
  });

  // 3. Non-listed Provider (completed onboarding but private / unlisted)
  const provUnlistedEmail = `p3_prov_unlisted_${testId}@test.sevasetu.in`;
  const userProvUnlisted = await prisma.user.create({
    data: { email: provUnlistedEmail, fullName: 'Unlisted Provider', passwordHash, role: 'PROVIDER', status: 'ACTIVE' },
  });
  await prisma.serviceProviderProfile.create({
    data: {
      userId: userProvUnlisted.id,
      businessName: 'Private Cleaning Co',
      isPubliclyListed: false,
      onboardingStatus: 'COMPLETED',
      services: {
        create: {
          serviceId: cleaningService.id,
          isActive: true,
        },
      },
    },
  });

  // 4. Inactive Provider Account
  const provInactiveEmail = `p3_prov_inactive_${testId}@test.sevasetu.in`;
  const userProvInactive = await prisma.user.create({
    data: { email: provInactiveEmail, fullName: 'Suspended Provider', passwordHash, role: 'PROVIDER', status: 'INACTIVE' },
  });
  await prisma.serviceProviderProfile.create({
    data: {
      userId: userProvInactive.id,
      businessName: 'Suspended Cleaners',
      isPubliclyListed: true,
      onboardingStatus: 'COMPLETED',
      services: {
        create: {
          serviceId: cleaningService.id,
          isActive: true,
        },
      },
    },
  });

  // 5. Other Category Provider (Electrical Only)
  const provElectricalEmail = `p3_prov_elec_${testId}@test.sevasetu.in`;
  const userProvElectrical = await prisma.user.create({
    data: { email: provElectricalEmail, fullName: 'Amit Electrician', passwordHash, role: 'PROVIDER', status: 'ACTIVE' },
  });
  await prisma.serviceProviderProfile.create({
    data: {
      userId: userProvElectrical.id,
      businessName: 'Amit Electrical Works',
      experienceYears: 4,
      isPubliclyListed: true,
      onboardingStatus: 'COMPLETED',
      services: {
        create: {
          serviceId: electricalService.id,
          isActive: true,
        },
      },
      serviceAreas: {
        create: {
          city: 'Gurugram',
          locality: 'Sector 14',
          postalCode: '122001',
        },
      },
    },
  });

  // 6. Other Location Provider (Noida only)
  const provNoidaEmail = `p3_prov_noida_${testId}@test.sevasetu.in`;
  const userProvNoida = await prisma.user.create({
    data: { email: provNoidaEmail, fullName: 'Noida Cleaners', passwordHash, role: 'PROVIDER', status: 'ACTIVE' },
  });
  await prisma.serviceProviderProfile.create({
    data: {
      userId: userProvNoida.id,
      businessName: 'Noida Deep Cleaners',
      isPubliclyListed: true,
      onboardingStatus: 'COMPLETED',
      services: {
        create: {
          serviceId: cleaningService.id,
          isActive: true,
        },
      },
      serviceAreas: {
        create: {
          city: 'Noida',
          locality: 'Sector 62',
          postalCode: '201301',
        },
      },
    },
  });

  // Helper to log in and get cookie
  async function login(email: string): Promise<string> {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: testPassword }),
    });
    assert(res.status === 200, `Login failed for ${email}`);
    const cookie = res.headers.get('set-cookie');
    assert(Boolean(cookie), 'Expected set-cookie header');
    const cookiePart = (cookie as string).split(';')[0];
    return cookiePart as string;
  }

  const cookieCust = await login(customerEmail);
  const cookieProvEligible = await login(provEligibleEmail);
  const cookieProvElectrical = await login(provElectricalEmail);

  let createdOverrideId = '';

  try {
    // -------------------------------------------------------------
    // CATALOG/DISCOVERY TESTS (1-4)
    // -------------------------------------------------------------
    await runTest(1, 'Search by service', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, 'Expected success: true');
      assert(Array.isArray(json.data.results), 'Expected results array');
      const found = json.data.results.some((p: TestProviderSearchResult) => p.id === profileEligible.id);
      assert(found, 'Expected eligible provider to be found');
    });

    await runTest(2, 'Search by category', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?categorySlug=cleaning`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.results.length >= 1, 'Expected at least 1 cleaning provider');
      const hasElectrical = json.data.results.some((p: TestProviderSearchResult) => p.businessName === 'Amit Electrical Works');
      assert(!hasElectrical, 'Electrical provider should not appear in cleaning category search');
    });

    await runTest(3, 'Service filter', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${electricalService.id}`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      const hasElectrical = json.data.results.some((p: TestProviderSearchResult) => p.businessName === 'Amit Electrical Works');
      assert(hasElectrical, 'Expected Amit Electrical Works to be returned');
      const hasCleaning = json.data.results.some((p: TestProviderSearchResult) => p.id === profileEligible.id);
      assert(!hasCleaning, 'Cleaning provider should not appear for electrical service');
    });

    await runTest(4, 'Invalid service returns correct empty behavior', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=non-existent-uuid-9999`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.results.length === 0, 'Expected empty results array');
      assert(json.data.total === 0, 'Expected total = 0');
    });

    // -------------------------------------------------------------
    // PROVIDER ELIGIBILITY TESTS (5-9)
    // -------------------------------------------------------------
    await runTest(5, 'Incomplete provider excluded', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}`);
      const json = await res.json();
      const found = json.data.results.some((p: TestProviderSearchResult) => p.businessName === 'Incomplete Cleaning Services');
      assert(!found, 'Incomplete provider must be excluded from public search');
    });

    await runTest(6, 'Inactive provider excluded', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}`);
      const json = await res.json();
      const found = json.data.results.some((p: TestProviderSearchResult) => p.businessName === 'Suspended Cleaners');
      assert(!found, 'Inactive provider account must be excluded from search');
    });

    await runTest(7, 'Non-listed provider excluded', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}`);
      const json = await res.json();
      const found = json.data.results.some((p: TestProviderSearchResult) => p.businessName === 'Private Cleaning Co');
      assert(!found, 'Non-publicly-listed provider must be excluded from search');
    });

    await runTest(8, 'Provider without requested service excluded', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}`);
      const json = await res.json();
      const found = json.data.results.some((p: TestProviderSearchResult) => p.businessName === 'Amit Electrical Works');
      assert(!found, 'Provider who does not offer requested service must be excluded');
    });

    await runTest(9, 'Eligible provider returned with sanitized public fields', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}`);
      const json = await res.json();
      const prov = json.data.results.find((p: TestProviderSearchResult) => p.id === profileEligible.id);
      assert(Boolean(prov), 'Eligible provider must be present');
      assert(prov.businessName === 'Sharma Deep Cleaners', 'Expected business name');
      assert(prov.experienceYears === 7, 'Expected experience years');
      assert(Array.isArray(prov.skills), 'Expected skills array');
      assert(prov.skills.length > 0, 'Expected at least 1 skill');
      assert(Boolean(prov.matchedService), 'Expected matchedService metadata');
      assert(prov.matchedService.serviceTitle === 'Eco-Friendly Deep Home Cleaning', 'Expected matched service title');
    });

    // -------------------------------------------------------------
    // LOCATION / SERVICE AREA TESTS (10-11)
    // -------------------------------------------------------------
    await runTest(10, 'Matching service area accepted', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}&city=Gurugram&postalCode=122001`);
      const json = await res.json();
      const found = json.data.results.some((p: TestProviderSearchResult) => p.id === profileEligible.id);
      assert(found, 'Expected Gurugram provider to be found');
    });

    await runTest(11, 'Non-matching service area excluded', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}&city=Bangalore`);
      const json = await res.json();
      const found = json.data.results.some((p: TestProviderSearchResult) => p.id === profileEligible.id);
      assert(!found, 'Gurugram provider must be excluded when searching Bangalore');
    });

    // -------------------------------------------------------------
    // AVAILABILITY TESTS (12-19)
    // -------------------------------------------------------------
    await runTest(12, 'Create provider availability schedule', async () => {
      const res = await fetch(`${baseUrl}/api/provider/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvEligible },
        body: JSON.stringify({
          vacationMode: false,
          weeklySchedule: [
            { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', isAvailable: true },
            { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', isAvailable: true },
            { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '16:00', isAvailable: true },
            { dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '14:00', isAvailable: false },
          ],
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, 'Expected success: true');
      assert(json.data.weeklySchedule.length === 7, 'Expected 7 days scheduled');
    });

    await runTest(13, 'Read own availability', async () => {
      const res = await fetch(`${baseUrl}/api/provider/availability`, {
        headers: { Cookie: cookieProvEligible },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.vacationMode === false, 'Expected vacationMode = false');
      assert(Array.isArray(json.data.weeklySchedule), 'Expected weeklySchedule array');
      const mon = json.data.weeklySchedule.find((s: TestAvailabilityItem) => s.dayOfWeek === 'MONDAY');
      assert(Boolean(mon), 'Expected Monday entry');
      assert(mon.startTime === '09:00' && mon.endTime === '18:00', 'Expected Monday hours');
    });

    await runTest(14, 'Create date-specific availability override', async () => {
      const res = await fetch(`${baseUrl}/api/provider/availability/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvEligible },
        body: JSON.stringify({
          date: '2026-10-15',
          isAvailable: false,
          reason: 'National Holiday / Diwali Off',
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const json = await res.json();
      assert(Array.isArray(json.data.overrides), 'Expected overrides array');
      const ov = json.data.overrides.find((o: TestOverrideItem) => o.date === '2026-10-15');
      assert(Boolean(ov), 'Expected 2026-10-15 override');
      assert(ov.isAvailable === false, 'Expected isAvailable = false');
      createdOverrideId = ov.id;
    });

    await runTest(15, 'Delete own availability override', async () => {
      const res = await fetch(`${baseUrl}/api/provider/availability/overrides/${createdOverrideId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieProvEligible },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      // Re-create it for further check testing
      const recreateRes = await fetch(`${baseUrl}/api/provider/availability/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvEligible },
        body: JSON.stringify({
          date: '2026-10-15',
          isAvailable: false,
          reason: 'Festival Day Off',
        }),
      });
      const recJson = await recreateRes.json();
      createdOverrideId = recJson.data.overrides.find((o: TestOverrideItem) => o.date === '2026-10-15').id;
    });

    await runTest(16, 'Provider ownership isolation for overrides', async () => {
      // Electrical provider attempts to delete Sharma Cleaners' override
      const res = await fetch(`${baseUrl}/api/provider/availability/overrides/${createdOverrideId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieProvElectrical },
      });
      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await runTest(17, 'Invalid time range rejected', async () => {
      const res = await fetch(`${baseUrl}/api/provider/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvEligible },
        body: JSON.stringify({
          weeklySchedule: [
            { dayOfWeek: 'MONDAY', startTime: '18:00', endTime: '09:00', isAvailable: true }, // start > end
          ],
        }),
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const json = await res.json();
      assert(json.success === false, 'Expected success: false');
    });

    await runTest(18, 'Matching date/time accepted', async () => {
      // 2026-10-12 is a Monday. Provider operates 09:00-18:00 (break 13:00-14:00).
      // Test 10:00 for 2 hours -> slot 10:00 - 12:00 -> within hours!
      const res = await fetch(
        `${baseUrl}/api/providers/${profileEligible.id}/availability?date=2026-10-12&startTime=10:00&durationHours=2`
      );
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.isAvailable === true, 'Expected Monday 10:00-12:00 to be available');
    });

    await runTest(19, 'Non-matching date/time rejected', async () => {
      // 1. Sunday check (day off)
      // 2026-10-18 is a Sunday
      const sunRes = await fetch(`${baseUrl}/api/providers/${profileEligible.id}/availability?date=2026-10-18&startTime=10:00`);
      const sunJson = await sunRes.json();
      assert(sunJson.data.isAvailable === false, 'Sunday must be unavailable');

      // 2. Break time collision check (Monday 13:30)
      const breakRes = await fetch(
        `${baseUrl}/api/providers/${profileEligible.id}/availability?date=2026-10-12&startTime=13:30&durationHours=1`
      );
      const breakJson = await breakRes.json();
      assert(breakJson.data.isAvailable === false, 'Break time slot must be unavailable');

      // 3. Holiday override check (2026-10-15)
      const holRes = await fetch(`${baseUrl}/api/providers/${profileEligible.id}/availability?date=2026-10-15`);
      const holJson = await holRes.json();
      assert(holJson.data.isAvailable === false, 'Date override day off must be unavailable');
    });

    // -------------------------------------------------------------
    // SEARCH + MATCHING TESTS (20-25)
    // -------------------------------------------------------------
    await runTest(20, 'Search without date/time', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}&city=Gurugram`);
      const json = await res.json();
      const prov = json.data.results.find((p: TestProviderSearchResult) => p.id === profileEligible.id);
      assert(Boolean(prov), 'Provider must be returned');
      assert(prov.isAvailableForSchedule === undefined, 'isAvailableForSchedule should be undefined when no date was requested');
    });

    await runTest(21, 'Search with date/time filters out unavailable providers', async () => {
      // Sunday search -> Provider 1 is off on Sundays -> should be excluded
      const sunRes = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}&date=2026-10-18`);
      const sunJson = await sunRes.json();
      const hasProvOnSunday = sunJson.data.results.some((p: TestProviderSearchResult) => p.id === profileEligible.id);
      assert(!hasProvOnSunday, 'Provider must not appear when search requested an unavailable date');

      // Monday search -> Provider 1 is available -> should be included
      const monRes = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}&date=2026-10-12&startTime=10:00`);
      const monJson = await monRes.json();
      const hasProvOnMonday = monJson.data.results.some((p: TestProviderSearchResult) => p.id === profileEligible.id);
      assert(hasProvOnMonday, 'Provider must appear when search requested an available date');
    });

    await runTest(22, 'Pagination parameters work as expected', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?page=1&limit=1`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.page === 1, 'Expected page = 1');
      assert(json.data.limit === 1, 'Expected limit = 1');
      assert(json.data.results.length <= 1, 'Expected at most 1 item returned');
      assert(json.data.total >= 1, 'Expected total >= 1');
      assert(json.data.totalPages >= 1, 'Expected totalPages >= 1');
    });

    await runTest(23, 'Deterministic ordering is preserved', async () => {
      const res1 = await fetch(`${baseUrl}/api/providers/search?categorySlug=cleaning`);
      const json1 = await res1.json();
      const res2 = await fetch(`${baseUrl}/api/providers/search?categorySlug=cleaning`);
      const json2 = await res2.json();

      const ids1 = json1.data.results.map((p: TestProviderSearchResult) => p.id);
      const ids2 = json2.data.results.map((p: TestProviderSearchResult) => p.id);
      assert(JSON.stringify(ids1) === JSON.stringify(ids2), 'Search results must be stably and deterministically ordered');
    });

    await runTest(24, 'Match reasons are explainable and truthful', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search?serviceId=${cleaningService.id}&city=Gurugram`);
      const json = await res.json();
      const prov = json.data.results.find((p: TestProviderSearchResult) => p.id === profileEligible.id);
      assert(Boolean(prov), 'Expected Sharma Cleaners');
      assert(Array.isArray(prov.matchReasons), 'Expected matchReasons array');
      assert(prov.matchReasons.length >= 2, 'Expected multiple explainable match reasons');

      const codes = prov.matchReasons.map((r: { code: string }) => r.code);
      assert(codes.includes('SERVICE_MATCH'), 'Expected SERVICE_MATCH reason code');
      assert(codes.includes('LOCATION_COVERED'), 'Expected LOCATION_COVERED reason code');
      assert(prov.matchScore > 50, 'Expected composite match score');
    });

    await runTest(25, 'No fabricated ranking data present in responses', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search`);
      const json = await res.json();
      for (const p of (json.data.results as TestProviderSearchResult[])) {
        assert(!('rating' in p) || p.rating === undefined, 'No fake rating should be present');
        assert(!('reviewCount' in p) || p.reviewCount === undefined, 'No fake review count should be present');
        assert(!('completedJobs' in p) || p.completedJobs === undefined, 'No fake completed jobs should be present');
      }
    });

    // -------------------------------------------------------------
    // SECURITY TESTS (26-30)
    // -------------------------------------------------------------
    await runTest(26, 'Unauthenticated availability mutation rejected', async () => {
      const res = await fetch(`${baseUrl}/api/provider/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklySchedule: [] }),
      });
      assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
    });

    await runTest(27, 'Customer cannot mutate provider availability', async () => {
      const res = await fetch(`${baseUrl}/api/provider/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookieCust },
        body: JSON.stringify({ weeklySchedule: [] }),
      });
      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await runTest(28, 'Provider cannot mutate another provider schedule', async () => {
      // Provider Electrical tries to delete Provider Eligible's override
      const res = await fetch(`${baseUrl}/api/provider/availability/overrides/${createdOverrideId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieProvElectrical },
      });
      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await runTest(29, 'Private provider data absent from search results', async () => {
      const res = await fetch(`${baseUrl}/api/providers/search`);
      const json = await res.json();
      for (const p of json.data.results) {
        assert(!('passwordHash' in p), 'passwordHash must never be exposed');
        assert(!('email' in p), 'User email must not be exposed in public search results');
        assert(!('phone' in p), 'User phone must not be exposed in public search results');
        assert(!('onboardingStatus' in p), 'Internal onboarding status must not be exposed in public search results');
      }
    });

    await runTest(30, 'Public provider availability endpoint remains sanitized', async () => {
      const res = await fetch(`${baseUrl}/api/providers/${profileEligible.id}/availability?date=2026-10-12`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(!('passwordHash' in json.data), 'No private fields in availability query');
      assert(!('email' in json.data), 'No email in availability query');
    });

    // -------------------------------------------------------------
    // DATABASE TESTS (31-33)
    // -------------------------------------------------------------
    await runTest(31, 'Availability persists in PostgreSQL', async () => {
      const count = await prisma.providerAvailability.count({
        where: { providerProfileId: profileEligible.id },
      });
      assert(count >= 7, 'Expected at least 7 weekly schedule records in PostgreSQL');
    });

    await runTest(32, 'Prisma availability relations work', async () => {
      const profile = await prisma.serviceProviderProfile.findUnique({
        where: { id: profileEligible.id },
        include: { availabilities: true, availabilityOverrides: true },
      });
      assert(Boolean(profile), 'Profile must exist');
      assert(profile!.availabilities.length >= 7, 'Expected relation to load availabilities');
      assert(profile!.availabilityOverrides.length >= 1, 'Expected relation to load overrides');
    });

    await runTest(33, 'Migration is applied and schema matches', async () => {
      const testOverride = await prisma.providerAvailabilityOverride.findFirst({
        where: { providerProfileId: profileEligible.id },
      });
      assert(Boolean(testOverride), 'Expected override table to exist and contain record');
    });

  } finally {
    server.close();
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`\n=== TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${results.length}) ===\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
