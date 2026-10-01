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

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  console.log('=== STARTING SEVASETU FUNCTIONAL PHASE 4 TEST SUITE ===');

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

  // Helper for requests
  interface TestApiResponse {
    success?: boolean;
    data?: {
      id?: string;
      referenceCode?: string;
      status?: string;
      scheduledStartTime?: string;
      scheduledEndTime?: string;
      bookings?: Array<{ id: string; status: string; referenceCode: string }>;
      [key: string]: unknown;
    };
    error?: {
      code?: string;
      message?: string;
      details?: unknown;
    };
  }

  const apiCall = async (
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      cookie?: string;
    } = {}
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.cookie) {
      headers['Cookie'] = options.cookie;
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const setCookie = res.headers.get('set-cookie');
    let json: TestApiResponse | null = null;
    try {
      json = (await res.json()) as TestApiResponse;
    } catch {
      // not json
    }

    return {
      status: res.status,
      data: json,
      cookie: setCookie ? setCookie.split(';')[0] : options.cookie,
    };
  };

  // Find seeded catalog service
  const service = await prisma.service.findFirst({
    where: { isActive: true },
    include: { category: true },
  });
  if (!service) {
    throw new Error('No active service found in database. Seed catalog before running tests.');
  }

  // Create Test Users
  // Customer 1
  const customer1User = await prisma.user.create({
    data: {
      email: `cust1_${testId}@test.com`,
      fullName: 'Customer One',
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  // Customer 1 Address (inside Noida 201301)
  const customer1Address = await prisma.address.create({
    data: {
      userId: customer1User.id,
      flatNumber: 'Flat 101, Tower A',
      streetArea: 'Sector 62, Central Enclave',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postalCode: '201301',
      landmark: 'Near IT Park',
      isDefault: true,
    },
  });

  // Customer 2 (for concurrency & ownership testing)
  const customer2User = await prisma.user.create({
    data: {
      email: `cust2_${testId}@test.com`,
      fullName: 'Customer Two',
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });
  const customer2Address = await prisma.address.create({
    data: {
      userId: customer2User.id,
      flatNumber: 'Flat 202, Tower B',
      streetArea: 'Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postalCode: '201301',
      isDefault: true,
    },
  });

  // Provider 1 (Fully onboarded, offers service, covers Noida 201301, works Monday-Saturday 09:00-18:00)
  const provider1User = await prisma.user.create({
    data: {
      email: `prov1_${testId}@test.com`,
      fullName: 'Master Technician One',
      phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'PROVIDER',
      status: 'ACTIVE',
    },
  });
  const provider1Profile = await prisma.serviceProviderProfile.create({
    data: {
      userId: provider1User.id,
      businessName: 'Apex Engineering Solutions',
      bio: 'Certified specialist with 8 years field experience.',
      experienceYears: 8,
      isPubliclyListed: true,
      onboardingStatus: 'COMPLETED',
      vacationMode: false,
    },
  });
  await prisma.providerService.create({
    data: {
      providerProfileId: provider1Profile.id,
      serviceId: service.id,
      customTitle: 'Expert Diagnostic & Repairs',
      customPrice: 750,
      pricingModel: 'FIXED',
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
  // Working days Mon-Sat 09:00 - 18:00
  const days: Array<'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'> = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  for (const day of days) {
    await prisma.providerAvailability.create({
      data: {
        providerProfileId: provider1Profile.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        isAvailable: true,
      },
    });
  }

  // Provider 2 (Second provider for ownership isolation tests)
  const provider2User = await prisma.user.create({
    data: {
      email: `prov2_${testId}@test.com`,
      fullName: 'Technician Two',
      phone: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'PROVIDER',
      status: 'ACTIVE',
    },
  });
  const provider2Profile = await prisma.serviceProviderProfile.create({
    data: {
      userId: provider2User.id,
      businessName: 'Quick Repairs Co',
      isPubliclyListed: true,
      onboardingStatus: 'COMPLETED',
    },
  });

  // Login cookies
  const cust1Login = await apiCall('/api/auth/login', {
    method: 'POST',
    body: { email: customer1User.email, password: testPassword },
  });
  const cust1Cookie = cust1Login.cookie;

  const cust2Login = await apiCall('/api/auth/login', {
    method: 'POST',
    body: { email: customer2User.email, password: testPassword },
  });
  const cust2Cookie = cust2Login.cookie;

  const prov1Login = await apiCall('/api/auth/login', {
    method: 'POST',
    body: { email: provider1User.email, password: testPassword },
  });
  const prov1Cookie = prov1Login.cookie;

  const prov2Login = await apiCall('/api/auth/login', {
    method: 'POST',
    body: { email: provider2User.email, password: testPassword },
  });
  const prov2Cookie = prov2Login.cookie;

  // Choose a test date that falls on a Monday: e.g. 2026-10-05 (Monday)
  const testBookingDate = '2026-10-05';
  let createdBookingId = '';
  let secondBookingId = '';

  // ----------------------------------------------------
  // SECTION: SERVICE REQUEST
  // ----------------------------------------------------

  await runTest(1, 'SERVICE REQUEST: Create request endpoint exists and requires authentication', async () => {
    const unauth = await apiCall('/api/service-requests', {
      method: 'POST',
      body: { serviceId: service.id },
    });
    assert(unauth.status === 401, `Expected 401 Unauthorized, got ${unauth.status}`);
  });

  await runTest(2, 'SERVICE REQUEST: Invalid service returns 400 validation error', async () => {
    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: '00000000-0000-0000-0000-000000000000',
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Need service repair immediately',
        requestedDate: testBookingDate,
        requestedStartTime: '10:00',
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.data?.error?.code === 'VALIDATION_ERROR', 'Expected VALIDATION_ERROR');
  });

  await runTest(3, 'SERVICE REQUEST: Invalid provider returns 400 validation error', async () => {
    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: '00000000-0000-0000-0000-000000000000',
        addressId: customer1Address.id,
        description: 'Need service repair immediately',
        requestedDate: testBookingDate,
        requestedStartTime: '10:00',
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await runTest(4, 'SERVICE REQUEST: Provider does not offer service returns 400', async () => {
    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider2Profile.id, // Provider 2 doesn't offer this service
        addressId: customer1Address.id,
        description: 'Need service repair immediately',
        requestedDate: testBookingDate,
        requestedStartTime: '10:00',
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(Boolean(res.data?.error?.message?.includes('does not offer')), 'Expected does not offer error message');
  });

  await runTest(5, 'SERVICE REQUEST: Invalid customer address (not owned by customer) rejected with 403', async () => {
    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer2Address.id, // Owned by customer 2, not customer 1
        description: 'Need service repair immediately',
        requestedDate: testBookingDate,
        requestedStartTime: '10:00',
      },
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest(6, 'SERVICE REQUEST: Provider outside service area rejected with 400', async () => {
    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        address: {
          flatNumber: 'House 5',
          streetArea: 'Civil Lines',
          city: 'Kanpur', // Provider only services Noida 201301
          postalCode: '208001',
        },
        description: 'Need service in Kanpur',
        requestedDate: testBookingDate,
        requestedStartTime: '10:00',
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(Boolean(res.data?.error?.message?.includes('does not service your location')), 'Expected location error');
  });

  await runTest(7, 'SERVICE REQUEST: Provider unavailable (outside working hours) returns 400', async () => {
    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Need service repair late at night',
        requestedDate: testBookingDate,
        requestedStartTime: '21:00', // Provider works 09:00 - 18:00
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await runTest(8, 'SERVICE REQUEST: Valid request creation succeeds and returns 201', async () => {
    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Customer One regular service request',
        requestedDate: testBookingDate,
        requestedStartTime: '10:00',
        requestedDurationHours: 2.0,
      },
    });
    assert(res.status === 201, `Expected 201 Created, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data?.success === true, 'Expected success: true');
    assert(Boolean(res.data?.data?.id), 'Expected booking id');
    assert(res.data?.data?.status === 'PENDING_PROVIDER', 'Expected status PENDING_PROVIDER');
    assert(res.data?.data?.scheduledStartTime === '10:00', 'Expected start time 10:00');
    assert(res.data?.data?.scheduledEndTime === '12:00', 'Expected end time 12:00');

    createdBookingId = res.data?.data?.id as string;
  });

  // ----------------------------------------------------
  // SECTION: BOOKING PERSISTENCE & LIFECYCLE
  // ----------------------------------------------------

  await runTest(9, 'BOOKING: Booking creation contains required snapshots', async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: createdBookingId },
    });
    assert(Boolean(booking), 'Booking must exist in database');
    assert(booking?.serviceTitleSnapshot === 'Expert Diagnostic & Repairs', 'Expected snapshot title');
    assert(booking?.priceSnapshot === 750, 'Expected snapshot price 750');
    assert(Boolean(booking?.locationSnapshot), 'Expected location snapshot');
    assert(Boolean(booking?.customerSnapshot), 'Expected customer snapshot');
    assert(Boolean(booking?.providerSnapshot), 'Expected provider snapshot');
  });

  await runTest(10, 'BOOKING: Booking persisted in PostgreSQL with valid reference code', async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: createdBookingId },
    });
    assert(Boolean(booking?.referenceCode?.startsWith('BK-')), 'Reference code should start with BK-');
    assert(booking?.durationHours === 2.0, 'Duration hours should be 2.0');
  });

  await runTest(11, 'BOOKING: Initial status history created with actor CUSTOMER', async () => {
    const history = await prisma.bookingStatusHistory.findMany({
      where: { bookingId: createdBookingId },
    });
    assert(history.length === 1, `Expected 1 history record, got ${history.length}`);
    assert(history[0]?.newStatus === 'PENDING_PROVIDER', 'Expected newStatus PENDING_PROVIDER');
    assert(history[0]?.actorType === 'CUSTOMER', 'Expected actorType CUSTOMER');
    assert(history[0]?.actorUserId === customer1User.id, 'Expected actorUserId match');
  });

  await runTest(12, 'BOOKING: Provider request visible in incoming requests API', async () => {
    const res = await apiCall('/api/provider/bookings/requests', {
      cookie: prov1Cookie,
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const items = res.data?.data?.bookings || [];
    const found = items.some((b) => b.id === createdBookingId);
    assert(found, 'Created booking must be present in provider incoming requests');
  });

  await runTest(13, 'BOOKING: Provider accepts valid request transactionally', async () => {
    const res = await apiCall(`/api/provider/bookings/${createdBookingId}/accept`, {
      method: 'POST',
      cookie: prov1Cookie,
      body: { notes: 'Accepting job. Tools prepared.' },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data?.data?.status === 'SCHEDULED', `Expected SCHEDULED, got ${res.data?.data?.status}`);

    // Verify DB
    const booking = await prisma.booking.findUnique({ where: { id: createdBookingId } });
    assert(booking?.status === 'SCHEDULED', 'Booking in DB must be SCHEDULED');

    // Verify history records
    const history = await prisma.bookingStatusHistory.findMany({
      where: { bookingId: createdBookingId },
      orderBy: { createdAt: 'asc' },
    });
    assert(history.length === 3, `Expected 3 history items, got ${history.length}`);
    assert(history[1]?.newStatus === 'ACCEPTED', 'Expected ACCEPTED step');
    assert(history[2]?.newStatus === 'SCHEDULED', 'Expected SCHEDULED step');
  });

  await runTest(14, 'BOOKING: Provider declines valid request with reason', async () => {
    // Create second booking to test decline
    const req = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Second request for decline test',
        requestedDate: testBookingDate,
        requestedStartTime: '15:00',
        requestedDurationHours: 1.0,
      },
    });
    assert(req.status === 201, 'Second booking created');
    secondBookingId = req.data?.data?.id as string;

    const res = await apiCall(`/api/provider/bookings/${secondBookingId}/decline`, {
      method: 'POST',
      cookie: prov1Cookie,
      body: { reason: 'Fully booked workshop maintenance.' },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data?.data?.status === 'DECLINED', 'Expected status DECLINED');

    const dbBooking = await prisma.booking.findUnique({ where: { id: secondBookingId } });
    assert(dbBooking?.status === 'DECLINED', 'DB status must be DECLINED');
    assert(dbBooking?.cancellationReason === 'Fully booked workshop maintenance.', 'Reason must be recorded');
  });

  await runTest(15, 'BOOKING: Invalid status transition rejected with 409', async () => {
    // Attempting to complete a DECLINED booking is strictly prohibited
    const res = await apiCall(`/api/provider/bookings/${secondBookingId}/status`, {
      method: 'POST',
      cookie: prov1Cookie,
      body: { status: 'COMPLETED' },
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(res.data?.error?.code === 'INVALID_STATUS_TRANSITION', 'Expected INVALID_STATUS_TRANSITION');
  });

  // ----------------------------------------------------
  // SECTION: OWNERSHIP & PRIVACY
  // ----------------------------------------------------

  await runTest(16, 'OWNERSHIP: Customer cannot read another customer booking (403)', async () => {
    const res = await apiCall(`/api/customer/bookings/${createdBookingId}`, {
      cookie: cust2Cookie, // Customer 2 trying to read Customer 1's booking
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest(17, 'OWNERSHIP: Provider cannot read another provider booking (403)', async () => {
    const res = await apiCall(`/api/provider/bookings/${createdBookingId}`, {
      cookie: prov2Cookie, // Provider 2 trying to read Provider 1's booking
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest(18, 'OWNERSHIP: Customer cannot call provider mutation endpoints (403)', async () => {
    const res = await apiCall(`/api/provider/bookings/${createdBookingId}/accept`, {
      method: 'POST',
      cookie: cust1Cookie, // Customer calling provider accept
      body: { notes: 'Hack' },
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest(19, 'OWNERSHIP: Provider cannot modify unrelated booking (403)', async () => {
    const res = await apiCall(`/api/provider/bookings/${createdBookingId}/status`, {
      method: 'POST',
      cookie: prov2Cookie, // Provider 2 calling status on Provider 1's job
      body: { status: 'ON_THE_WAY' },
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // ----------------------------------------------------
  // SECTION: SERVICE EXECUTION STATES & CANCELLATION
  // ----------------------------------------------------

  await runTest(20, 'SERVICE EXECUTION: Provider advances states (ON_THE_WAY -> ARRIVED -> IN_PROGRESS)', async () => {
    // 1. ON_THE_WAY
    let res = await apiCall(`/api/provider/bookings/${createdBookingId}/status`, {
      method: 'POST',
      cookie: prov1Cookie,
      body: { status: 'ON_THE_WAY', notes: 'En route in van' },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data?.data?.status === 'ON_THE_WAY', 'Expected ON_THE_WAY');

    // 2. ARRIVED
    res = await apiCall(`/api/provider/bookings/${createdBookingId}/status`, {
      method: 'POST',
      cookie: prov1Cookie,
      body: { status: 'ARRIVED', notes: 'At client doorstep' },
    });
    assert(res.status === 200, 'Expected 200 for ARRIVED');
    assert(res.data?.data?.status === 'ARRIVED', 'Expected ARRIVED');

    // 3. IN_PROGRESS
    res = await apiCall(`/api/provider/bookings/${createdBookingId}/status`, {
      method: 'POST',
      cookie: prov1Cookie,
      body: { status: 'IN_PROGRESS', notes: 'Starting inspection' },
    });
    assert(res.status === 200, 'Expected 200 for IN_PROGRESS');
    assert(res.data?.data?.status === 'IN_PROGRESS', 'Expected IN_PROGRESS');
  });

  await runTest(21, 'SERVICE EXECUTION: Provider completes job (IN_PROGRESS -> COMPLETED)', async () => {
    const res = await apiCall(`/api/provider/bookings/${createdBookingId}/status`, {
      method: 'POST',
      cookie: prov1Cookie,
      body: { status: 'COMPLETED', notes: 'Repairs finished and tested.' },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data?.data?.status === 'COMPLETED', 'Expected COMPLETED');
  });

  await runTest(22, 'CANCELLATION: Completed booking cannot be cancelled (409)', async () => {
    const res = await apiCall(`/api/customer/bookings/${createdBookingId}/cancel`, {
      method: 'POST',
      cookie: cust1Cookie,
      body: { reason: 'No longer needed' },
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(res.data?.error?.code === 'INVALID_STATUS_TRANSITION', 'Expected INVALID_STATUS_TRANSITION');
  });

  await runTest(23, 'CANCELLATION: Customer cancels eligible booking with reason', async () => {
    // Create new booking to cancel
    const newReq = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Booking to be cancelled by customer',
        requestedDate: testBookingDate,
        requestedStartTime: '16:00',
        requestedDurationHours: 1.0,
      },
    });
    assert(newReq.status === 201, 'Booking created');
    const toCancelId = newReq.data?.data?.id;

    const cancelRes = await apiCall(`/api/customer/bookings/${toCancelId}/cancel`, {
      method: 'POST',
      cookie: cust1Cookie,
      body: { reason: 'Schedule changed unexpectedly.' },
    });
    assert(cancelRes.status === 200, `Expected 200, got ${cancelRes.status}`);
    assert(cancelRes.data?.data?.status === 'CANCELLED', 'Expected CANCELLED');

    const dbBooking = await prisma.booking.findUnique({ where: { id: toCancelId } });
    assert(dbBooking?.status === 'CANCELLED', 'DB status must be CANCELLED');
    assert(dbBooking?.cancelledBy === 'CUSTOMER', 'Cancelled by must be CUSTOMER');
  });

  // ----------------------------------------------------
  // SECTION: RESCHEDULING
  // ----------------------------------------------------

  let rescheduleBookingId = '';

  await runTest(24, 'RESCHEDULING: Valid reschedule updates date/time and preserves snapshots', async () => {
    // Create new scheduled booking
    const newReq = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Booking for reschedule testing',
        requestedDate: '2026-10-06', // Tuesday
        requestedStartTime: '10:00',
        requestedDurationHours: 1.0,
      },
    });
    assert(newReq.status === 201, 'Booking for reschedule created');
    rescheduleBookingId = newReq.data?.data?.id as string;

    // Accept it so it is SCHEDULED
    await apiCall(`/api/provider/bookings/${rescheduleBookingId}/accept`, {
      method: 'POST',
      cookie: prov1Cookie,
    });

    // Customer reschedules to Tuesday 14:00
    const res = await apiCall(`/api/customer/bookings/${rescheduleBookingId}/reschedule`, {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        newDate: '2026-10-06',
        newStartTime: '14:00',
      },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data?.data?.scheduledStartTime === '14:00', 'New start time must be 14:00');
    assert(res.data?.data?.scheduledEndTime === '15:00', 'New end time must be 15:00');
  });

  await runTest(25, 'RESCHEDULING: Unavailable reschedule rejected (outside working hours)', async () => {
    const res = await apiCall(`/api/customer/bookings/${rescheduleBookingId}/reschedule`, {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        newDate: '2026-10-06',
        newStartTime: '22:00', // Provider closed at 22:00
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await runTest(26, 'RESCHEDULING: Conflicting reschedule rejected with 409', async () => {
    // Create an interfering booking at 11:00 on 2026-10-06
    const interfering = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust2Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer2Address.id,
        description: 'Interfering slot',
        requestedDate: '2026-10-06',
        requestedStartTime: '11:00',
        requestedDurationHours: 1.0,
      },
    });
    assert(interfering.status === 201, 'Interfering booking created');

    // Attempt to reschedule rescheduleBookingId into 11:00 slot
    const res = await apiCall(`/api/customer/bookings/${rescheduleBookingId}/reschedule`, {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        newDate: '2026-10-06',
        newStartTime: '11:00',
      },
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(res.data?.error?.code === 'SCHEDULE_CONFLICT', 'Expected SCHEDULE_CONFLICT');
  });

  await runTest(27, 'RESCHEDULING: Reschedule history recorded in database', async () => {
    const history = await prisma.bookingStatusHistory.findMany({
      where: {
        bookingId: rescheduleBookingId,
        reason: { contains: 'Rescheduled' },
      },
    });
    assert(history.length >= 1, 'Expected at least 1 reschedule history record');
    assert(Boolean((history[0]?.metadata as Record<string, unknown> | null)?.newStartTime), 'Metadata must contain newStartTime');
  });

  // ----------------------------------------------------
  // SECTION: AVAILABILITY INTEGRATION
  // ----------------------------------------------------

  await runTest(28, 'AVAILABILITY: Provider vacation mode prevents booking request (400)', async () => {
    // Set provider 1 into vacation mode
    await prisma.serviceProviderProfile.update({
      where: { id: provider1Profile.id },
      data: { vacationMode: true },
    });

    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Booking during vacation',
        requestedDate: '2026-10-07',
        requestedStartTime: '10:00',
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(Boolean(res.data?.error?.message?.includes('vacation')), 'Expected vacation mode error message');

    // Restore vacation mode to false
    await prisma.serviceProviderProfile.update({
      where: { id: provider1Profile.id },
      data: { vacationMode: false },
    });
  });

  await runTest(29, 'AVAILABILITY: Provider date override (off day) honored and prevents booking', async () => {
    const overrideDate = '2026-10-08';
    await prisma.providerAvailabilityOverride.create({
      data: {
        providerProfileId: provider1Profile.id,
        date: new Date(`${overrideDate}T00:00:00.000Z`),
        isAvailable: false,
        reason: 'Holiday off for festival',
      },
    });

    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Booking on festival holiday',
        requestedDate: overrideDate,
        requestedStartTime: '10:00',
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(Boolean(res.data?.error?.message?.includes('Holiday off for festival')), 'Expected override reason in error');
  });

  await runTest(30, 'AVAILABILITY: Weekly schedule non-working day (Sunday) honored', async () => {
    // 2026-10-11 is Sunday, provider only configured Mon-Sat
    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Booking on Sunday',
        requestedDate: '2026-10-11',
        requestedStartTime: '10:00',
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(Boolean(res.data?.error?.message?.includes('sunday')), 'Expected sunday off message');
  });

  await runTest(31, 'AVAILABILITY: Rest break collision (13:00 - 14:00) rejected', async () => {
    const res = await apiCall('/api/service-requests', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        serviceId: service.id,
        providerProfileId: provider1Profile.id,
        addressId: customer1Address.id,
        description: 'Booking during lunch break',
        requestedDate: '2026-10-07',
        requestedStartTime: '13:15',
        requestedDurationHours: 1.0,
      },
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(Boolean(res.data?.error?.message?.includes('rest break')), 'Expected rest break conflict');
  });

  // ----------------------------------------------------
  // SECTION: CONCURRENCY TESTING (PostgreSQL Transactional)
  // ----------------------------------------------------

  await runTest(32, 'CONCURRENCY: Two distinct customers concurrently book same slot -> at most one succeeds', async () => {
    const concurrentDate = '2026-10-09';
    const concurrentTime = '10:00';

    // Simultaneously fire two requests for the exact same slot
    const [req1, req2] = await Promise.all([
      apiCall('/api/service-requests', {
        method: 'POST',
        cookie: cust1Cookie,
        body: {
          serviceId: service.id,
          providerProfileId: provider1Profile.id,
          addressId: customer1Address.id,
          description: 'Customer 1 race request',
          requestedDate: concurrentDate,
          requestedStartTime: concurrentTime,
          requestedDurationHours: 2.0,
        },
      }),
      apiCall('/api/service-requests', {
        method: 'POST',
        cookie: cust2Cookie,
        body: {
          serviceId: service.id,
          providerProfileId: provider1Profile.id,
          addressId: customer2Address.id,
          description: 'Customer 2 race request',
          requestedDate: concurrentDate,
          requestedStartTime: concurrentTime,
          requestedDurationHours: 2.0,
        },
      }),
    ]);

    const statuses = [req1.status, req2.status];
    const successCount = statuses.filter((s) => s === 201).length;
    const conflictCount = statuses.filter((s) => s === 409).length;

    assert(successCount === 1, `Expected exactly 1 booking to succeed with 201, got ${successCount}`);
    assert(conflictCount === 1, `Expected exactly 1 booking to fail with 409 conflict, got ${conflictCount}`);
  });

  await runTest(33, 'CONCURRENCY: Database consistency verified after concurrent attempt', async () => {
    const concurrentDate = new Date('2026-10-09T00:00:00.000Z');
    const bookingsInDb = await prisma.booking.findMany({
      where: {
        providerProfileId: provider1Profile.id,
        scheduledDate: concurrentDate,
        scheduledStartTime: '10:00',
        status: { in: ['PENDING_PROVIDER', 'ACCEPTED', 'SCHEDULED'] },
      },
    });

    assert(
      bookingsInDb.length === 1,
      `Expected exactly 1 active booking in DB for 2026-10-09 10:00, found ${bookingsInDb.length}`
    );
  });

  // ----------------------------------------------------
  // SECTION: STATUS HISTORY & AUDITABILITY
  // ----------------------------------------------------

  await runTest(34, 'STATUS HISTORY: Complete chronological lifecycle tracked in DB', async () => {
    const history = await prisma.bookingStatusHistory.findMany({
      where: { bookingId: createdBookingId },
      orderBy: { createdAt: 'asc' },
    });

    // PENDING_PROVIDER -> ACCEPTED -> SCHEDULED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED
    const statuses = history.map((h) => h.newStatus);
    assert(statuses.includes('PENDING_PROVIDER'), 'Must include PENDING_PROVIDER');
    assert(statuses.includes('ACCEPTED'), 'Must include ACCEPTED');
    assert(statuses.includes('SCHEDULED'), 'Must include SCHEDULED');
    assert(statuses.includes('ON_THE_WAY'), 'Must include ON_THE_WAY');
    assert(statuses.includes('ARRIVED'), 'Must include ARRIVED');
    assert(statuses.includes('IN_PROGRESS'), 'Must include IN_PROGRESS');
    assert(statuses.includes('COMPLETED'), 'Must include COMPLETED');
  });

  await runTest(35, 'STATUS HISTORY: Actors verified accurately for customer and provider steps', async () => {
    const history = await prisma.bookingStatusHistory.findMany({
      where: { bookingId: createdBookingId },
      orderBy: { createdAt: 'asc' },
    });

    // Step 0 was customer
    assert(history[0]?.actorType === 'CUSTOMER', 'First step must be CUSTOMER');
    // Step 1 was provider
    assert(history[1]?.actorType === 'PROVIDER', 'Accept step must be PROVIDER');
  });

  await runTest(36, 'STATUS HISTORY: Invalid transition rejects without corrupting history table', async () => {
    const beforeCount = await prisma.bookingStatusHistory.count({
      where: { bookingId: createdBookingId },
    });

    // Attempt invalid transition
    await apiCall(`/api/provider/bookings/${createdBookingId}/status`, {
      method: 'POST',
      cookie: prov1Cookie,
      body: { status: 'ON_THE_WAY' },
    });

    const afterCount = await prisma.bookingStatusHistory.count({
      where: { bookingId: createdBookingId },
    });

    assert(beforeCount === afterCount, 'Failed transition must not create history records');
  });

  // ----------------------------------------------------
  // SECTION: SECURITY & PRIVACY
  // ----------------------------------------------------

  await runTest(37, 'SECURITY: Unauthenticated customer booking list rejected (401)', async () => {
    const res = await apiCall('/api/customer/bookings');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await runTest(38, 'SECURITY: Provider cannot call customer bookings list endpoint (403)', async () => {
    const res = await apiCall('/api/customer/bookings', {
      cookie: prov1Cookie,
    });
    // customerAuth middleware enforces requireRole('CUSTOMER', 'ADMIN')
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest(39, 'SECURITY: Private booking responses omit passwordHash and auth credentials', async () => {
    const res = await apiCall(`/api/customer/bookings/${createdBookingId}`, {
      cookie: cust1Cookie,
    });
    assert(res.status === 200, 'Expected 200');
    const jsonStr = JSON.stringify(res.data);
    assert(!jsonStr.includes('passwordHash'), 'Response must not expose passwordHash');
  });

  // ----------------------------------------------------
  // SECTION: DATABASE INTEGRITY & SNAPSHOT ROBUSTNESS
  // ----------------------------------------------------

  await runTest(40, 'DATABASE: Migration init_phase4_booking registered in _prisma_migrations', async () => {
    interface MigrationRow {
      migration_name: string;
      finished_at: Date | null;
    }
    const migrations = await prisma.$queryRaw<MigrationRow[]>`
      SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name LIKE '%phase4%'
    `;
    assert(migrations.length > 0, 'Phase 4 migration must be present in _prisma_migrations');
    assert(Boolean(migrations[0]?.finished_at), 'Migration must be finished');
  });

  await runTest(41, 'DATABASE: Foreign key relations valid between Request, Booking, and History', async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: createdBookingId },
      include: {
        customer: true,
        providerProfile: true,
        service: true,
        serviceRequest: true,
        statusHistory: true,
      },
    });
    assert(booking?.customer.id === customer1User.id, 'Customer FK intact');
    assert(booking?.providerProfile.id === provider1Profile.id, 'Provider FK intact');
    assert(booking?.service.id === service.id, 'Service FK intact');
    assert(booking?.serviceRequest.id === booking?.serviceRequestId, 'ServiceRequest FK intact');
    assert((booking?.statusHistory.length ?? 0) > 0, 'StatusHistory FK intact');
  });

  await runTest(42, 'DATABASE: Foreign key constraint blocks invalid serviceRequestId on booking', async () => {
    let threw = false;
    try {
      await prisma.booking.create({
        data: {
          referenceCode: `BK-TEST-${Date.now()}`,
          serviceRequestId: '00000000-0000-0000-0000-000000000000',
          customerId: customer1User.id,
          providerProfileId: provider1Profile.id,
          serviceId: service.id,
          scheduledDate: new Date('2026-10-15T00:00:00.000Z'),
          scheduledStartTime: '10:00',
          scheduledEndTime: '11:00',
          serviceTitleSnapshot: 'Test',
          locationSnapshot: {},
          customerSnapshot: {},
          providerSnapshot: {},
        },
      });
    } catch {
      threw = true;
    }
    assert(threw, 'Expected foreign key constraint violation');
  });

  await runTest(43, 'DATABASE: Historical booking snapshot survives provider profile & service title edits', async () => {
    // Modify provider's business name and service title
    await prisma.serviceProviderProfile.update({
      where: { id: provider1Profile.id },
      data: { businessName: 'Completely Renamed Business 2027' },
    });
    await prisma.service.update({
      where: { id: service.id },
      data: { title: 'Completely Renamed Service Title' },
    });

    // Read the historical booking
    const historicalBooking = await prisma.booking.findUnique({
      where: { id: createdBookingId },
    });

    // Verify snapshot was NOT overwritten
    assert(
      historicalBooking?.serviceTitleSnapshot === 'Expert Diagnostic & Repairs',
      `Snapshot must preserve original title, got: ${historicalBooking?.serviceTitleSnapshot}`
    );
    assert(
      (historicalBooking?.providerSnapshot as Record<string, unknown> | null)?.businessName === 'Apex Engineering Solutions',
      'Snapshot must preserve original businessName'
    );
  });

  // Summary
  server.close();

  console.log('\n==================================================');
  console.log('PHASE 4 TEST SUITE EXECUTION SUMMARY');
  console.log('==================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length}`);
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
    console.log('\nALL 43 PHASE 4 TESTS PASSED SUCCESSFULLY! (100% PASS RATE)');
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
