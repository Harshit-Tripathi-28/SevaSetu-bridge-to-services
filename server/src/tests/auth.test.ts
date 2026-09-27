import http from 'http';
import { createApp } from '../app.js';
import { getPrismaClient } from '../config/database.js';

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
  console.log('=== STARTING SEVASETU BACKEND AUTHENTICATION TEST SUITE ===');

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
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ num, name, passed: false, error: msg });
      console.error(`  [FAIL] Test ${num}: ${name} -> ${msg}`);
    }
  };

  const testSuffix = Date.now().toString(36);
  const custEmail = `cust_${testSuffix}@sevasetu.test`;
  const custPassword = 'CustomerSecure123';
  let custCookie = '';

  const provEmail = `prov_${testSuffix}@sevasetu.test`;
  const provPassword = 'ProviderSecure123';
  let provCookie = '';

  const adminEmail = `admin_${testSuffix}@sevasetu.test`;
  const adminPassword = 'AdminSecure123';
  let adminCookie = '';

  try {
    // 1. Registration success
    await runTest(1, 'Registration success', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: custEmail,
          password: custPassword,
          fullName: 'Test Customer Automated',
          role: 'CUSTOMER',
        }),
      });
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      const body = await res.json();
      assert(body.success === true, 'Expected body.success to be true');
      assert(body.data.user.email === custEmail, 'Expected email to match');
      assert(!('passwordHash' in body.data.user), 'Password hash must not be exposed');
      const setCookie = res.headers.get('set-cookie');
      assert(Boolean(setCookie && setCookie.includes('sevasetu_auth')), 'Expected auth cookie to be set');
    });

    // 2. Duplicate registration
    await runTest(2, 'Duplicate registration rejection', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: custEmail,
          password: custPassword,
          fullName: 'Duplicate Customer',
          role: 'CUSTOMER',
        }),
      });
      assert(res.status === 409, `Expected status 409, got ${res.status}`);
      const body = await res.json();
      assert(body.success === false, 'Expected success to be false');
    });

    // 3. Invalid registration data
    await runTest(3, 'Invalid registration data rejection', async () => {
      // Test invalid email
      const res1 = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email-address',
          password: custPassword,
        }),
      });
      assert(res1.status === 400, `Expected status 400 for bad email, got ${res1.status}`);

      // Test weak password
      const res2 = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `weak_${testSuffix}@sevasetu.test`,
          password: 'weak',
        }),
      });
      assert(res2.status === 400, `Expected status 400 for weak password, got ${res2.status}`);

      // Test prohibited admin registration
      const res3 = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `adminattempt_${testSuffix}@sevasetu.test`,
          password: 'ValidPassword123',
          role: 'ADMIN',
        }),
      });
      assert(res3.status === 403, `Expected status 403 for admin registration attempt, got ${res3.status}`);
    });

    // 4. Password hashing verified directly in PostgreSQL
    await runTest(4, 'Password hashing verification in PostgreSQL', async () => {
      const dbUser = await prisma.user.findUnique({
        where: { email: custEmail },
      });
      assert(Boolean(dbUser), 'User record not found in database');
      assert(dbUser!.passwordHash !== custPassword, 'Password must not be stored in plaintext');
      assert(dbUser!.passwordHash.startsWith('$2'), 'Password hash must be valid bcrypt hash');
    });

    // 5. Login success
    await runTest(5, 'Login success with HTTP-only cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: custEmail,
          password: custPassword,
        }),
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json();
      assert(body.success === true, 'Expected body.success to be true');
      assert(body.data.user.email === custEmail, 'Expected email to match');
      custCookie = res.headers.get('set-cookie') || '';
      assert(custCookie.includes('sevasetu_auth'), 'Expected set-cookie to include sevasetu_auth');
      assert(custCookie.toLowerCase().includes('httponly'), 'Expected cookie to be HttpOnly');
    });

    // 6. Invalid login
    await runTest(6, 'Invalid login credentials rejection', async () => {
      // Wrong password
      const res1 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: custEmail,
          password: 'IncorrectPassword999',
        }),
      });
      assert(res1.status === 401, `Expected status 401 for bad password, got ${res1.status}`);

      // Non-existent user
      const res2 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent_user@sevasetu.test',
          password: custPassword,
        }),
      });
      assert(res2.status === 401, `Expected status 401 for unknown email, got ${res2.status}`);
    });

    // 7. Suspended account rejection
    await runTest(7, 'Suspended account authorization rejection', async () => {
      const suspEmail = `susp_${testSuffix}@sevasetu.test`;
      const suspPass = 'SuspendedPass123';

      // Register and then suspend
      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: suspEmail,
          password: suspPass,
          role: 'CUSTOMER',
        }),
      });

      // Update status directly to SUSPENDED in DB
      await prisma.user.update({
        where: { email: suspEmail },
        data: { status: 'SUSPENDED' },
      });

      // Attempt login
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: suspEmail,
          password: suspPass,
        }),
      });
      assert(res.status === 403, `Expected status 403 for suspended user, got ${res.status}`);
      const body = await res.json();
      assert(body.message.includes('suspended'), 'Expected error message to mention account suspension');
    });

    // 8. Logout
    await runTest(8, 'Logout invalidation and cookie clearing', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const clearCookie = res.headers.get('set-cookie') || '';
      assert(clearCookie.includes('sevasetu_auth=;'), 'Expected cookie value to be cleared');
      assert(clearCookie.includes('Expires=Thu, 01 Jan 1970'), 'Expected cookie expiration to be in past');
    });

    // 9. /api/auth/me unauthenticated
    await runTest(9, '/api/auth/me unauthenticated request returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert(res.status === 401, `Expected status 401, got ${res.status}`);
    });

    // 10. /api/auth/me authenticated
    await runTest(10, '/api/auth/me authenticated session returns current user', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: custCookie },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json();
      assert(body.success === true, 'Expected body.success to be true');
      assert(body.data.user.email === custEmail, 'Expected current user email to match');
      assert(body.data.user.role === 'CUSTOMER', 'Expected role to be CUSTOMER');
    });

    // Setup Provider and Admin accounts for RBAC tests
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: provEmail,
        password: provPassword,
        fullName: 'Test Provider Automated',
        role: 'PROVIDER',
      }),
    });

    const provLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: provEmail, password: provPassword }),
    });
    provCookie = provLoginRes.headers.get('set-cookie') || '';

    // Create admin user in DB directly
    const { hashPassword } = await import('../utils/password.js');
    const adminHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminHash,
        fullName: 'Test Admin Automated',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    adminCookie = adminLoginRes.headers.get('set-cookie') || '';

    // 11. Customer route authorization
    await runTest(11, 'Customer route authorization check', async () => {
      // Customer accesses general protected route -> 200
      const res1 = await fetch(`${baseUrl}/api/auth/protected`, {
        headers: { Cookie: custCookie },
      });
      assert(res1.status === 200, `Expected 200 on protected route for customer, got ${res1.status}`);

      // Customer accesses provider-only route -> 403
      const res2 = await fetch(`${baseUrl}/api/auth/provider-only`, {
        headers: { Cookie: custCookie },
      });
      assert(res2.status === 403, `Expected 403 on provider route for customer, got ${res2.status}`);

      // Customer accesses admin-only route -> 403
      const res3 = await fetch(`${baseUrl}/api/auth/admin-only`, {
        headers: { Cookie: custCookie },
      });
      assert(res3.status === 403, `Expected 403 on admin route for customer, got ${res3.status}`);
    });

    // 12. Provider route authorization
    await runTest(12, 'Provider route authorization check', async () => {
      // Provider accesses provider-only route -> 200
      const res1 = await fetch(`${baseUrl}/api/auth/provider-only`, {
        headers: { Cookie: provCookie },
      });
      assert(res1.status === 200, `Expected 200 on provider route for provider, got ${res1.status}`);

      // Provider accesses admin-only route -> 403
      const res2 = await fetch(`${baseUrl}/api/auth/admin-only`, {
        headers: { Cookie: provCookie },
      });
      assert(res2.status === 403, `Expected 403 on admin route for provider, got ${res2.status}`);
    });

    // 13. Admin route authorization
    await runTest(13, 'Admin route authorization check', async () => {
      // Admin accesses admin-only route -> 200
      const res = await fetch(`${baseUrl}/api/auth/admin-only`, {
        headers: { Cookie: adminCookie },
      });
      assert(res.status === 200, `Expected 200 on admin route for admin, got ${res.status}`);
    });

    // 14. Unauthorized access returns 401
    await runTest(14, 'Unauthorized access returns 401', async () => {
      const res1 = await fetch(`${baseUrl}/api/auth/protected`);
      assert(res1.status === 401, `Expected 401 for unauthenticated protected, got ${res1.status}`);

      const res2 = await fetch(`${baseUrl}/api/auth/provider-only`);
      assert(res2.status === 401, `Expected 401 for unauthenticated provider-only, got ${res2.status}`);

      const res3 = await fetch(`${baseUrl}/api/auth/admin-only`);
      assert(res3.status === 401, `Expected 401 for unauthenticated admin-only, got ${res3.status}`);
    });

    // 15. Forbidden access returns 403
    await runTest(15, 'Forbidden access returns 403', async () => {
      const res = await fetch(`${baseUrl}/api/auth/provider-only`, {
        headers: { Cookie: custCookie },
      });
      assert(res.status === 403, `Expected 403 for unauthorized role, got ${res.status}`);
      const body = await res.json();
      assert(body.success === false, 'Expected success false');
      assert(body.message.includes('Access denied'), 'Expected access denied message');
    });

  } finally {
    server.close();
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${results.length}) ===`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
