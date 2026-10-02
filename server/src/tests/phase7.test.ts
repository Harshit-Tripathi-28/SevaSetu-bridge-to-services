import http from 'http';
import { createApp } from '../app.js';
import { getPrismaClient } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { initSocketServer } from '../socket.js';

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

async function runPhase7Tests() {
  console.log('=== STARTING SEVASETU FUNCTIONAL PHASE 7 TEST SUITE ===');

  const app = createApp();
  const server = http.createServer(app);
  initSocketServer(server);

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
      results.push({ num, name: name.trim(), passed: true });
      console.log(`  [PASS] Test ${num}: ${name.trim()}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      results.push({ num, name: name.trim(), passed: false, error: errMsg });
      console.error(`  [FAIL] Test ${num}: ${name.trim()} -> ${errMsg}`);
    }
  };

  const testId = Date.now();
  const testPassword = 'Password123!';
  const passwordHash = await hashPassword(testPassword);

  const apiCall = async (
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
      cookie?: string;
    } = {}
  ): Promise<{ status: number; body: any; headers: Headers }> => {
    const { method = 'GET', body, headers = {}, cookie } = options;
    const reqHeaders: Record<string, string> = { ...headers };

    if (body !== undefined) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (cookie) {
      reqHeaders['Cookie'] = cookie;
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let json: any = null;
    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return { status: res.status, body: json, headers: res.headers };
  };

  const loginUser = async (email: string) => {
    const res = await apiCall('/api/auth/login', {
      method: 'POST',
      body: { email, password: testPassword },
    });
    assert(res.status === 200, `Login failed for ${email}: ${JSON.stringify(res.body)}`);
    const setCookie = res.headers.get('set-cookie') || '';
    const match = setCookie.match(/sevasetu_auth=([^;]+)/);
    const token = match ? match[1] : '';
    const cookie = `sevasetu_auth=${token}`;
    return { token, cookie, user: res.body.data.user };
  };

  try {
    console.log('--- Setting up Phase 7 test fixtures in PostgreSQL ---');

    // 1. Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        email: `p7_admin_${testId}@example.com`,
        fullName: 'Super Administrator',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // 2. Create Secondary Admin User (for last-admin checks / assignments)
    const secondaryAdminUser = await prisma.user.create({
      data: {
        email: `p7_admin2_${testId}@example.com`,
        fullName: 'Operations Lead Admin',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // 3. Create Customer User
    const customerUser = await prisma.user.create({
      data: {
        email: `p7_cust_${testId}@example.com`,
        fullName: 'Aarav Mehta',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    const custAddress = await prisma.address.create({
      data: {
        userId: customerUser.id,
        label: 'HOME',
        flatNumber: 'Flat 402',
        streetArea: 'Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560038',
      },
    });

    // 4. Create Provider User & Profile
    const providerUser = await prisma.user.create({
      data: {
        email: `p7_prov_${testId}@example.com`,
        fullName: 'Vikram Singh',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
    });

    const providerProfile = await prisma.serviceProviderProfile.create({
      data: {
        userId: providerUser.id,
        businessName: 'Vikram Electricals',
        experienceYears: 7,
        onboardingStatus: 'COMPLETED',
        isPubliclyListed: true,
        isRestricted: false,
        isVerified: false,
        vacationMode: false,
      },
    });

    // 5. Create Service Category & Service
    const category = await prisma.serviceCategory.create({
      data: {
        name: `Electrical Work ${testId}`,
        slug: `electrical-work-${testId}`,
        description: 'Wiring and electrical appliance repair',
      },
    });

    const service = await prisma.service.create({
      data: {
        categoryId: category.id,
        title: `Wiring Inspection ${testId}`,
        slug: `wiring-inspection-${testId}`,
        description: 'Thorough inspection of domestic wiring',
        pricingModel: 'FIXED',
        basePrice: 600,
        durationMinutes: 45,
        isActive: true,
      },
    });

    await prisma.providerService.create({
      data: {
        providerProfileId: providerProfile.id,
        serviceId: service.id,
        customPrice: 600,
        isActive: true,
      },
    });

    await prisma.providerServiceArea.create({
      data: {
        providerProfileId: providerProfile.id,
        city: 'Bangalore',
        locality: 'Indiranagar',
        postalCode: '560038',
        radiusKm: 10,
      },
    });

    // 6. Create Historical Booking & Payment for Operations Testing
    const srvReq = await prisma.serviceRequest.create({
      data: {
        customerId: customerUser.id,
        serviceId: service.id,
        selectedProviderId: providerProfile.id,
        description: 'Wiring Inspection Request',
        requestedDate: new Date('2026-10-05T00:00:00.000Z'),
        requestedStartTime: '10:00',
        addressId: custAddress.id,
        addressSnapshot: { flatNumber: 'Flat 402', streetArea: 'Indiranagar', city: 'Bangalore', postalCode: '560038' },
        status: 'ACCEPTED',
      },
    });

    const booking = await prisma.booking.create({
      data: {
        referenceCode: `BK-${testId}-HIST`,
        serviceRequestId: srvReq.id,
        customerId: customerUser.id,
        providerProfileId: providerProfile.id,
        serviceId: service.id,
        scheduledDate: new Date('2026-10-05T00:00:00.000Z'),
        scheduledStartTime: '10:00',
        scheduledEndTime: '11:00',
        status: 'SCHEDULED',
        serviceTitleSnapshot: service.title,
        pricingModelSnapshot: 'FIXED',
        priceSnapshot: 600,
        locationSnapshot: {
          flatNumber: custAddress.flatNumber,
          streetArea: custAddress.streetArea,
          city: custAddress.city,
          state: custAddress.state,
          postalCode: custAddress.postalCode,
        },
        customerSnapshot: { fullName: customerUser.fullName, email: customerUser.email, phone: customerUser.phone },
        providerSnapshot: { businessName: providerProfile.businessName },
      },
    });

    const payment = await prisma.payment.create({
      data: {
        referenceCode: `PAY-${testId}-01`,
        bookingId: booking.id,
        customerId: customerUser.id,
        providerProfileId: providerProfile.id,
        amount: 60000,
        baseAmount: 60000,
        platformFee: 6000,
        taxAmount: 0,
        currency: 'INR',
        status: 'AUTHORIZED',
        paymentMethod: 'UPI',
        gatewayPaymentId: `pay_mock_${testId}`,
      },
    });

    // 7. Log in actors
    const adminSession = await loginUser(adminUser.email);
    const customerSession = await loginUser(customerUser.email);
    const providerSession = await loginUser(providerUser.email);

    let createdCategoryId: string = '';
    let createdServiceId: string = '';
    let createdVerificationId: string = '';
    let createdDisputeId: string = '';
    let createdTicketId: string = '';
    let createdTrustCaseId: string = '';

    // ====================================================
    // SECTION 52: ADMIN AUTHORIZATION & SECURITY (Tests 1-5)
    // ====================================================
    console.log('\n--- Section 52: Admin Authorization & Security ---');

    await runTest(1, 'Customer admin API access rejected with 403 Forbidden', async () => {
      const res = await apiCall('/api/admin/users', { cookie: customerSession.cookie });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
      assert(res.body.success === false, 'Expected success: false');
    });

    await runTest(2, 'Provider admin API access rejected with 403 Forbidden', async () => {
      const res = await apiCall('/api/admin/users', { cookie: providerSession.cookie });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
      assert(res.body.success === false, 'Expected success: false');
    });

    await runTest(3, 'Unauthenticated admin API access rejected with 401 Unauthorized', async () => {
      const res = await apiCall('/api/admin/users');
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      assert(res.body.success === false, 'Expected success: false');
    });

    await runTest(4, 'Admin API access allowed for authenticated real admin with 200 OK', async () => {
      const res = await apiCall('/api/admin/users', { cookie: adminSession.cookie });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success === true, 'Expected success: true');
      assert(Array.isArray(res.body.data.users), 'Expected users array in data');
    });

    await runTest(5, 'Admin actor identity cannot be spoofed (derived from token context)', async () => {
      // Create a spoofing attempt: pass an arbitrary actorUserId in body/header
      const spoofedActorId = '00000000-0000-0000-0000-000000000000';
      const res = await apiCall(`/api/admin/users/${customerUser.id}/status`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: {
          status: 'INACTIVE',
          reason: 'Verification test for identity provenance',
          actorUserId: spoofedActorId,
        },
        headers: {
          'X-Actor-User-Id': spoofedActorId,
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);

      // Verify the audit log recorded adminUser.id, NOT the spoofed actor ID
      const audit = await prisma.auditLog.findFirst({
        where: {
          entityType: 'User',
          entityId: customerUser.id,
          action: 'USER_STATUS_UPDATE',
        },
        orderBy: { createdAt: 'desc' },
      });
      assert(audit !== null, 'Expected audit log to be created');
      assert(audit?.actorUserId === adminUser.id, `Actor must be authenticated admin ${adminUser.id}, got ${audit?.actorUserId}`);

      // Restore user to ACTIVE
      await prisma.user.update({ where: { id: customerUser.id }, data: { status: 'ACTIVE' } });
    });

    // ====================================================
    // SECTION 53: USER MANAGEMENT (Tests 6-11)
    // ====================================================
    console.log('\n--- Section 53: User Management ---');

    await runTest(6, 'Admin can list users with pagination and filters', async () => {
      const res = await apiCall('/api/admin/users?role=CUSTOMER&page=1&limit=10', {
        cookie: adminSession.cookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.users.length > 0, 'Should find at least 1 customer');
      assert(typeof res.body.data.total === 'number', 'Total count should be present');
    });

    await runTest(7, 'Admin can read comprehensive user detail', async () => {
      const res = await apiCall(`/api/admin/users/${customerUser.id}`, {
        cookie: adminSession.cookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.id === customerUser.id, 'User ID should match');
      assert(res.body.data.fullName === customerUser.fullName, 'Full name should match');
      assert(Array.isArray(res.body.data.addresses), 'Addresses array should be returned');
      assert(typeof res.body.data.activity === 'object', 'Activity summary should be returned');
    });

    await runTest(8, 'Admin can suspend eligible account with reason', async () => {
      const res = await apiCall(`/api/admin/users/${customerUser.id}/status`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { status: 'SUSPENDED', reason: 'Repeated policy violations' },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.status === 'SUSPENDED', 'User status should now be SUSPENDED');

      // Verify in DB
      const dbUser = await prisma.user.findUnique({ where: { id: customerUser.id } });
      assert(dbUser?.status === 'SUSPENDED', 'Database record must be SUSPENDED');
    });

    await runTest(9, 'Suspension creates server-authoritative audit log', async () => {
      try {
        const audit = await prisma.auditLog.findFirst({
          where: {
            entityType: 'User',
            entityId: customerUser.id,
            action: 'USER_STATUS_UPDATE',
          },
          orderBy: { createdAt: 'desc' },
        });
        assert(audit !== null, 'Audit log record must exist');
        assert(audit?.reason === 'Repeated policy violations', 'Reason must match');
        assert(audit?.actorUserId === adminUser.id, 'Actor must be the authenticated admin');
      } finally {
        // Guarantee user is restored to ACTIVE for subsequent tests
        await prisma.user.update({ where: { id: customerUser.id }, data: { status: 'ACTIVE' } });
      }
    });

    await runTest(10, 'Unauthorized user management rejected for non-admin', async () => {
      const res = await apiCall(`/api/admin/users/${customerUser.id}/status`, {
        method: 'PATCH',
        cookie: providerSession.cookie,
        body: { status: 'SUSPENDED', reason: 'Unauthorized attempt' },
      });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await runTest(11, 'Password hash and credentials strictly absent from admin response', async () => {
      const res = await apiCall(`/api/admin/users/${customerUser.id}`, {
        cookie: adminSession.cookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.passwordHash === undefined, 'passwordHash must never be returned in user detail');
      assert(res.body.data.password === undefined, 'password must never be returned');

      const listRes = await apiCall('/api/admin/users', { cookie: adminSession.cookie });
      for (const u of listRes.body.data.users) {
        assert(u.passwordHash === undefined, 'passwordHash must never be returned in user list');
      }
    });

    // ====================================================
    // SECTION 54: PROVIDER OPERATIONS (Tests 12-16)
    // ====================================================
    console.log('\n--- Section 54: Provider Operations ---');

    await runTest(12, 'Admin can list service providers with operational details', async () => {
      const res = await apiCall('/api/admin/providers', { cookie: adminSession.cookie });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(res.body.data.providers), 'Expected providers array');
      const found = res.body.data.providers.find((p: any) => p.id === providerProfile.id);
      assert(found !== undefined, 'Created test provider should be listed');
    });

    await runTest(13, 'Admin can read comprehensive provider dossier', async () => {
      const res = await apiCall(`/api/admin/providers/${providerProfile.id}`, {
        cookie: adminSession.cookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.id === providerProfile.id, 'Provider ID should match');
      assert(res.body.data.businessName === providerProfile.businessName, 'Business name should match');
      assert(Array.isArray(res.body.data.services), 'Services should be included');
      assert(Array.isArray(res.body.data.serviceAreas), 'Service areas should be included');
    });

    await runTest(14, 'Admin provider restriction works and updates database', async () => {
      const res = await apiCall(`/api/admin/providers/${providerProfile.id}/restrict`, {
        method: 'POST',
        cookie: adminSession.cookie,
        body: { isRestricted: true, reason: 'Pending compliance audit' },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.isRestricted === true, 'Provider isRestricted should be true');

      const dbProv = await prisma.serviceProviderProfile.findUnique({
        where: { id: providerProfile.id },
      });
      assert(dbProv?.isRestricted === true, 'DB record isRestricted must be true');
    });

    await runTest(15, 'Restricted provider is excluded from public discovery search', async () => {
      const res = await apiCall(`/api/providers/search?city=Bangalore&serviceId=${service.id}`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const found = res.body.data?.providers?.find((p: any) => p.id === providerProfile.id);
      assert(found === undefined, 'Restricted provider must NOT appear in public discovery');

      // Unrestrict for later tests
      await prisma.serviceProviderProfile.update({
        where: { id: providerProfile.id },
        data: { isRestricted: false },
      });
    });

    await runTest(16, 'Provider restriction creates audit record with reason', async () => {
      const audit = await prisma.auditLog.findFirst({
        where: {
          entityType: 'ServiceProviderProfile',
          entityId: providerProfile.id,
          action: 'PROVIDER_RESTRICT',
        },
        orderBy: { createdAt: 'desc' },
      });
      assert(audit !== null, 'Audit log for restriction must exist');
      assert(audit?.reason === 'Pending compliance audit', 'Reason must match');
    });

    // ====================================================
    // SECTION 55: CATALOG ADMINISTRATION (Tests 17-22)
    // ====================================================
    console.log('\n--- Section 55: Catalog Administration ---');

    await runTest(17, 'Admin can create service category', async () => {
      const res = await apiCall('/api/admin/catalog/categories', {
        method: 'POST',
        cookie: adminSession.cookie,
        body: {
          name: `Home Painting ${testId}`,
          description: 'Interior and exterior painting services',
        },
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.id, 'Category ID should be generated');
      createdCategoryId = res.body.data.id;
    });

    await runTest(18, 'Admin can create service under category', async () => {
      const res = await apiCall('/api/admin/catalog/services', {
        method: 'POST',
        cookie: adminSession.cookie,
        body: {
          categoryId: createdCategoryId,
          title: `Wall Painting ${testId}`,
          description: 'Single room wall painting',
          pricingModel: 'FIXED',
          basePricePaise: 250000,
          durationMinutes: 120,
        },
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.title.includes('Wall Painting'), 'Title should match');
      createdServiceId = res.body.data.id;
    });

    await runTest(19, 'Admin can update service catalog details', async () => {
      const res = await apiCall(`/api/admin/catalog/services/${createdServiceId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: {
          title: `Premium Wall Painting ${testId}`,
          basePricePaise: 300000,
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.title.startsWith('Premium'), 'Updated title expected');
    });

    await runTest(20, 'Service deactivation works safely without deletion', async () => {
      const res = await apiCall(`/api/admin/catalog/services/${createdServiceId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { isActive: false },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.isActive === false, 'Service should be deactivated');

      const dbService = await prisma.service.findUnique({ where: { id: createdServiceId } });
      assert(dbService?.isActive === false, 'DB service must be isActive: false');
    });

    await runTest(21, 'Historical references remain intact on deactivated service', async () => {
      // Historical booking references the initial service. Deactivating it should not alter booking
      await prisma.service.update({ where: { id: service.id }, data: { isActive: false } });
      const histBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert(histBooking !== null, 'Historical booking remains intact');
      assert(histBooking?.serviceId === service.id, 'Historical serviceId reference preserved');
    });

    await runTest(22, 'Non-admin catalog mutation rejected with 403', async () => {
      const res = await apiCall('/api/admin/catalog/categories', {
        method: 'POST',
        cookie: customerSession.cookie,
        body: { name: 'Unauthorized Category' },
      });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    // ====================================================
    // SECTION 56: VERIFICATION DOMAIN (Tests 23-30)
    // ====================================================
    console.log('\n--- Section 56: Verification Domain ---');

    await runTest(23, 'Verification record creation for provider onboarding/compliance', async () => {
      const res = await apiCall('/api/providers/verification', {
        method: 'POST',
        cookie: providerSession.cookie,
        body: {
          verificationType: 'IDENTITY',
          documents: [
            { type: 'AADHAAR', documentRef: 'doc_ref_101', verifiedAt: null },
          ],
        },
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.status === 'SUBMITTED', 'Status should be SUBMITTED');
      createdVerificationId = res.body.data.id;
    });

    await runTest(24, 'Verification review queue lists submitted records for admin', async () => {
      const res = await apiCall('/api/admin/verifications?status=SUBMITTED', {
        cookie: adminSession.cookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(res.body.data.verifications), 'Verifications array expected');
      const found = res.body.data.verifications.find((v: any) => v.id === createdVerificationId);
      assert(found !== undefined, 'Created verification should appear in queue');
    });

    await runTest(25, 'Approve transition updates verification record and provider isVerified', async () => {
      const res = await apiCall(`/api/admin/verifications/${createdVerificationId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: {
          status: 'APPROVED',
          reviewerNotes: 'Identity confirmed against regulatory records',
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.status === 'APPROVED', 'Status should be APPROVED');

      // Verify provider profile isVerified is now true
      const dbProv = await prisma.serviceProviderProfile.findUnique({
        where: { id: providerProfile.id },
      });
      assert(dbProv?.isVerified === true, 'Provider isVerified must be true after approval');
    });

    await runTest(26, 'Reject transition records rejection reason and updates status', async () => {
      // Create a 2nd verification record to test rejection
      const rec2 = await prisma.verificationRecord.create({
        data: {
          providerProfileId: providerProfile.id,
          verificationType: 'POLICE_CLEARANCE',
          status: 'SUBMITTED',
          documents: [{ type: 'POLICE_CERT', documentRef: 'doc_ref_102' }],
        },
      });

      const res = await apiCall(`/api/admin/verifications/${rec2.id}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: {
          status: 'REJECTED',
          rejectionReason: 'Certificate is expired',
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.status === 'REJECTED', 'Status must be REJECTED');
      assert(res.body.data.rejectionReason === 'Certificate is expired', 'Rejection reason must match');
    });

    await runTest(27, 'Request-information transition marks status as NEEDS_INFORMATION', async () => {
      const rec3 = await prisma.verificationRecord.create({
        data: {
          providerProfileId: providerProfile.id,
          verificationType: 'TRADE_LICENSE',
          status: 'SUBMITTED',
          documents: [{ type: 'TRADE_CERT', documentRef: 'doc_ref_103' }],
        },
      });

      const res = await apiCall(`/api/admin/verifications/${rec3.id}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: {
          status: 'NEEDS_INFORMATION',
          rejectionReason: 'Please provide clear scan of seal',
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.status === 'NEEDS_INFORMATION', 'Status must be NEEDS_INFORMATION');
    });

    await runTest(28, 'Invalid transition rejected with 400 Bad Request', async () => {
      const res = await apiCall(`/api/admin/verifications/${createdVerificationId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: {
          status: 'INVALID_STATUS',
        },
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await runTest(29, 'Reviewer identity and timestamp recorded in verification record', async () => {
      const dbRec = await prisma.verificationRecord.findUnique({
        where: { id: createdVerificationId },
      });
      assert(dbRec?.reviewedByAdminId === adminUser.id, 'reviewedByAdminId must be admin ID');
      assert(dbRec?.reviewedAt !== null, 'reviewedAt must be populated');
    });

    await runTest(30, 'Verification data privacy enforced against customer access', async () => {
      const res = await apiCall(`/api/admin/verifications/${createdVerificationId}`, {
        cookie: customerSession.cookie,
      });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    // ====================================================
    // SECTION 57: REPORTS & DISPUTES (Tests 31-39)
    // ====================================================
    console.log('\n--- Section 57: Reports & Disputes ---');

    await runTest(31, 'Report appears in admin queue from Phase 6 foundation', async () => {
      // Create a test report
      const report = await prisma.report.create({
        data: {
          reporterUserId: customerUser.id,
          reportedUserId: providerUser.id,
          bookingId: booking.id,
          reason: 'INAPPROPRIATE_BEHAVIOR',
          details: 'Provider was unprofessional during the visit',
          status: 'PENDING',
        },
      });

      const res = await apiCall('/api/admin/reports', {
        cookie: adminSession.cookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const found = res.body.data.reports.find((r: any) => r.id === report.id);
      assert(found !== undefined, 'Report must be found in admin reports list');
    });

    await runTest(32, 'Admin can inspect report detail and update status', async () => {
      const reports = await prisma.report.findMany({ take: 1 });
      assert(reports.length > 0, 'Report must exist');
      const rId = reports[0]!.id;

      const res = await apiCall(`/api/admin/reports/${rId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { status: 'UNDER_REVIEW', resolution: 'Investigating incident' },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.status === 'UNDER_REVIEW', 'Status should be UNDER_REVIEW');
    });

    await runTest(33, 'Dispute creation linked to booking', async () => {
      const res = await apiCall('/api/disputes', {
        method: 'POST',
        cookie: customerSession.cookie,
        body: {
          bookingId: booking.id,
          category: 'SERVICE_QUALITY',
          description: 'Wiring was incomplete and sockets left open',
          amountInvolvedPaise: 60000,
        },
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.status === 'OPEN', 'Initial status must be OPEN');
      createdDisputeId = res.body.data.id;
    });

    await runTest(34, 'Dispute creation on unauthorized booking rejected with 403', async () => {
      // Create another customer
      const thirdUser = await prisma.user.create({
        data: {
          email: `p7_third_${testId}@example.com`,
          fullName: 'Stranger',
          phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
          passwordHash,
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });
      const thirdSession = await loginUser(thirdUser.email);

      const res = await apiCall('/api/disputes', {
        method: 'POST',
        cookie: thirdSession.cookie,
        body: {
          bookingId: booking.id,
          category: 'BILLING',
          description: 'I did not book this but want to dispute it',
        },
      });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await runTest(35, 'Valid dispute transition from OPEN to UNDER_REVIEW', async () => {
      const res = await apiCall(`/api/admin/disputes/${createdDisputeId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { status: 'UNDER_REVIEW' },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.status === 'UNDER_REVIEW', 'Status should be UNDER_REVIEW');
    });

    await runTest(36, 'Invalid dispute transition rejected with 400', async () => {
      const res = await apiCall(`/api/admin/disputes/${createdDisputeId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { status: 'INVALID_TRANSITION' },
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await runTest(37, 'Admin assignment records assignedAdminId', async () => {
      const res = await apiCall(`/api/admin/disputes/${createdDisputeId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { assignedAdminId: secondaryAdminUser.id },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.assignedAdminId === secondaryAdminUser.id, 'Assigned admin must match');
    });

    await runTest(38, 'Dispute resolution recorded with resolution timestamp and notes', async () => {
      const res = await apiCall(`/api/admin/disputes/${createdDisputeId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: {
          status: 'RESOLVED',
          resolution: 'Customer provided proof; full resolution agreed.',
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.status === 'RESOLVED', 'Dispute must be RESOLVED');
      assert(res.body.data.resolvedAt !== null, 'resolvedAt must be set');
    });

    await runTest(39, 'Audit record generated for dispute resolution', async () => {
      const audit = await prisma.auditLog.findFirst({
        where: {
          entityType: 'Dispute',
          entityId: createdDisputeId,
          action: 'DISPUTE_TRANSITION',
        },
        orderBy: { createdAt: 'desc' },
      });
      assert(audit !== null, 'Audit log must be created on dispute update');
      assert(audit?.actorUserId === adminUser.id, 'Actor must be the authenticated admin');
    });

    // ====================================================
    // SECTION 58: SUPPORT TICKETS (Tests 40-45)
    // ====================================================
    console.log('\n--- Section 58: Support Tickets ---');

    await runTest(40, 'Support ticket creation by user', async () => {
      const res = await apiCall('/api/support/tickets', {
        method: 'POST',
        cookie: customerSession.cookie,
        body: {
          subject: 'Question regarding billing invoice',
          category: 'BILLING',
          priority: 'MEDIUM',
          description: 'Where can I download the GST invoice copy?',
          bookingId: booking.id,
        },
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.status === 'OPEN', 'Ticket status should be OPEN');
      createdTicketId = res.body.data.id;
    });

    await runTest(41, 'Support ticket visible in admin queue', async () => {
      const res = await apiCall('/api/admin/support/tickets', {
        cookie: adminSession.cookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const found = res.body.data.tickets.find((t: any) => t.id === createdTicketId);
      assert(found !== undefined, 'Ticket must be found in admin tickets list');
    });

    await runTest(42, 'Ticket assignment to operational admin', async () => {
      const res = await apiCall(`/api/admin/support/tickets/${createdTicketId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { assignedAdminId: adminUser.id },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.assignedAdminId === adminUser.id, 'assignedAdminId should match');
    });

    await runTest(43, 'Valid ticket status transition to IN_PROGRESS and RESOLVED', async () => {
      const res1 = await apiCall(`/api/admin/support/tickets/${createdTicketId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { status: 'IN_PROGRESS', internalNotes: 'Assigned to billing team for follow-up' },
      });
      assert(res1.status === 200, `Expected 200, got ${res1.status}`);
      assert(res1.body.data.status === 'IN_PROGRESS', 'Should transition to IN_PROGRESS');

      const res2 = await apiCall(`/api/admin/support/tickets/${createdTicketId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { status: 'RESOLVED', resolution: 'Invoice sent via email' },
      });
      assert(res2.status === 200, `Expected 200, got ${res2.status}`);
      assert(res2.body.data.status === 'RESOLVED', 'Should transition to RESOLVED');
    });

    await runTest(44, 'Invalid ticket status transition rejected with 400', async () => {
      const res = await apiCall(`/api/admin/support/tickets/${createdTicketId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { status: 'NON_EXISTENT_STATUS' },
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await runTest(45, 'Customer cannot read internal admin notes on support ticket', async () => {
      const res = await apiCall(`/api/support/tickets/${createdTicketId}`, {
        cookie: customerSession.cookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.internalNotes === null || res.body.data.internalNotes === undefined, 'internalNotes must be redacted/null for customer');
    });

    // ====================================================
    // SECTION 59: AUDIT LOGS (Tests 46-50)
    // ====================================================
    console.log('\n--- Section 59: Audit Logs ---');

    await runTest(46, 'Audit log created by admin mutation', async () => {
      const count = await prisma.auditLog.count({ where: { actorUserId: adminUser.id } });
      assert(count > 0, `Expected audit log entries for admin ${adminUser.id}, found ${count}`);
    });

    await runTest(47, 'Audit log is append-only and immutable (no delete/update endpoints)', async () => {
      // Check that DELETE /api/admin/audit-logs returns 404/405/error
      const resDelete = await apiCall('/api/admin/audit-logs/12345', {
        method: 'DELETE',
        cookie: adminSession.cookie,
      });
      assert(resDelete.status === 404, `Audit log delete endpoint must not exist, got ${resDelete.status}`);

      const resPut = await apiCall('/api/admin/audit-logs/12345', {
        method: 'PUT',
        cookie: adminSession.cookie,
        body: { action: 'ALTERED' },
      });
      assert(resPut.status === 404, `Audit log update endpoint must not exist, got ${resPut.status}`);
    });

    await runTest(48, 'Non-admin cannot read audit logs with 403 Forbidden', async () => {
      const res = await apiCall('/api/admin/audit-logs', { cookie: customerSession.cookie });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await runTest(49, 'Audit log pagination and filtering by entityType works', async () => {
      const res = await apiCall('/api/admin/audit-logs?entityType=User&page=1&limit=5', {
        cookie: adminSession.cookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const logs = res.body.data.logs || res.body.data.auditLogs;
      assert(Array.isArray(logs), 'Expected logs array');
      for (const log of logs) {
        assert(log.entityType?.toLowerCase() === 'user', `Filtered log must have entityType: User, got ${log.entityType}`);
      }
    });

    await runTest(50, 'Actor identity in audit log is always server-derived', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { actorUserId: adminUser.id },
        take: 3,
      });
      assert(logs.length > 0, 'Logs must exist for admin');
      for (const l of logs) {
        assert(l.actorUserId === adminUser.id, 'Actor ID must match authenticated admin');
      }
    });

    // ====================================================
    // SECTION 60: SETTINGS & POLICIES (Tests 51-56)
    // ====================================================
    console.log('\n--- Section 60: Settings & Policies ---');

    await runTest(51, 'Authorized admin can read platform settings', async () => {
      const res = await apiCall('/api/admin/settings', { cookie: adminSession.cookie });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const settings = Array.isArray(res.body.data) ? res.body.data : res.body.data.settings;
      assert(Array.isArray(settings), 'Settings array expected');
    });

    await runTest(52, 'Unauthorized user cannot read platform settings with 403', async () => {
      const res = await apiCall('/api/admin/settings', { cookie: customerSession.cookie });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await runTest(53, 'Valid policy update persists to database', async () => {
      const res = await apiCall('/api/admin/settings/MAINTENANCE_MODE', {
        method: 'PUT',
        cookie: adminSession.cookie,
        body: {
          value: 'false',
          description: 'Emergency platform maintenance mode',
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.value === 'false', 'Updated value should be false');

      const dbSetting = await prisma.platformSetting.findUnique({
        where: { key: 'MAINTENANCE_MODE' },
      });
      assert(dbSetting?.value === 'false', 'DB record must reflect updated value');
    });

    await runTest(54, 'Invalid policy rejected with 400 Bad Request', async () => {
      const res = await apiCall('/api/admin/settings/PLATFORM_COMMISSION_PERCENT', {
        method: 'PUT',
        cookie: adminSession.cookie,
        body: {
          value: '150', // Exceeds 100%
        },
      });
      assert(res.status === 400, `Expected 400 for commission > 100%, got ${res.status}`);
    });

    await runTest(55, 'Policy change creates audit log', async () => {
      const audit = await prisma.auditLog.findFirst({
        where: {
          entityType: 'PlatformSetting',
          entityId: 'MAINTENANCE_MODE',
          action: 'PLATFORM_SETTING_UPDATE',
        },
        orderBy: { createdAt: 'desc' },
      });
      assert(audit !== null, 'Audit log for setting update must exist');
      assert(audit?.actorUserId === adminUser.id, 'Actor must be the authenticated admin');
    });

    await runTest(56, 'Historical financial records remain unchanged by policy changes', async () => {
      // Historical payment and booking created earlier must remain intact
      const dbPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
      assert(dbPayment !== null, 'Historical payment exists');
      assert(dbPayment?.amount === 60000, 'Historical payment amount unaltered');

      const dbBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert(dbBooking !== null, 'Historical booking remains intact');
      assert(dbBooking?.priceSnapshot === 600, 'Historical booking price snapshot unaltered');
    });

    // ====================================================
    // SECTION 61: TRUST & SAFETY CASES (Tests 57-62)
    // ====================================================
    console.log('\n--- Section 61: Trust & Safety Cases ---');

    await runTest(57, 'Trust/safety case creation with factual signals', async () => {
      const res = await apiCall('/api/admin/trust-safety/cases', {
        method: 'POST',
        cookie: adminSession.cookie,
        body: {
          caseType: 'SUSPICIOUS_CANCELLATIONS',
          priority: 'HIGH',
          userId: customerUser.id,
          triggerReason: '3 consecutive cancellations within 2 hours of scheduled slot',
          evidenceReferences: ['bkg_ref_001', 'bkg_ref_002'],
        },
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.status === 'FLAGGED' || res.body.data.status === 'OPEN', 'Initial status must be FLAGGED or OPEN');
      assert(res.body.data.severity === 'HIGH' || res.body.data.priority === 'HIGH', 'Severity/priority must match');
      createdTrustCaseId = res.body.data.id;
    });

    await runTest(58, 'Case status transitions from OPEN to UNDER_REVIEW to RESOLVED', async () => {
      const res1 = await apiCall(`/api/admin/trust-safety/cases/${createdTrustCaseId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { status: 'UNDER_REVIEW' },
      });
      assert(res1.status === 200, `Expected 200, got ${res1.status}`);
      assert(res1.body.data.status === 'UNDER_REVIEW', 'Should be UNDER_REVIEW');

      const res2 = await apiCall(`/api/admin/trust-safety/cases/${createdTrustCaseId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: {
          status: 'RESOLVED',
          resolution: 'Customer clarified reason; verified legitimate emergency.',
        },
      });
      assert(res2.status === 200, `Expected 200, got ${res2.status}`);
      assert(res2.body.data.status === 'RESOLVED' || res2.body.data.status === 'CLEARED', 'Should be RESOLVED/CLEARED');
    });

    await runTest(59, 'Admin assignment on trust & safety case', async () => {
      const res = await apiCall(`/api/admin/trust-safety/cases/${createdTrustCaseId}`, {
        method: 'PATCH',
        cookie: adminSession.cookie,
        body: { assignedAdminId: secondaryAdminUser.id },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.assignedAdminId === secondaryAdminUser.id, 'Assigned admin should match');
    });

    await runTest(60, 'Related entity authorization preserves referential integrity', async () => {
      const dbCase = await prisma.trustSafetyCase.findUnique({
        where: { id: createdTrustCaseId },
      });
      assert(dbCase !== null, 'Case must exist');
      assert(dbCase?.entityType === 'USER', 'entityType must be USER');
      assert(dbCase?.entityId === customerUser.id, 'entityId must match customerUser.id');
    });

    await runTest(61, 'No automatic AI/fraud decision (purely factual and admin reviewed)', async () => {
      const dbCase = await prisma.trustSafetyCase.findUnique({
        where: { id: createdTrustCaseId },
      });
      // Verify no automated fraud score field exists or was calculated
      assert((dbCase as any).aiScore === undefined, 'aiScore must NOT exist on TrustSafetyCase');
      assert((dbCase as any).riskModelVersion === undefined, 'riskModelVersion must NOT exist');
      assert(typeof dbCase?.riskSignal === 'string', 'Factual riskSignal preserved');
    });

    await runTest(62, 'Emergency support case foundation routes to immediate admin visibility', async () => {
      const res = await apiCall('/api/support/tickets', {
        method: 'POST',
        cookie: customerSession.cookie,
        body: {
          subject: 'EMERGENCY: Gas smell noticed during kitchen appliance repair',
          category: 'SAFETY_EMERGENCY',
          priority: 'URGENT',
          description: 'Provider is on site and gas odor is noticeable. Immediate safety escalation requested.',
          bookingId: booking.id,
        },
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.priority === 'URGENT', 'Priority must be URGENT');
      assert(res.body.data.category === 'SAFETY_EMERGENCY', 'Category must be SAFETY_EMERGENCY');

      // Verify admin can fetch urgent tickets
      const urgentList = await apiCall('/api/admin/support/tickets?priority=URGENT', {
        cookie: adminSession.cookie,
      });
      assert(urgentList.status === 200, `Expected 200, got ${urgentList.status}`);
      const found = urgentList.body.data.tickets.find((t: any) => t.id === res.body.data.id);
      assert(found !== undefined, 'Urgent emergency ticket must be visible in admin emergency queue');
    });

  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  // ----------------------------------------------------
  // TEST SUMMARY REPORT
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log('=== SEVASETU PHASE 7 TEST SUITE RESULTS ===');
  console.log('======================================================');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`TOTAL:  ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  if (failed > 0) {
    console.error('\nFAILED TESTS:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.error(`  Test ${r.num}: ${r.name} -> ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log('\nALL 62 PHASE 7 TESTS PASSED PROVABLY IN POSTGRESQL!');
  }
}

runPhase7Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
