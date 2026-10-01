import http from 'http';
import { createApp } from '../app.js';
import { getPrismaClient } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { initSocketServer } from '../socket.js';
import { io as ClientSocketIo, Socket as ClientSocket } from 'socket.io-client';
import type { ConversationRecord, MessageRecord, NotificationRecord } from '@sevasetu/shared';

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

async function runPhase6Tests() {
  console.log('=== STARTING SEVASETU FUNCTIONAL PHASE 6 TEST SUITE ===');

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

  // Helper to authenticate user and return cookie
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
    // ----------------------------------------------------
    // SETUP TEST FIXTURES
    // ----------------------------------------------------
    console.log('--- Setting up Phase 6 test fixtures ---');

    // 1. Create Customer 1
    const customer1User = await prisma.user.create({
      data: {
        email: `p6_cust1_${testId}@example.com`,
        fullName: 'Rahul Sharma',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    const cust1Address = await prisma.address.create({
      data: {
        userId: customer1User.id,
        label: 'HOME',
        flatNumber: 'Flat 101',
        streetArea: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        postalCode: '201301',
      },
    });

    // 2. Create Customer 2 (for unauthorized/cross-user testing)
    const customer2User = await prisma.user.create({
      data: {
        email: `p6_cust2_${testId}@example.com`,
        fullName: 'Amit Verma',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    // 3. Create Service Category & Service
    const category = await prisma.serviceCategory.create({
      data: {
        name: `AC Service ${testId}`,
        slug: `ac-service-${testId}`,
        description: 'AC Cooling and Maintenance',
      },
    });

    const service = await prisma.service.create({
      data: {
        categoryId: category.id,
        title: `Deep AC Cleaning ${testId}`,
        slug: `deep-ac-cleaning-${testId}`,
        description: 'Comprehensive chemical wash and filter cleaning',
        pricingModel: 'FIXED',
        basePrice: 500,
        durationMinutes: 60,
        isActive: true,
      },
    });

    // 4. Create Provider 1
    const provider1User = await prisma.user.create({
      data: {
        email: `p6_prov1_${testId}@example.com`,
        fullName: 'Suresh Kumar',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
    });

    const provider1Profile = await prisma.serviceProviderProfile.create({
      data: {
        userId: provider1User.id,
        businessName: 'Suresh Cooling Services',
        experienceYears: 5,
        onboardingStatus: 'COMPLETED',
        isPubliclyListed: true,
        vacationMode: false,
      },
    });

    await prisma.providerService.create({
      data: {
        providerProfileId: provider1Profile.id,
        serviceId: service.id,
        customPrice: 500,
        isActive: true,
      },
    });

    await prisma.providerServiceArea.create({
      data: {
        providerProfileId: provider1Profile.id,
        city: 'Noida',
        locality: 'Sector 62',
        postalCode: '201301',
        radiusKm: 15,
      },
    });

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
    for (const day of days) {
      await prisma.providerAvailability.create({
        data: {
          providerProfileId: provider1Profile.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '20:00',
          isAvailable: true,
        },
      });
    }

    // 5. Create Provider 2 (unrelated provider)
    const provider2User = await prisma.user.create({
      data: {
        email: `p6_prov2_${testId}@example.com`,
        fullName: 'Vikram Singh',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
    });

    await prisma.serviceProviderProfile.create({
      data: {
        userId: provider2User.id,
        businessName: 'Vikram Aircon',
        experienceYears: 7,
        onboardingStatus: 'COMPLETED',
        isPubliclyListed: true,
      },
    });

    // Logins
    const cust1Auth = await loginUser(customer1User.email);
    const cust2Auth = await loginUser(customer2User.email);
    const prov1Auth = await loginUser(provider1User.email);
    const prov2Auth = await loginUser(provider2User.email);

    // Create bookings with different statuses:
    // Booking A: COMPLETED
    const bookingCompleted = await prisma.booking.create({
      data: {
        referenceCode: `BK-${testId}-CMP`,
        serviceRequestId: (
          await prisma.serviceRequest.create({
            data: {
              customerId: customer1User.id,
              serviceId: service.id,
              selectedProviderId: provider1Profile.id,
              description: 'Completed AC Service',
              requestedDate: new Date('2026-10-05T00:00:00.000Z'),
              requestedStartTime: '10:00',
              addressId: cust1Address.id,
              addressSnapshot: { flatNumber: 'Flat 101', streetArea: 'Sector 62', city: 'Noida', postalCode: '201301' },
              status: 'ACCEPTED',
            },
          })
        ).id,
        customerId: customer1User.id,
        providerProfileId: provider1Profile.id,
        serviceId: service.id,
        scheduledDate: new Date('2026-10-05T00:00:00.000Z'),
        scheduledStartTime: '10:00',
        scheduledEndTime: '11:00',
        status: 'COMPLETED',
        serviceTitleSnapshot: service.title,
        pricingModelSnapshot: 'FIXED',
        priceSnapshot: 500,
        locationSnapshot: { flatNumber: 'Flat 101', streetArea: 'Sector 62', city: 'Noida', postalCode: '201301' },
        customerSnapshot: { fullName: customer1User.fullName, email: customer1User.email },
        providerSnapshot: { businessName: provider1Profile.businessName },
      },
    });

    // Booking B: PENDING_PROVIDER
    const bookingPending = await prisma.booking.create({
      data: {
        referenceCode: `BK-${testId}-PND`,
        serviceRequestId: (
          await prisma.serviceRequest.create({
            data: {
              customerId: customer1User.id,
              serviceId: service.id,
              selectedProviderId: provider1Profile.id,
              description: 'Pending AC Service',
              requestedDate: new Date('2026-10-06T00:00:00.000Z'),
              requestedStartTime: '14:00',
              addressId: cust1Address.id,
              addressSnapshot: { flatNumber: 'Flat 101', streetArea: 'Sector 62', city: 'Noida', postalCode: '201301' },
              status: 'PENDING_PROVIDER',
            },
          })
        ).id,
        customerId: customer1User.id,
        providerProfileId: provider1Profile.id,
        serviceId: service.id,
        scheduledDate: new Date('2026-10-06T00:00:00.000Z'),
        scheduledStartTime: '14:00',
        scheduledEndTime: '15:00',
        status: 'PENDING_PROVIDER',
        serviceTitleSnapshot: service.title,
        pricingModelSnapshot: 'FIXED',
        priceSnapshot: 500,
        locationSnapshot: { flatNumber: 'Flat 101', streetArea: 'Sector 62', city: 'Noida', postalCode: '201301' },
        customerSnapshot: { fullName: customer1User.fullName, email: customer1User.email },
        providerSnapshot: { businessName: provider1Profile.businessName },
      },
    });

    // Booking C: CANCELLED
    const bookingCancelled = await prisma.booking.create({
      data: {
        referenceCode: `BK-${testId}-CNC`,
        serviceRequestId: (
          await prisma.serviceRequest.create({
            data: {
              customerId: customer1User.id,
              serviceId: service.id,
              selectedProviderId: provider1Profile.id,
              description: 'Cancelled AC Service',
              requestedDate: new Date('2026-10-07T00:00:00.000Z'),
              requestedStartTime: '16:00',
              addressId: cust1Address.id,
              addressSnapshot: { flatNumber: 'Flat 101', streetArea: 'Sector 62', city: 'Noida', postalCode: '201301' },
              status: 'CANCELLED',
            },
          })
        ).id,
        customerId: customer1User.id,
        providerProfileId: provider1Profile.id,
        serviceId: service.id,
        scheduledDate: new Date('2026-10-07T00:00:00.000Z'),
        scheduledStartTime: '16:00',
        scheduledEndTime: '17:00',
        status: 'CANCELLED',
        serviceTitleSnapshot: service.title,
        pricingModelSnapshot: 'FIXED',
        priceSnapshot: 500,
        locationSnapshot: { flatNumber: 'Flat 101', streetArea: 'Sector 62', city: 'Noida', postalCode: '201301' },
        customerSnapshot: { fullName: customer1User.fullName, email: customer1User.email },
        providerSnapshot: { businessName: provider1Profile.businessName },
      },
    });

    // =========================================================================
    // SECTION 44: BACKEND TESTS — REVIEWS
    // =========================================================================
    console.log('\n--- Running Section 44: Review Tests ---');

    await runTest(1, 'Review completed booking succeeds with aspect ratings', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/review`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: {
          overallRating: 5,
          punctuality: 5,
          workmanship: 4,
          cleanliness: 5,
          communication: 4,
          reviewText: 'Punctual and very thorough service!',
        },
      });

      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert(res.body.success === true, 'Response success should be true');
      assert(res.body.data.overallRating === 5, 'Overall rating should be 5');
      assert(res.body.data.punctuality === 5, 'Punctuality should be 5');
    });

    await runTest(2, 'Review pending booking is rejected', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingPending.id}/review`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: {
          overallRating: 5,
          reviewText: 'Trying to review early',
        },
      });

      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(res.body.success === false, 'Should be rejected');
    });

    await runTest(3, 'Review cancelled booking is rejected', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingCancelled.id}/review`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: {
          overallRating: 5,
          reviewText: 'Trying to review cancelled booking',
        },
      });

      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(res.body.success === false, 'Should be rejected');
    });

    await runTest(4, 'Non-owner customer cannot review booking', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/review`, {
        method: 'POST',
        cookie: cust2Auth.cookie,
        body: {
          overallRating: 4,
          reviewText: 'Reviewing someone elses booking',
        },
      });

      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
      assert(res.body.error.code === 'FORBIDDEN', 'Error code should be FORBIDDEN');
    });

    await runTest(5, 'Provider cannot submit customer review', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/review`, {
        method: 'POST',
        cookie: prov1Auth.cookie,
        body: {
          overallRating: 5,
          reviewText: 'Provider trying to self-review',
        },
      });

      assert(res.status === 403, `Expected 403 Forbidden for provider, got ${res.status}`);
    });

    await runTest(6, 'Duplicate review for same completed booking is rejected', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/review`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: {
          overallRating: 4,
          reviewText: 'Second review attempt',
        },
      });

      assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
      assert(res.body.error.code === 'DUPLICATE_REVIEW', 'Code should be DUPLICATE_REVIEW');
    });

    await runTest(7, 'Invalid ratings (<1, >5, decimals) are rejected', async () => {
      // Test rating 0
      const res1 = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/review`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: { overallRating: 0 },
      });
      assert(res1.status === 400, `Expected 400 for rating 0, got ${res1.status}`);

      // Test rating 6
      const res2 = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/review`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: { overallRating: 6 },
      });
      assert(res2.status === 400, `Expected 400 for rating 6, got ${res2.status}`);

      // Test decimal 4.5
      const res3 = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/review`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: { overallRating: 4.5 },
      });
      assert(res3.status === 400, `Expected 400 for decimal rating, got ${res3.status}`);
    });

    await runTest(8, 'Review is persistently stored in PostgreSQL', async () => {
      const dbReview = await prisma.review.findUnique({
        where: { bookingId: bookingCompleted.id },
      });

      assert(!!dbReview, 'Review must exist in PostgreSQL');
      assert(dbReview?.overallRating === 5, 'overallRating in DB must match 5');
      assert(dbReview?.punctuality === 5, 'punctuality in DB must match 5');
    });

    await runTest(9, 'Provider aggregate updates correctly in PostgreSQL', async () => {
      const profile = await prisma.serviceProviderProfile.findUnique({
        where: { id: provider1Profile.id },
      });

      assert(!!profile, 'Profile must exist');
      assert(profile?.reviewCount === 1, `Expected reviewCount 1, got ${profile?.reviewCount}`);
      assert(profile?.rating === 5, `Expected rating 5.0, got ${profile?.rating}`);

      // Verify reputation endpoint calculates accurately
      const repRes = await apiCall(`/api/providers/${provider1Profile.id}/reputation`);
      assert(repRes.status === 200, 'Reputation endpoint returned 200');
      assert(repRes.body.data.totalReviews === 1, 'Total reviews should be 1');
      assert(repRes.body.data.averageRating === 5, 'Average rating should be 5');
      assert(repRes.body.data.aspectAverages.punctuality === 5, 'Aspect average punctuality should be 5');
    });

    await runTest(10, 'Public review response is sanitized for customer privacy', async () => {
      const res = await apiCall(`/api/providers/${provider1Profile.id}/reviews`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.reviews.length >= 1, 'Should return at least 1 review');

      const pubReview = res.body.data.reviews[0];
      // Customer name sanitized: Rahul Sharma -> Rahul S.
      assert(pubReview.customerName === 'Rahul S.', `Expected 'Rahul S.', got '${pubReview.customerName}'`);
      assert(!pubReview.email, 'Email must not be exposed');
      assert(!pubReview.phone, 'Phone must not be exposed');
      assert(!pubReview.address, 'Address must not be exposed');
    });

    // =========================================================================
    // SECTION 45: BACKEND TESTS — MESSAGING
    // =========================================================================
    console.log('\n--- Running Section 45: Messaging Tests ---');

    let conversationId: string = '';

    await runTest(11, 'Customer accesses own booking conversation', async () => {
      const res = await apiCall(`/api/bookings/${bookingCompleted.id}/conversation`, {
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert(res.body.success === true, 'Success should be true');
      assert(res.body.data.bookingId === bookingCompleted.id, 'Booking ID matches');
      conversationId = res.body.data.id;
    });

    await runTest(12, 'Provider accesses own booking conversation', async () => {
      const res = await apiCall(`/api/bookings/${bookingCompleted.id}/conversation`, {
        cookie: prov1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.id === conversationId, 'Conversation IDs should match');
    });

    await runTest(13, 'Unrelated customer is blocked from conversation', async () => {
      const res = await apiCall(`/api/bookings/${bookingCompleted.id}/conversation`, {
        cookie: cust2Auth.cookie,
      });

      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await runTest(14, 'Unrelated provider is blocked from conversation', async () => {
      const res = await apiCall(`/api/bookings/${bookingCompleted.id}/conversation`, {
        cookie: prov2Auth.cookie,
      });

      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await runTest(15, 'Message persists in PostgreSQL', async () => {
      const res = await apiCall(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: { content: 'Hello Suresh, I have a question about the filter.' },
      });

      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert(res.body.data.content === 'Hello Suresh, I have a question about the filter.', 'Content matches');

      const dbMessage = await prisma.message.findUnique({
        where: { id: res.body.data.id },
      });
      assert(!!dbMessage, 'Message must exist in DB');
      assert(dbMessage?.senderUserId === customer1User.id, 'Sender user ID matches customer 1');
    });

    await runTest(16, 'Sender identity derived strictly from authenticated user', async () => {
      const res = await apiCall(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        cookie: prov1Auth.cookie,
        body: {
          content: 'Sure Rahul, the filter was chemically cleaned and is guaranteed for 6 months.',
          // Malicious attempt to spoof sender
          senderUserId: customer1User.id,
        },
      });

      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.data.senderUserId === provider1User.id, 'Sender ID must be provider1User, not spoofed');
    });

    await runTest(17, 'Empty / invalid message is rejected', async () => {
      const res = await apiCall(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: { content: '   ' },
      });

      assert(res.status === 400, `Expected 400 for empty content, got ${res.status}`);
    });

    await runTest(18, 'Message retrieval and pagination works', async () => {
      const res = await apiCall(`/api/conversations/${conversationId}/messages?limit=1&page=1`, {
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.messages.length === 1, 'Should return exactly 1 message for limit=1');
      assert(res.body.data.pagination.total >= 2, 'Total messages should be >= 2');
    });

    await runTest(19, 'Unauthorized user cannot send message into conversation', async () => {
      const res = await apiCall(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        cookie: cust2Auth.cookie,
        body: { content: 'Intruding into conversation' },
      });

      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await runTest(20, 'Booking context enforced in conversation', async () => {
      const res = await apiCall(`/api/conversations`, {
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const conv = res.body.data.find((c: ConversationRecord) => c.id === conversationId);
      assert(!!conv, 'Conversation must be in customer list');
      assert(conv.bookingReferenceCode === bookingCompleted.referenceCode, 'Reference code matches');
      assert(conv.serviceTitle === service.title, 'Service title matches');
    });

    // =========================================================================
    // SECTION 46: BACKEND TESTS — NOTIFICATIONS
    // =========================================================================
    console.log('\n--- Running Section 46: Notification Tests ---');

    await runTest(21, 'Notification generated from real booking event (Booking Created)', async () => {
      // Create a fresh booking to trigger BOOKING_REQUEST_RECEIVED event
      const freshBooking = await prisma.booking.create({
        data: {
          referenceCode: `BK-${testId}-EVT`,
          serviceRequestId: (
            await prisma.serviceRequest.create({
              data: {
                customerId: customer1User.id,
                serviceId: service.id,
                selectedProviderId: provider1Profile.id,
                description: 'Event test booking',
                requestedDate: new Date('2026-10-08T00:00:00.000Z'),
                requestedStartTime: '11:00',
                addressId: cust1Address.id,
                addressSnapshot: { flatNumber: 'Flat 101', streetArea: 'Sector 62', city: 'Noida', postalCode: '201301' },
                status: 'PENDING_PROVIDER',
              },
            })
          ).id,
          customerId: customer1User.id,
          providerProfileId: provider1Profile.id,
          serviceId: service.id,
          scheduledDate: new Date('2026-10-08T00:00:00.000Z'),
          scheduledStartTime: '11:00',
          scheduledEndTime: '12:00',
          status: 'PENDING_PROVIDER',
          serviceTitleSnapshot: service.title,
          pricingModelSnapshot: 'FIXED',
          priceSnapshot: 500,
          locationSnapshot: { flatNumber: 'Flat 101', streetArea: 'Sector 62', city: 'Noida', postalCode: '201301' },
          customerSnapshot: { fullName: customer1User.fullName, email: customer1User.email },
          providerSnapshot: { businessName: provider1Profile.businessName },
        },
      });

      // Provider accepts the booking via API -> triggers BOOKING_ACCEPTED event for customer
      const acceptRes = await apiCall(`/api/provider/bookings/${freshBooking.id}/accept`, {
        method: 'POST',
        cookie: prov1Auth.cookie,
        body: { notes: 'Accepted on schedule' },
      });

      assert(acceptRes.status === 200, `Expected 200 for accept, got ${acceptRes.status}`);

      // Customer should now have a notification of type BOOKING_ACCEPTED
      const notif = await prisma.notification.findFirst({
        where: {
          userId: customer1User.id,
          type: 'BOOKING_ACCEPTED',
          relatedEntityId: freshBooking.id,
        },
      });

      assert(!!notif, 'BOOKING_ACCEPTED notification must exist in DB for customer');
    });

    await runTest(22, 'Correct recipient receives notification', async () => {
      // Check that provider did not receive the BOOKING_ACCEPTED notification intended for customer
      const providerNotif = await prisma.notification.findFirst({
        where: {
          userId: provider1User.id,
          type: 'BOOKING_ACCEPTED',
        },
      });

      assert(!providerNotif, 'Provider should not receive customer notification');
    });

    await runTest(23, 'Notification persisted in PostgreSQL with correct fields', async () => {
      const notif = await prisma.notification.findFirst({
        where: { userId: customer1User.id },
        orderBy: { createdAt: 'desc' },
      });

      assert(!!notif, 'Notification should exist');
      assert(typeof notif?.title === 'string', 'Title must be string');
      assert(typeof notif?.message === 'string', 'Message must be string');
      assert(notif?.isRead === false, 'isRead should default to false');
    });

    let notifToReadId: string = '';

    await runTest(24, 'User can read own notifications via API', async () => {
      const res = await apiCall('/api/notifications', {
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.notifications.length > 0, 'Notifications list not empty');
      notifToReadId = res.body.data.notifications[0].id;
    });

    await runTest(25, 'User cannot read another users notification', async () => {
      const res = await apiCall(`/api/notifications/${notifToReadId}/read`, {
        method: 'PATCH',
        cookie: cust2Auth.cookie, // Wrong user
      });

      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await runTest(26, 'Mark single notification as read', async () => {
      const res = await apiCall(`/api/notifications/${notifToReadId}/read`, {
        method: 'PATCH',
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.isRead === true, 'isRead should be true');
      assert(!!res.body.data.readAt, 'readAt timestamp must be set');
    });

    await runTest(27, 'Mark all notifications as read', async () => {
      const res = await apiCall('/api/notifications/read-all', {
        method: 'POST',
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(typeof res.body.data.updatedCount === 'number', 'updatedCount returned');
    });

    await runTest(28, 'Unread count is accurate', async () => {
      const res = await apiCall('/api/notifications', {
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.unreadCount === 0, `Expected unreadCount 0 after mark-all, got ${res.body.data.unreadCount}`);
    });

    await runTest(29, 'Notification pagination works', async () => {
      const res = await apiCall('/api/notifications?limit=1&page=1', {
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.notifications.length <= 1, 'Limit respected');
      assert(res.body.data.pagination.page === 1, 'Page 1');
    });

    await runTest(30, 'Notification preference enforcement skips disabled categories', async () => {
      // Customer 2 updates preference to disable chatMessages
      const prefRes = await apiCall('/api/notifications/preferences', {
        method: 'PATCH',
        cookie: cust2Auth.cookie,
        body: { chatMessages: false },
      });
      assert(prefRes.status === 200, 'Preference updated');
      assert(prefRes.body.data.chatMessages === false, 'chatMessages disabled');

      // Create dummy notification of type NEW_MESSAGE for Customer 2 directly through NotificationService
      const { NotificationService } = await import('../services/notification.service.js');
      const skippedNotif = await NotificationService.createNotification(
        customer2User.id,
        'NEW_MESSAGE',
        'Should be skipped',
        'Test message'
      );

      assert(skippedNotif === null, 'createNotification should return null when user preference disabled');
    });

    // =========================================================================
    // SECTION 47: BACKEND TESTS — REBOOKING
    // =========================================================================
    console.log('\n--- Running Section 47: Rebooking Tests ---');

    await runTest(31, 'Completed booking can check rebook eligibility', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/rebook-eligibility`, {
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert(res.body.data.eligible === true, 'Must be eligible');
      assert(res.body.data.serviceId === service.id, 'Service ID matches');
      assert(res.body.data.providerId === provider1Profile.id, 'Provider ID matches');
      assert(res.body.data.providerAvailable === true, 'Provider should be available');
    });

    await runTest(32, 'Non-completed booking rebooking eligibility is false', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingPending.id}/rebook-eligibility`, {
        cookie: cust1Auth.cookie,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.eligible === false, 'Should not be eligible');
      assert(res.body.data.reason.includes('completed bookings'), 'Reason explains completion requirement');
    });

    await runTest(33, 'Wrong customer cannot rebook booking', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/rebook`, {
        method: 'POST',
        cookie: cust2Auth.cookie, // Wrong customer
        body: {
          requestedDate: '2026-10-12',
          requestedStartTime: '10:00',
        },
      });

      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    let newRebookedBookingId: string = '';

    await runTest(34, 'Customer rebooks completed booking with new schedule and address', async () => {
      const res = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/rebook`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: {
          requestedDate: '2026-10-12',
          requestedStartTime: '10:00',
          requestedDurationHours: 1.0,
          description: 'Rebooked AC service for next maintenance cycle',
          addressId: cust1Address.id,
        },
      });

      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert(res.body.data.id !== bookingCompleted.id, 'New booking ID must differ from source booking ID');
      assert(res.body.data.status === 'PENDING_PROVIDER', 'New booking starts at PENDING_PROVIDER');
      newRebookedBookingId = res.body.data.id;
    });

    await runTest(35, 'Historical booking remains completely unchanged', async () => {
      const historical = await prisma.booking.findUnique({
        where: { id: bookingCompleted.id },
      });

      assert(historical?.status === 'COMPLETED', 'Historical status must remain COMPLETED');
      assert(historical?.id === bookingCompleted.id, 'Historical ID untouched');
    });

    await runTest(36, 'Provider eligibility is revalidated during rebooking', async () => {
      // Temporarily set provider1 to vacationMode
      await prisma.serviceProviderProfile.update({
        where: { id: provider1Profile.id },
        data: { vacationMode: true },
      });

      const res = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/rebook`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: {
          requestedDate: '2026-10-19',
          requestedStartTime: '10:00',
          addressId: cust1Address.id,
        },
      });

      assert(res.status === 400, `Expected 400 when provider is on vacation, got ${res.status}`);

      // Restore vacationMode
      await prisma.serviceProviderProfile.update({
        where: { id: provider1Profile.id },
        data: { vacationMode: false },
      });
    });

    await runTest(37, 'Current service availability rechecked before rebooking', async () => {
      // Sunday is not in provider availability
      const res = await apiCall(`/api/customer/bookings/${bookingCompleted.id}/rebook`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: {
          requestedDate: '2026-10-11', // Sunday
          requestedStartTime: '10:00',
          addressId: cust1Address.id,
        },
      });

      assert(res.status === 400, `Expected 400 for unavailable day, got ${res.status}`);
    });

    await runTest(38, 'rebookedFromBookingId reference stored correctly', async () => {
      const newBooking = await prisma.booking.findUnique({
        where: { id: newRebookedBookingId },
        include: { serviceRequest: true },
      });

      assert(
        newBooking?.serviceRequest.rebookedFromBookingId === bookingCompleted.id,
        `Expected rebookedFromBookingId ${bookingCompleted.id}, got ${newBooking?.serviceRequest.rebookedFromBookingId}`
      );
    });

    // =========================================================================
    // SECTION 48: BACKEND TESTS — SECURITY & REPORT/BLOCK
    // =========================================================================
    console.log('\n--- Running Section 48: Security & Report/Block Tests ---');

    await runTest(39, 'Cross-user notification access denied', async () => {
      const res = await apiCall('/api/notifications', {
        cookie: cust2Auth.cookie,
      });

      // Customer 2's notification list should not contain Customer 1's notifications
      const hasCust1Notif = res.body.data.notifications.some(
        (n: NotificationRecord) => n.userId === customer1User.id
      );
      assert(!hasCust1Notif, 'Cross-user notifications must never be leaked');
    });

    await runTest(40, 'Cross-user conversation access denied', async () => {
      const res = await apiCall(`/api/conversations/${conversationId}/messages`, {
        cookie: cust2Auth.cookie,
      });

      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await runTest(41, 'Cross-user message creation denied', async () => {
      const res = await apiCall(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        cookie: cust2Auth.cookie,
        body: { content: 'Unauthorized intrusion' },
      });

      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await runTest(42, 'Review spoofing denied (arbitrary booking ID)', async () => {
      const res = await apiCall('/api/customer/bookings/non-existent-booking-id/review', {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: { overallRating: 5 },
      });

      assert(res.status === 404, `Expected 404 for non-existent booking review, got ${res.status}`);
    });

    await runTest(43, 'Rebook spoofing denied (arbitrary booking ID)', async () => {
      const res = await apiCall('/api/customer/bookings/non-existent-booking-id/rebook', {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: { requestedDate: '2026-10-12', requestedStartTime: '10:00' },
      });

      assert(res.status === 400 || res.status === 404, `Expected 400/404, got ${res.status}`);
    });

    await runTest(44, 'Report creation and user blocking foundation works', async () => {
      // 1. Customer 1 reports Provider 2 for harassment / inappropriate profile
      const reportRes = await apiCall('/api/reports', {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: {
          reportedUserId: provider2User.id,
          reason: 'Inappropriate communication attempt',
          details: 'User sent unwarranted private messages',
        },
      });

      assert(reportRes.status === 201, `Expected 201, got ${reportRes.status}`);
      assert(reportRes.body.data.reporterUserId === customer1User.id, 'Reporter ID matches');

      // 2. Customer 1 blocks Provider 2
      const blockRes = await apiCall('/api/blocks', {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: {
          blockedUserId: provider2User.id,
          reason: 'Harassment',
        },
      });

      assert(blockRes.status === 201, `Expected 201, got ${blockRes.status}`);
      assert(blockRes.body.data.blockedUserId === provider2User.id, 'Blocked user ID matches');

      // 3. Customer 1 lists blocked users
      const listRes = await apiCall('/api/blocks', {
        cookie: cust1Auth.cookie,
      });

      assert(listRes.status === 200, `Expected 200, got ${listRes.status}`);
      const blocked = listRes.body.data.find((b: any) => b.blockedUserId === provider2User.id);
      assert(!!blocked, 'Blocked user should be in block list');

      // 4. Customer 1 unblocks Provider 2
      const delRes = await apiCall(`/api/blocks/${provider2User.id}`, {
        method: 'DELETE',
        cookie: cust1Auth.cookie,
      });

      assert(delRes.status === 200, `Expected 200, got ${delRes.status}`);
    });

    // =========================================================================
    // SECTION 49: REALTIME SOCKET.IO TESTING
    // =========================================================================
    console.log('\n--- Running Section 49: Realtime Socket.IO Tests ---');

    let customerSocket: ClientSocket | null = null;
    let providerSocket: ClientSocket | null = null;

    await runTest(45, 'Authenticated Socket.IO connection succeeds with auth token', async () => {
      customerSocket = ClientSocketIo(baseUrl, {
        auth: { token: cust1Auth.token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
        customerSocket?.on('connect', () => {
          clearTimeout(timer);
          resolve();
        });
        customerSocket?.on('connect_error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      assert(customerSocket.connected === true, 'Customer socket should be connected');
    });

    await runTest(46, 'Unauthenticated Socket.IO connection is rejected', async () => {
      const unauthSocket = ClientSocketIo(baseUrl, {
        auth: { token: 'invalid_forged_token' },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        unauthSocket.on('connect_error', (err) => {
          assert(err.message.includes('INVALID_TOKEN') || err.message.includes('AUTHENTICATION'), 'Rejected with auth error');
          unauthSocket.disconnect();
          resolve();
        });
      });
    });

    await runTest(47, 'Room authorization enforces participant boundary', async () => {
      // Connect Customer 2 (unrelated user) via Socket
      const cust2Socket = ClientSocketIo(baseUrl, {
        auth: { token: cust2Auth.token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        cust2Socket.on('connect', () => resolve());
      });

      // Customer 2 tries to join Customer 1's conversation room
      const joinResult = await new Promise<{ success: boolean; error?: string }>((resolve) => {
        cust2Socket.emit('join_conversation', { conversationId }, (res: { success: boolean; error?: string }) => {
          resolve(res);
        });
      });

      assert(joinResult.success === false, 'Unauthorized room join must be rejected');
      assert(Boolean(joinResult.error?.includes('Unauthorized')), 'Error must specify Unauthorized');

      cust2Socket.disconnect();
    });

    await runTest(48, 'Realtime message delivery verified via socket event', async () => {
      // Connect Provider 1 via Socket
      providerSocket = ClientSocketIo(baseUrl, {
        auth: { token: prov1Auth.token },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        providerSocket?.on('connect', () => resolve());
      });

      // Customer 1 joins conversation room
      await new Promise<void>((resolve) => {
        customerSocket?.emit('join_conversation', { conversationId }, () => resolve());
      });

      // Provider 1 joins conversation room
      await new Promise<void>((resolve) => {
        providerSocket?.emit('join_conversation', { conversationId }, () => resolve());
      });

      // Provider listens for conversation:message
      const receivedPromise = new Promise<MessageRecord>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Realtime message delivery timed out')), 5000);
        providerSocket?.on('conversation:message', (msg: MessageRecord) => {
          clearTimeout(timer);
          resolve(msg);
        });
      });

      // Customer sends message via REST API
      const sentRes = await apiCall(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        cookie: cust1Auth.cookie,
        body: { content: 'Realtime socket test message!' },
      });
      assert(sentRes.status === 201, 'Message created via API');

      // Provider socket receives the broadcast
      const receivedMessage = await receivedPromise;
      assert(
        receivedMessage.content === 'Realtime socket test message!',
        `Received message content mismatch: ${receivedMessage.content}`
      );
      assert(receivedMessage.conversationId === conversationId, 'Conversation ID matches');

      customerSocket?.disconnect();
      providerSocket?.disconnect();
    });

  } finally {
    // Teardown
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  // ----------------------------------------------------
  // TEST SUMMARY REPORT
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log('=== SEVASETU PHASE 6 TEST SUITE RESULTS ===');
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
    console.log('\nALL 48 PHASE 6 TESTS PASSED PROVABLY IN POSTGRESQL & SOCKET.IO!');
  }
}

runPhase6Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
