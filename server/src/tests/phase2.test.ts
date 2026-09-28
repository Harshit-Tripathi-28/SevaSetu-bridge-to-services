import http from 'http';
import { createApp } from '../app.js';
import { getPrismaClient } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { ProviderService } from '../services/provider.service.js';

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  console.log('=== STARTING SEVASETU FUNCTIONAL PHASE 2 TEST SUITE ===');

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
  const customerEmailA = `cust_a_${testId}@test.sevasetu.in`;
  const customerEmailB = `cust_b_${testId}@test.sevasetu.in`;
  const providerEmailA = `prov_a_${testId}@test.sevasetu.in`;
  const providerEmailB = `prov_b_${testId}@test.sevasetu.in`;
  const testPassword = 'Password123!';
  const passwordHash = await hashPassword(testPassword);

  // Setup test users in PostgreSQL
  const userCustA = await prisma.user.create({
    data: { email: customerEmailA, fullName: 'Customer Alpha', passwordHash, role: 'CUSTOMER', status: 'ACTIVE' },
  });
  const userCustB = await prisma.user.create({
    data: { email: customerEmailB, fullName: 'Customer Beta', passwordHash, role: 'CUSTOMER', status: 'ACTIVE' },
  });
  const userProvA = await prisma.user.create({
    data: { email: providerEmailA, fullName: 'Provider Amit', passwordHash, role: 'PROVIDER', status: 'ACTIVE' },
  });
  const userProvB = await prisma.user.create({
    data: { email: providerEmailB, fullName: 'Provider Bharat', passwordHash, role: 'PROVIDER', status: 'ACTIVE' },
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

  const cookieCustA = await login(customerEmailA);
  const cookieCustB = await login(customerEmailB);
  const cookieProvA = await login(providerEmailA);
  const cookieProvB = await login(providerEmailB);

  let addressA1Id = '';
  let addressA2Id = '';
  let catalogServiceId = '';
  let catalogCategorySlug = '';
  let providerServiceId = '';
  let providerSkillId = '';

  try {
    // -------------------------------------------------------------
    // CUSTOMER PROFILE & ADDRESSES TESTS
    // -------------------------------------------------------------
    await runTest(1, 'Get own profile', async () => {
      const res = await fetch(`${baseUrl}/api/profile`, {
        headers: { Cookie: cookieCustA },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.email === customerEmailA, 'Expected email match');
      assert(json.data.role === 'CUSTOMER', 'Expected CUSTOMER role');
    });

    await runTest(2, 'Update own profile', async () => {
      const res = await fetch(`${baseUrl}/api/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieCustA },
        body: JSON.stringify({ fullName: 'Customer Alpha Updated', phone: '+919876543210' }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.fullName === 'Customer Alpha Updated', 'Expected updated fullName');
      assert(json.data.phone === '+919876543210', 'Expected updated phone');
    });

    await runTest(3, 'Create address', async () => {
      const res = await fetch(`${baseUrl}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieCustA },
        body: JSON.stringify({
          label: 'HOME',
          flatNumber: 'Flat 402, Block B',
          streetArea: 'Supertech Capetown, Sector 74',
          city: 'Noida',
          state: 'Uttar Pradesh',
          postalCode: '201301',
          landmark: 'Near clubhouse',
          isDefault: true,
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const json = await res.json();
      assert(Boolean(json.data.id), 'Expected created address ID');
      assert(json.data.isDefault === true, 'Expected isDefault = true');
      addressA1Id = json.data.id;
    });

    await runTest(4, 'Read own addresses', async () => {
      const res = await fetch(`${baseUrl}/api/addresses`, {
        headers: { Cookie: cookieCustA },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(Array.isArray(json.data), 'Expected array');
      assert(json.data.length >= 1, 'Expected at least 1 address');
      assert(json.data[0].id === addressA1Id, 'Expected matching address');
    });

    await runTest(5, 'Update own address', async () => {
      const res = await fetch(`${baseUrl}/api/addresses/${addressA1Id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieCustA },
        body: JSON.stringify({ flatNumber: 'Flat 405, Block B' }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.flatNumber === 'Flat 405, Block B', 'Expected updated flat number');
    });

    await runTest(6, 'Create second address and set primary address', async () => {
      const res2 = await fetch(`${baseUrl}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieCustA },
        body: JSON.stringify({
          label: 'WORK',
          flatNumber: 'Office 301',
          streetArea: 'Logix Cyber Park',
          city: 'Noida',
          postalCode: '201301',
          isDefault: false,
        }),
      });
      assert(res2.status === 201, 'Address 2 creation failed');
      const json2 = await res2.json();
      addressA2Id = json2.data.id;

      // Set address 2 as primary
      const resPrimary = await fetch(`${baseUrl}/api/addresses/${addressA2Id}/primary`, {
        method: 'PATCH',
        headers: { Cookie: cookieCustA },
      });
      assert(resPrimary.status === 200, 'Set primary address failed');
      const jsonPrimary = await resPrimary.json();
      assert(jsonPrimary.data.isDefault === true, 'Address 2 should be default');

      // Verify address 1 is no longer default
      const resList = await fetch(`${baseUrl}/api/addresses`, {
        headers: { Cookie: cookieCustA },
      });
      const listJson = await resList.json();
      const addr1 = listJson.data.find((a: { id: string }) => a.id === addressA1Id);
      assert(addr1.isDefault === false, 'Address 1 should not be default anymore');
    });

    await runTest(7, 'Delete own address', async () => {
      const res = await fetch(`${baseUrl}/api/addresses/${addressA2Id}`, {
        method: 'DELETE',
        headers: { Cookie: cookieCustA },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);

      // Verify address 1 was promoted back to default
      const resList = await fetch(`${baseUrl}/api/addresses`, {
        headers: { Cookie: cookieCustA },
      });
      const listJson = await resList.json();
      const remaining = listJson.data.find((a: { id: string }) => a.id === addressA1Id);
      assert(remaining.isDefault === true, 'Remaining address should be default');
    });

    await runTest(8, 'Ownership isolation between customers', async () => {
      // Customer B attempts to modify Customer A's address
      const resPatch = await fetch(`${baseUrl}/api/addresses/${addressA1Id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieCustB },
        body: JSON.stringify({ flatNumber: 'Malicious Change' }),
      });
      assert(resPatch.status === 403, `Expected 403, got ${resPatch.status}`);

      // Customer B attempts to delete Customer A's address
      const resDel = await fetch(`${baseUrl}/api/addresses/${addressA1Id}`, {
        method: 'DELETE',
        headers: { Cookie: cookieCustB },
      });
      assert(resDel.status === 403, `Expected 403, got ${resDel.status}`);
    });

    // -------------------------------------------------------------
    // SERVICE CATALOG TESTS
    // -------------------------------------------------------------
    await runTest(9, 'Read service categories', async () => {
      const res = await fetch(`${baseUrl}/api/service-categories`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(Array.isArray(json.data), 'Expected array');
      assert(json.data.length >= 6, 'Expected at least 6 approved categories');
      const electrician = json.data.find((c: { slug: string }) => c.slug === 'electrician');
      assert(Boolean(electrician), 'Expected electrician category');
      catalogCategorySlug = electrician.slug;
    });

    await runTest(10, 'Read active services', async () => {
      const res = await fetch(`${baseUrl}/api/services?categorySlug=${catalogCategorySlug}`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(Array.isArray(json.data), 'Expected array');
      assert(json.data.length >= 1, 'Expected seeded services');
      catalogServiceId = json.data[0].id;
    });

    await runTest(11, 'Read service by id', async () => {
      const res = await fetch(`${baseUrl}/api/services/${catalogServiceId}`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.id === catalogServiceId, 'Expected matching service ID');
      assert(Boolean(json.data.title), 'Expected service title');
    });

    await runTest(12, 'Invalid service/category behavior', async () => {
      const resCat = await fetch(`${baseUrl}/api/service-categories/non-existent-cat-slug-999`);
      assert(resCat.status === 404, `Expected 404, got ${resCat.status}`);

      const resSvc = await fetch(`${baseUrl}/api/services/non-existent-svc-id-999`);
      assert(resSvc.status === 404, `Expected 404, got ${resSvc.status}`);
    });

    // -------------------------------------------------------------
    // PROVIDER PROFILE, SKILLS, SERVICES & ONBOARDING TESTS
    // -------------------------------------------------------------
    await runTest(13, 'Create/get provider profile', async () => {
      const res = await fetch(`${baseUrl}/api/provider/profile`, {
        headers: { Cookie: cookieProvA },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.userId === userProvA.id, 'Expected matching userId');
      assert(json.data.onboardingStatus === 'NOT_STARTED', 'Expected NOT_STARTED');
    });

    await runTest(14, 'Update own provider profile', async () => {
      const res = await fetch(`${baseUrl}/api/provider/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvA },
        body: JSON.stringify({
          businessName: 'Amit Electrical Solutions',
          bio: 'Licensed electrical contractor with over 7 years of field service experience across residential and commercial buildings.',
          experienceYears: 7,
          languages: ['Hindi', 'English'],
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.businessName === 'Amit Electrical Solutions', 'Expected updated business name');
      assert(json.data.experienceYears === 7, 'Expected experienceYears = 7');
    });

    await runTest(15, 'Add skill', async () => {
      const res = await fetch(`${baseUrl}/api/provider/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvA },
        body: JSON.stringify({
          name: 'Ceiling Fan Installation & Repair',
          category: 'Electrician',
          experienceLevel: 'expert',
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const json = await res.json();
      assert(Boolean(json.data.id), 'Expected skill ID');
      providerSkillId = json.data.id;
    });

    await runTest(16, 'Remove skill and re-add', async () => {
      const resDel = await fetch(`${baseUrl}/api/provider/skills/${providerSkillId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieProvA },
      });
      assert(resDel.status === 200, 'Expected 200 on skill delete');

      // Re-add skill so onboarding requirement is satisfied
      const resAdd = await fetch(`${baseUrl}/api/provider/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvA },
        body: JSON.stringify({
          name: 'Ceiling Fan Installation & Repair',
          category: 'Electrician',
          experienceLevel: 'expert',
        }),
      });
      assert(resAdd.status === 201, 'Re-add skill failed');
    });

    await runTest(17, 'Add provider service', async () => {
      const res = await fetch(`${baseUrl}/api/provider/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvA },
        body: JSON.stringify({
          serviceId: catalogServiceId,
          customTitle: 'Standard Fan Fitting with Safety Testing',
          customPrice: 349,
          minDuration: '1 hour',
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const json = await res.json();
      assert(Boolean(json.data.id), 'Expected provider service ID');
      assert(json.data.customPrice === 349, 'Expected customPrice 349');
      providerServiceId = json.data.id;
    });

    await runTest(18, 'Update provider service', async () => {
      const res = await fetch(`${baseUrl}/api/provider/services/${providerServiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvA },
        body: JSON.stringify({
          customPrice: 399,
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.customPrice === 399, 'Expected updated customPrice');
    });

    await runTest(19, 'Remove provider service and re-add', async () => {
      const resDel = await fetch(`${baseUrl}/api/provider/services/${providerServiceId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieProvA },
      });
      assert(resDel.status === 200, 'Expected 200 on service remove');

      // Re-add service so onboarding is satisfied
      const resAdd = await fetch(`${baseUrl}/api/provider/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvA },
        body: JSON.stringify({
          serviceId: catalogServiceId,
          customPrice: 349,
        }),
      });
      assert(resAdd.status === 201, 'Re-add service failed');
    });

    await runTest(20, 'Update service area', async () => {
      const res = await fetch(`${baseUrl}/api/provider/service-area`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookieProvA },
        body: JSON.stringify({
          city: 'Noida',
          locality: 'Sector 62 & Indirapuram',
          state: 'Uttar Pradesh',
          postalCode: '201301',
          radiusKm: 12,
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.city === 'Noida', 'Expected city = Noida');
      assert(json.data.radiusKm === 12, 'Expected radiusKm = 12');
    });

    await runTest(21, 'Get onboarding state', async () => {
      const res = await fetch(`${baseUrl}/api/provider/onboarding`, {
        headers: { Cookie: cookieProvA },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.completionPercentage === 100, `Expected 100%, got ${json.data.completionPercentage}%`);
      assert(json.data.sections.every((s: { isComplete: boolean }) => s.isComplete), 'All sections should be complete');
    });

    await runTest(22, 'Incomplete onboarding cannot be completed', async () => {
      // Provider B has not configured skills, services, area
      const res = await fetch(`${baseUrl}/api/provider/onboarding/complete`, {
        method: 'POST',
        headers: { Cookie: cookieProvB },
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const json = await res.json();
      assert(json.error === 'Incomplete Onboarding', 'Expected Incomplete Onboarding error');
    });

    await runTest(23, 'Complete onboarding only when requirements are satisfied', async () => {
      const res = await fetch(`${baseUrl}/api/provider/onboarding/complete`, {
        method: 'POST',
        headers: { Cookie: cookieProvA },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.status === 'COMPLETED', 'Expected status COMPLETED');
      assert(json.data.profile.isPubliclyListed === true, 'Expected isPubliclyListed = true');
    });

    // -------------------------------------------------------------
    // PUBLIC PROVIDER PROFILE READ TESTS
    // -------------------------------------------------------------
    let publicProviderId = '';
    await runTest(24, 'Public provider profile read', async () => {
      const provProfile = await prisma.serviceProviderProfile.findUnique({
        where: { userId: userProvA.id },
      });
      publicProviderId = provProfile!.id;

      const res = await fetch(`${baseUrl}/api/providers/${publicProviderId}`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.id === publicProviderId, 'Expected matching provider ID');
      assert(json.data.displayName === 'Amit Electrical Solutions', 'Expected display name');
      assert(Array.isArray(json.data.skills) && json.data.skills.length > 0, 'Expected skills array');
    });

    await runTest(25, 'Private provider fields are not exposed', async () => {
      const res = await fetch(`${baseUrl}/api/providers/${publicProviderId}`);
      const json = await res.json();
      assert(json.data.email === undefined, 'Email MUST NOT be exposed');
      assert(json.data.phone === undefined, 'Phone MUST NOT be exposed');
      assert(json.data.passwordHash === undefined, 'Password hash MUST NOT be exposed');
      assert(json.data.password === undefined, 'Password MUST NOT be exposed');
      assert(json.data.userId === undefined, 'Internal userId MUST NOT be exposed');
    });

    await runTest(26, 'Incomplete provider not publicly discoverable', async () => {
      // Provider B is not onboarded
      const provBProfile = await ProviderService.getOrCreateProviderProfile(userProvB.id);
      const res = await fetch(`${baseUrl}/api/providers/${provBProfile.id}`);
      assert(res.status === 404, `Expected 404 for unlisted provider, got ${res.status}`);
    });

    // -------------------------------------------------------------
    // AUTHORIZATION & RBAC BOUNDARIES
    // -------------------------------------------------------------
    await runTest(27, 'Unauthenticated profile access = 401', async () => {
      const resProfile = await fetch(`${baseUrl}/api/profile`);
      assert(resProfile.status === 401, 'Expected 401 on /api/profile');

      const resAddresses = await fetch(`${baseUrl}/api/addresses`);
      assert(resAddresses.status === 401, 'Expected 401 on /api/addresses');

      const resProvProfile = await fetch(`${baseUrl}/api/provider/profile`);
      assert(resProvProfile.status === 401, 'Expected 401 on /api/provider/profile');
    });

    await runTest(28, 'Customer cannot access provider management routes', async () => {
      const resProfile = await fetch(`${baseUrl}/api/provider/profile`, {
        headers: { Cookie: cookieCustA },
      });
      assert(resProfile.status === 403, `Expected 403, got ${resProfile.status}`);

      const resSkills = await fetch(`${baseUrl}/api/provider/skills`, {
        headers: { Cookie: cookieCustA },
      });
      assert(resSkills.status === 403, `Expected 403, got ${resSkills.status}`);

      const resOnboarding = await fetch(`${baseUrl}/api/provider/onboarding`, {
        headers: { Cookie: cookieCustA },
      });
      assert(resOnboarding.status === 403, `Expected 403, got ${resOnboarding.status}`);
    });

    await runTest(29, 'Provider cannot modify another provider', async () => {
      // Provider B tries to access Provider A's service via their own session
      const provServicesA = await ProviderService.getServices(userProvA.id);

      if (provServicesA.length > 0 && provServicesA[0]) {
        const targetId = provServicesA[0].id;
        const resDel = await fetch(`${baseUrl}/api/provider/services/${targetId}`, {
          method: 'DELETE',
          headers: { Cookie: cookieProvB },
        });
        assert(resDel.status === 403, `Expected 403, got ${resDel.status}`);
      }
    });

    await runTest(30, 'Customer cannot access admin-only functionality', async () => {
      const res = await fetch(`${baseUrl}/api/auth/admin-only`, {
        headers: { Cookie: cookieCustA },
      });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    // -------------------------------------------------------------
    // DATABASE PERSISTENCE & PRISMA RELATIONS
    // -------------------------------------------------------------
    await runTest(31, 'Real PostgreSQL persistence', async () => {
      const dbUser = await prisma.user.findUnique({
        where: { id: userCustA.id },
        include: { addresses: true },
      });
      assert(Boolean(dbUser), 'User must exist in PostgreSQL');
      assert(dbUser!.addresses.length >= 1, 'Address must be persisted in PostgreSQL');
    });

    await runTest(32, 'Prisma relations work', async () => {
      const provRel = await prisma.serviceProviderProfile.findUnique({
        where: { userId: userProvA.id },
        include: { skills: true, services: true, serviceAreas: true },
      });
      assert(Boolean(provRel), 'Provider profile must be found');
      assert(provRel!.skills.length >= 1, 'Skills relation must be populated');
      assert(provRel!.services.length >= 1, 'Services relation must be populated');
      assert(provRel!.serviceAreas.length >= 1, 'Service area relation must be populated');
    });

    await runTest(33, 'Migration is applied', async () => {
      const categoriesCount = await prisma.serviceCategory.count();
      assert(categoriesCount >= 6, 'Categories must exist from migration/seed');
    });

    await runTest(34, 'No plaintext/private secrets stored', async () => {
      const checkUser = await prisma.user.findUnique({ where: { id: userCustA.id } });
      assert(checkUser!.passwordHash.startsWith('$2a$') || checkUser!.passwordHash.startsWith('$2b$'), 'Password must be bcrypt hash');
      assert(!checkUser!.passwordHash.includes(testPassword), 'Plaintext password must not be in hash');
    });

  } finally {
    // Clean up test records
    await prisma.address.deleteMany({ where: { userId: { in: [userCustA.id, userCustB.id] } } });
    await prisma.providerSkill.deleteMany({ where: { providerProfile: { userId: { in: [userProvA.id, userProvB.id] } } } });
    await prisma.providerService.deleteMany({ where: { providerProfile: { userId: { in: [userProvA.id, userProvB.id] } } } });
    await prisma.providerServiceArea.deleteMany({ where: { providerProfile: { userId: { in: [userProvA.id, userProvB.id] } } } });
    await prisma.serviceProviderProfile.deleteMany({ where: { userId: { in: [userProvA.id, userProvB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userCustA.id, userCustB.id, userProvA.id, userProvB.id] } } });

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
