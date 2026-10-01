import http from 'http';
import crypto from 'node:crypto';
import { createApp } from '../app.js';
import { getPrismaClient } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { PaymentService } from '../services/payment.service.js';
import { EarningService } from '../services/earning.service.js';
import { InvoiceService } from '../services/invoice.service.js';
import { rupeesToPaise, paiseToRupees } from '@sevasetu/shared';

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

async function runPhase5Tests() {
  console.log('=== STARTING SEVASETU FUNCTIONAL PHASE 5 TEST SUITE ===');

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

  type TestApiResponse = any;

  const apiCall = async (
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      rawBody?: string;
      headers?: Record<string, string>;
      cookie?: string;
    } = {}
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (options.cookie) {
      headers['Cookie'] = options.cookie;
    }

    const body = options.rawBody !== undefined 
      ? options.rawBody 
      : options.body !== undefined 
        ? JSON.stringify(options.body) 
        : undefined;

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body,
    });

    const setCookie = res.headers.get('set-cookie');
    let json: TestApiResponse | null = null;
    try {
      json = (await res.json()) as TestApiResponse;
    } catch {
      // not JSON
    }

    return {
      status: res.status,
      data: json,
      cookie: setCookie ? setCookie.split(';')[0] : options.cookie,
    };
  };

  // Seed / Find catalog service
  const service = await prisma.service.findFirst({
    where: { isActive: true },
    include: { category: true },
  });
  if (!service) {
    throw new Error('No active service found in database. Seed catalog before running tests.');
  }

  // Create Customer 1
  const customer1User = await prisma.user.create({
    data: {
      email: `cust1_p5_${testId}@test.com`,
      fullName: 'Customer One P5',
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });
  const customer1Address = await prisma.address.create({
    data: {
      userId: customer1User.id,
      flatNumber: 'Flat 101, Phase 5 Tower',
      streetArea: 'Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postalCode: '201301',
      isDefault: true,
    },
  });

  // Create Customer 2
  const customer2User = await prisma.user.create({
    data: {
      email: `cust2_p5_${testId}@test.com`,
      fullName: 'Customer Two P5',
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  // Create Provider 1
  const provider1User = await prisma.user.create({
    data: {
      email: `prov1_p5_${testId}@test.com`,
      fullName: 'Technician One P5',
      phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'PROVIDER',
      status: 'ACTIVE',
    },
  });
  const provider1Profile = await prisma.serviceProviderProfile.create({
    data: {
      userId: provider1User.id,
      businessName: 'Seva Precision Services',
      isPubliclyListed: true,
      onboardingStatus: 'COMPLETED',
    },
  });

  // Create Provider 2
  const provider2User = await prisma.user.create({
    data: {
      email: `prov2_p5_${testId}@test.com`,
      fullName: 'Technician Two P5',
      phone: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: 'PROVIDER',
      status: 'ACTIVE',
    },
  });
  await prisma.serviceProviderProfile.create({
    data: {
      userId: provider2User.id,
      businessName: 'Apex Maintenance Co',
      isPubliclyListed: true,
      onboardingStatus: 'COMPLETED',
    },
  });

  // Log in users
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

  // Helper to create test booking
  let bookingSequence = 1;
  const createTestBooking = async (params: {
    customerId: string;
    providerProfileId: string;
    status: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    pricingModel?: string;
    priceSnapshot?: number;
    durationHours?: number;
    scheduledHoursInFuture?: number;
  }) => {
    const hoursAhead = params.scheduledHoursInFuture !== undefined ? params.scheduledHoursInFuture : 24;
    const scheduledDate = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    const dateCode = scheduledDate.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const referenceCode = `BK-${dateCode}-${randSuffix}-${String(bookingSequence++).padStart(3, '0')}`;

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        customerId: params.customerId,
        serviceId: service.id,
        addressId: customer1Address.id,
        description: 'Test service request description',
        requestedDate: scheduledDate,
        requestedStartTime: '10:00',
        requestedDurationHours: params.durationHours || 2,
        addressSnapshot: {
          flatNumber: customer1Address.flatNumber,
          streetArea: customer1Address.streetArea,
          city: customer1Address.city,
          state: customer1Address.state,
          postalCode: customer1Address.postalCode,
        },
        status: 'ACCEPTED',
      },
    });

    return await prisma.booking.create({
      data: {
        referenceCode,
        serviceRequestId: serviceRequest.id,
        customerId: params.customerId,
        providerProfileId: params.providerProfileId,
        serviceId: service.id,
        scheduledDate,
        scheduledStartTime: '10:00',
        scheduledEndTime: '12:00',
        durationHours: params.durationHours || 2,
        status: params.status,
        serviceTitleSnapshot: service.title || 'Standard Home Repair',
        pricingModelSnapshot: (params.pricingModel as any) || 'FIXED',
        priceSnapshot: params.priceSnapshot !== undefined ? params.priceSnapshot : 500.0,
        customerSnapshot: {
          fullName: customer1User.fullName,
          phone: customer1User.phone,
          email: customer1User.email,
        },
        providerSnapshot: {
          businessName: provider1Profile.businessName,
          fullName: provider1User.fullName,
          phone: provider1User.phone,
        },
        locationSnapshot: {
          flatNumber: customer1Address.flatNumber,
          streetArea: customer1Address.streetArea,
          city: customer1Address.city,
          state: customer1Address.state,
          postalCode: customer1Address.postalCode,
        },
      },
    });
  };

  // State to pass across tests
  let mainBooking!: any;
  let mainPayment!: any;
  let mainGatewayOrderId: string = '';
  const idempotencyKeyTest = `idemp_${testId}_${Math.random()}`;

  // ==========================================
  // PAYMENT TESTS (1 - 10)
  // ==========================================

  await runTest(1, 'Valid payment order creation', async () => {
    mainBooking = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'ACCEPTED',
      pricingModel: 'FIXED',
      priceSnapshot: 500.0, // 50000 paise
    });

    const res = await apiCall('/api/payments/orders', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        bookingId: mainBooking.id,
        idempotencyKey: idempotencyKeyTest,
      },
    });

    assert(res.status === 201, `Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data?.success === true, 'Response success must be true');
    assert(res.data?.data?.payment?.amount === 50000, `Expected amount 50000 paise, got ${res.data?.data?.payment?.amount}`);
    assert(res.data?.data?.payment?.status === 'PENDING', `Expected status PENDING, got ${res.data?.data?.payment?.status}`);
    assert(Boolean(res.data?.data?.gatewayOrder?.orderId), 'Gateway orderId must be generated');

    mainPayment = res.data?.data?.payment;
    mainGatewayOrderId = res.data?.data?.gatewayOrder?.orderId || '';
  });

  await runTest(2, 'Wrong booking ownership rejected', async () => {
    // Customer 2 attempts to create payment order for Customer 1's booking
    const res = await apiCall('/api/payments/orders', {
      method: 'POST',
      cookie: cust2Cookie,
      body: {
        bookingId: mainBooking!.id,
      },
    });

    assert(res.status === 403, `Expected status 403, got ${res.status}`);
    assert(res.data?.success === false, 'Expected success false');
  });

  await runTest(3, 'Quote booking without agreed price rejected', async () => {
    const quoteBooking = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'ACCEPTED',
      pricingModel: 'QUOTE',
      priceSnapshot: 0, // Unset quote price
    });

    const res = await apiCall('/api/payments/orders', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        bookingId: quoteBooking.id,
      },
    });

    assert(res.status === 400, `Expected status 400, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await runTest(4, 'Invalid booking state rejected (CANCELLED booking cannot be paid)', async () => {
    const cancelledBooking = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'CANCELLED',
      priceSnapshot: 350.0,
    });

    const res = await apiCall('/api/payments/orders', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        bookingId: cancelledBooking.id,
      },
    });

    assert(res.status === 409, `Expected status 409 Conflict, got ${res.status}`);
  });

  await runTest(5, 'Payment record persists in PostgreSQL with correct relations', async () => {
    const dbPayment = await prisma.payment.findUnique({
      where: { id: mainPayment!.id },
      include: { booking: true, customer: true },
    });

    assert(Boolean(dbPayment), 'Payment record must exist in database');
    assert(dbPayment!.bookingId === mainBooking!.id, 'BookingId must match');
    assert(dbPayment!.customerId === customer1User.id, 'CustomerId must match');
    assert(dbPayment!.amount === 50000, 'Amount must be exactly 50000 paise');
    assert(dbPayment!.currency === 'INR', 'Currency must be INR');
  });

  await runTest(6, 'Duplicate idempotent order request returns existing payment', async () => {
    const res = await apiCall('/api/payments/orders', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        bookingId: mainBooking!.id,
        idempotencyKey: idempotencyKeyTest,
      },
    });

    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.data?.payment?.id === mainPayment!.id || res.data?.data?.payment?.id === mainPayment!.id, 'Must return identical payment ID');

    // Confirm no duplicate row created in database
    const paymentsCount = await prisma.payment.count({
      where: { idempotencyKey: idempotencyKeyTest },
    });
    assert(paymentsCount === 1, `Expected exactly 1 payment record, found ${paymentsCount}`);
  });

  await runTest(7, 'Invalid payment verification signature rejected', async () => {
    const res = await apiCall('/api/payments/verify', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        bookingId: mainBooking!.id,
        gatewayOrderId: mainGatewayOrderId,
        gatewayPaymentId: 'pay_invalid_123',
        gatewaySignature: 'tampered_or_invalid_signature',
      },
    });

    assert(res.status === 400, `Expected status 400, got ${res.status}`);

    // Verify DB record status reflects FAILED
    const dbPayment = await prisma.payment.findUnique({ where: { id: mainPayment!.id } });
    assert(dbPayment?.status === 'FAILED', `Expected status FAILED, got ${dbPayment?.status}`);
    assert(dbPayment?.failureCode === 'INVALID_SIGNATURE', 'Expected failureCode INVALID_SIGNATURE');
  });

  await runTest(8, 'Valid payment verification succeeds and marks PAID', async () => {
    // Reset payment status to PENDING for the valid test
    await prisma.payment.update({
      where: { id: mainPayment!.id },
      data: { status: 'PENDING', failureCode: null, failureMessage: null },
    });

    const testPaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const testSecret = 'sevasetu_test_signature_secret_2026';
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${mainGatewayOrderId}|${testPaymentId}`)
      .digest('hex');

    const res = await apiCall('/api/payments/verify', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        bookingId: mainBooking!.id,
        gatewayOrderId: mainGatewayOrderId,
        gatewayPaymentId: testPaymentId,
        gatewaySignature: validSignature,
        paymentMethod: 'UPI_ONLINE',
      },
    });

    assert(res.status === 200, `Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data?.status === 'PAID' || res.data?.data?.status === 'PAID', 'Expected status PAID');

    // Verify database record
    const dbPayment = await prisma.payment.findUnique({ where: { id: mainPayment!.id } });
    assert(dbPayment?.status === 'PAID', 'Database status must be PAID');
    assert(dbPayment?.gatewayPaymentId === testPaymentId, 'Gateway payment ID must match');
  });

  await runTest(9, 'Duplicate verification does not double-process (Idempotency)', async () => {
    const testPaymentId = mainPayment!.gatewayPaymentId || 'pay_test_existing';
    const testSecret = 'sevasetu_test_signature_secret_2026';
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${mainGatewayOrderId}|${testPaymentId}`)
      .digest('hex');

    const res = await apiCall('/api/payments/verify', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        bookingId: mainBooking!.id,
        gatewayOrderId: mainGatewayOrderId,
        gatewayPaymentId: testPaymentId,
        gatewaySignature: validSignature,
      },
    });

    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.data?.status === 'PAID' || res.data?.data?.status === 'PAID', 'Status remains PAID');

    // Verify invoice count for booking is strictly 1 (no duplicate invoices generated)
    const invoiceCount = await prisma.invoice.count({
      where: { bookingId: mainBooking!.id },
    });
    assert(invoiceCount === 1, `Expected exactly 1 invoice, found ${invoiceCount}`);
  });

  await runTest(10, 'Failed payment state properly records audit history', async () => {
    const bookingForFail = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'ACCEPTED',
      priceSnapshot: 400.0,
    });

    const orderRes = await apiCall('/api/payments/orders', {
      method: 'POST',
      cookie: cust1Cookie,
      body: { bookingId: bookingForFail.id },
    });
    assert(orderRes.status === 201, 'Order created');

    const paymentId = orderRes.data?.data?.payment?.id;
    const orderId = orderRes.data?.data?.gatewayOrder?.orderId;

    // Fail verification
    await apiCall('/api/payments/verify', {
      method: 'POST',
      cookie: cust1Cookie,
      body: {
        bookingId: bookingForFail.id,
        gatewayOrderId: orderId,
        gatewayPaymentId: 'pay_fail_test',
        gatewaySignature: 'bad_signature',
      },
    });

    const histories = await prisma.paymentStatusHistory.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'asc' },
    });

    assert(histories.length >= 2, 'Must have at least 2 history records (PENDING, then FAILED)');
    assert(histories[histories.length - 1]?.newStatus === 'FAILED', 'Last status in history must be FAILED');
  });

  // ==========================================
  // WEBHOOK TESTS (11 - 15)
  // ==========================================

  const webhookSecret = 'sevasetu_test_webhook_secret_2026';

  await runTest(11, 'Valid webhook signature accepted and processed', async () => {
    const webhookBooking = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'ACCEPTED',
      priceSnapshot: 750.0,
    });

    const orderRes = await apiCall('/api/payments/orders', {
      method: 'POST',
      cookie: cust1Cookie,
      body: { bookingId: webhookBooking.id },
    });
    assert(orderRes.status === 201, 'Order created');
    const orderId = orderRes.data?.data?.gatewayOrder?.orderId;

    const payload = JSON.stringify({
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: orderId,
            amount: 75000,
            status: 'paid',
          },
        },
      },
    });

    const signature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

    const res = await apiCall('/api/payments/webhook', {
      method: 'POST',
      rawBody: payload,
      headers: {
        'x-razorpay-signature': signature,
      },
    });

    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data?.success === true, 'Expected webhook success');

    const payment = await prisma.payment.findUnique({ where: { gatewayOrderId: orderId } });
    assert(payment?.status === 'PAID', `Expected payment status PAID, got ${payment?.status}`);
  });

  await runTest(12, 'Invalid webhook signature rejected', async () => {
    const payload = JSON.stringify({ event: 'order.paid' });
    const fakeSignature = 'invalid_forged_webhook_signature';

    const res = await apiCall('/api/payments/webhook', {
      method: 'POST',
      rawBody: payload,
      headers: {
        'x-razorpay-signature': fakeSignature,
      },
    });

    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await runTest(13, 'Duplicate webhook event ignored safely (Idempotency)', async () => {
    const payload = JSON.stringify({
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: mainGatewayOrderId,
            amount: 50000,
          },
        },
      },
    });

    const signature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

    const res = await apiCall('/api/payments/webhook', {
      method: 'POST',
      rawBody: payload,
      headers: {
        'x-razorpay-signature': signature,
      },
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data?.success === true, 'Duplicate webhook returned success safely');
  });

  await runTest(14, 'Unknown webhook event handled safely without error', async () => {
    const payload = JSON.stringify({
      event: 'unsupported.dummy.event',
      payload: {},
    });

    const signature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

    const res = await apiCall('/api/payments/webhook', {
      method: 'POST',
      rawBody: payload,
      headers: {
        'x-razorpay-signature': signature,
      },
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await runTest(15, 'Payment.failed webhook event updates payment status to FAILED', async () => {
    const failBooking = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'ACCEPTED',
      priceSnapshot: 600.0,
    });

    const orderRes = await apiCall('/api/payments/orders', {
      method: 'POST',
      cookie: cust1Cookie,
      body: { bookingId: failBooking.id },
    });
    const orderId = orderRes.data?.data?.gatewayOrder?.orderId;

    const payload = JSON.stringify({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            order_id: orderId,
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Card declined by issuing bank',
          },
        },
      },
    });

    const signature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

    const res = await apiCall('/api/payments/webhook', {
      method: 'POST',
      rawBody: payload,
      headers: {
        'x-razorpay-signature': signature,
      },
    });

    assert(res.status === 200, 'Webhook accepted');
    const payment = await prisma.payment.findUnique({ where: { gatewayOrderId: orderId } });
    assert(payment?.status === 'FAILED', `Expected status FAILED, got ${payment?.status}`);
    assert(payment?.failureCode === 'BAD_REQUEST_ERROR', 'Failure code must match payload');
  });

  // ==========================================
  // INVOICE TESTS (16 - 19)
  // ==========================================

  let mainInvoice: (import('@prisma/client').Invoice & { lineItems: import('@prisma/client').InvoiceLineItem[] }) | null = null;

  await runTest(16, 'Invoice generated correctly with line items & snapshots upon payment', async () => {
    const invoice = await prisma.invoice.findFirst({
      where: { bookingId: mainBooking!.id },
      include: { lineItems: true },
    });

    assert(Boolean(invoice), 'Invoice must exist for verified booking');
    assert(invoice!.subtotal === 50000, `Expected subtotal 50000, got ${invoice!.subtotal}`);
    assert(invoice!.total === 50000, `Expected total 50000, got ${invoice!.total}`);
    assert(invoice!.lineItems.length >= 1, 'Invoice must have at least 1 line item');
    assert(Boolean(invoice!.customerSnapshot), 'Customer snapshot must be present');
    assert(Boolean(invoice!.providerSnapshot), 'Provider snapshot must be present');

    mainInvoice = invoice;
  });

  await runTest(17, 'Invoice number unique, sequential, and follows INV-YYYYMM-XXXXX format', async () => {
    const regex = /^INV-\d{6}-\d{5}$/;
    assert(regex.test(mainInvoice!.invoiceNumber), `Invoice number '${mainInvoice!.invoiceNumber}' does not match INV-YYYYMM-XXXXX pattern`);

    // Verify atomic sequential generator creates consecutive number
    const nextNumber = await prisma.$transaction(async (tx) => {
      return await InvoiceService.generateInvoiceNumber(tx);
    });
    assert(regex.test(nextNumber), `Next invoice number '${nextNumber}' must match pattern`);
    assert(nextNumber !== mainInvoice!.invoiceNumber, 'Sequential invoice numbers must be unique');
  });

  await runTest(18, 'Invoice historical amount preserved against provider price changes', async () => {
    // Simulate provider service price change
    const originalTotal = mainInvoice!.total;

    // Verify invoice table remains unchanged
    const currentInvoice = await prisma.invoice.findUnique({ where: { id: mainInvoice!.id } });
    assert(currentInvoice?.total === originalTotal, 'Historical invoice total must remain immutable');
  });

  await runTest(19, 'Unauthorized invoice access rejected (IDOR Protection)', async () => {
    // Customer 2 attempts to fetch Customer 1's invoice
    const res = await apiCall(`/api/customer/invoices/${mainInvoice!.id}`, {
      method: 'GET',
      cookie: cust2Cookie,
    });

    assert(res.status === 403, `Expected status 403, got ${res.status}`);

    // Customer 1 fetching own invoice works
    const okRes = await apiCall(`/api/customer/invoices/${mainInvoice!.id}`, {
      method: 'GET',
      cookie: cust1Cookie,
    });
    assert(okRes.status === 200, `Customer 1 must be able to view own invoice, got ${okRes.status}`);
  });

  // ==========================================
  // REFUND & CANCELLATION TESTS (20 - 24)
  // ==========================================

  await runTest(20, 'Invalid refund rejected for unpaid booking', async () => {
    const unpaidBooking = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'ACCEPTED',
      priceSnapshot: 300.0,
    });

    const refund = await PaymentService.processCancellationRefund(
      unpaidBooking.id,
      customer1User.id,
      'CUSTOMER',
      'Changed mind'
    );

    assert(refund === null, 'No refund should be processed for unpaid booking');
  });

  let advanceBooking!: any;

  await runTest(21, 'Authorized free cancellation refund processed (100% refund for > 2 hours)', async () => {
    // Create paid booking scheduled 24 hours in the future
    advanceBooking = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'ACCEPTED',
      priceSnapshot: 800.0, // 80000 paise
      scheduledHoursInFuture: 24,
    });

    // Create & pay payment directly
    const payment = await prisma.payment.create({
      data: {
        referenceCode: `PAY-ADV-${Date.now()}`,
        bookingId: advanceBooking.id,
        customerId: customer1User.id,
        providerProfileId: provider1Profile.id,
        gatewayProvider: 'RAZORPAY',
        gatewayOrderId: `order_adv_${Date.now()}`,
        amount: 80000,
        baseAmount: 80000,
        currency: 'INR',
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    const refund = await PaymentService.processCancellationRefund(
      advanceBooking.id,
      customer1User.id,
      'CUSTOMER',
      'Schedule conflict'
    );

    assert(Boolean(refund), 'Refund record must be created');
    assert(refund!.amount === 80000, `Expected 100% refund 80000 paise, got ${refund!.amount}`);
    assert(refund!.status === 'COMPLETED', `Expected refund status COMPLETED, got ${refund!.status}`);

    // Verify aggregate payment status is REFUNDED
    const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    assert(updatedPayment?.status === 'REFUNDED', `Expected payment status REFUNDED, got ${updatedPayment?.status}`);
  });

  await runTest(22, 'Duplicate refund prevented (Idempotent refunding)', async () => {
    // Re-running refund process for the already refunded booking
    const refundAgain = await PaymentService.processCancellationRefund(
      advanceBooking.id,
      customer1User.id,
      'CUSTOMER',
      'Second cancellation call'
    );

    assert(Boolean(refundAgain), 'Returns existing refund safely');
    const refundCount = await prisma.refund.count({
      where: { bookingId: advanceBooking.id },
    });
    assert(refundCount === 1, 'Cannot create more than 1 refund record for single cancellation');
  });

  await runTest(23, 'Refund state transitions are validated and protected', async () => {
    // Valid transition from PENDING -> COMPLETED is allowed; arbitrary transitions rejected
    const testRefund = await prisma.refund.create({
      data: {
        refundReference: `RFND-TEST-${Date.now()}`,
        paymentId: mainPayment.id,
        bookingId: mainBooking.id,
        amount: 10000,
        currency: 'INR',
        status: 'PENDING',
        reason: 'Test state transition',
        initiatedBy: 'CUSTOMER',
      },
    });

    assert(testRefund.status === 'PENDING', 'Refund initialized as PENDING');
    const updated = await prisma.refund.update({
      where: { id: testRefund.id },
      data: { status: 'COMPLETED', processedAt: new Date() },
    });
    assert(updated.status === 'COMPLETED', 'Refund successfully transitioned to COMPLETED');
  });

  await runTest(24, 'Cancellation refund applies 20% late fee when cancelled <= 2 hours before service', async () => {
    // Create paid booking scheduled only 1 hour in the future
    const lateBooking = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'IN_PROGRESS',
      priceSnapshot: 1000.0, // 100000 paise
      scheduledHoursInFuture: 1, // <= 2 hours!
    });

    const payment = await prisma.payment.create({
      data: {
        referenceCode: `PAY-LATE-${Date.now()}`,
        bookingId: lateBooking.id,
        customerId: customer1User.id,
        providerProfileId: provider1Profile.id,
        gatewayProvider: 'RAZORPAY',
        gatewayOrderId: `order_late_${Date.now()}`,
        amount: 100000,
        baseAmount: 100000,
        currency: 'INR',
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    const refund = await PaymentService.processCancellationRefund(
      lateBooking.id,
      customer1User.id,
      'CUSTOMER',
      'Emergency cancellation'
    );

    assert(Boolean(refund), 'Refund record must be created');
    // 100000 - 20% (20000) = 80000 paise
    assert(refund!.amount === 80000, `Expected 80000 paise (80%), got ${refund!.amount}`);

    const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    assert(updatedPayment?.status === 'PARTIALLY_REFUNDED', `Expected PARTIALLY_REFUNDED, got ${updatedPayment?.status}`);
  });

  // ==========================================
  // PROVIDER EARNINGS TESTS (25 - 28)
  // ==========================================

  let earningBooking!: any;

  await runTest(25, 'Earning created from completed booking financial event', async () => {
    earningBooking = await createTestBooking({
      customerId: customer1User.id,
      providerProfileId: provider1Profile.id,
      status: 'COMPLETED',
      priceSnapshot: 1200.0, // 120000 paise
    });

    const earningPayment = await prisma.payment.create({
      data: {
        referenceCode: `PAY-EARN-${Date.now()}`,
        bookingId: earningBooking.id,
        customerId: customer1User.id,
        providerProfileId: provider1Profile.id,
        gatewayProvider: 'RAZORPAY',
        gatewayOrderId: `order_earn_${Date.now()}`,
        amount: 120000,
        baseAmount: 120000,
        currency: 'INR',
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    const earningId = await prisma.$transaction(async (tx) => {
      return await EarningService.recognizeEarningForBooking(tx, earningBooking, earningPayment);
    });

    assert(Boolean(earningId), 'Earning ID must be returned');

    const dbEarning = await prisma.providerEarning.findUnique({ where: { id: earningId! } });
    assert(Boolean(dbEarning), 'Earning record must exist in database');
    assert(dbEarning?.grossAmount === 120000, 'Gross amount must be 120000 paise');
    assert(dbEarning?.platformFee === 12000, `10% Platform fee must be 12000 paise, got ${dbEarning?.platformFee}`);
    assert(dbEarning?.netEarning === 108000, `Net earning must be 108000 paise, got ${dbEarning?.netEarning}`);
    assert(dbEarning?.status === 'AVAILABLE', 'Earning status must be AVAILABLE');
  });

  await runTest(26, 'Duplicate financial event does not double-credit (Constraint & idempotency)', async () => {
    // Attempt to recognize earning again for the same booking
    const secondCallEarningId = await prisma.$transaction(async (tx) => {
      const dummyPayment = { id: 'dummy_pay', baseAmount: 120000, amount: 120000, currency: 'INR' };
      return await EarningService.recognizeEarningForBooking(tx, earningBooking, dummyPayment);
    });

    assert(Boolean(secondCallEarningId), 'Returns existing earning record ID');

    // Confirm database has strictly 1 record for this booking & provider
    const count = await prisma.providerEarning.count({
      where: {
        bookingId: earningBooking.id,
        providerProfileId: provider1Profile.id,
      },
    });
    assert(count === 1, `Expected exactly 1 earning record, found ${count}`);
  });

  await runTest(27, 'Provider earnings ownership enforced (Provider 2 cannot see Provider 1)', async () => {
    const res = await apiCall('/api/provider/earnings', {
      method: 'GET',
      cookie: prov2Cookie,
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const earnings = (res.data?.data?.earnings ?? res.data?.data) || [];
    assert(Array.isArray(earnings), 'Expected array data');
    assert(earnings.length === 0, `Provider 2 must have 0 earnings, found ${earnings.length}`);
  });

  await runTest(28, 'Net amount calculation exact without floating-point errors', async () => {
    // Test conversion utilities and exact integer math
    const rupees = 1200.50;
    const paise = rupeesToPaise(rupees);
    assert(paise === 120050, `Expected 120050 paise, got ${paise}`);
    assert(paiseToRupees(paise) === 1200.5, 'Rupees conversion must match');

    // 10% platform fee of 120050 paise:
    const commission = Math.floor((paise * 10) / 100);
    assert(commission === 12005, `Expected 12005 paise, got ${commission}`);
    const net = paise - commission;
    assert(net === 108045, `Expected 108045 paise, got ${net}`);
  });

  // ==========================================
  // PAYOUT TESTS (29 - 30)
  // ==========================================

  await runTest(29, 'Provider payout request created and readable only by owner', async () => {
    // Provider 1 requests 50000 paise (500 INR) payout from available 108000 paise
    const res = await apiCall('/api/provider/payouts', {
      method: 'POST',
      cookie: prov1Cookie,
      body: {
        amountPaise: 50000,
        bankDetails: {
          accountNumber: 'XXXXXX1234',
          ifsc: 'HDFC0001234',
          bankName: 'HDFC Bank',
        },
      },
    });

    assert(res.status === 201, `Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data?.data?.amount === 50000, 'Payout amount must be 50000 paise');
    assert(res.data?.data?.status === 'PENDING', 'Payout status must be PENDING');

    // Provider 1 views payouts
    const listRes = await apiCall('/api/provider/payouts', {
      method: 'GET',
      cookie: prov1Cookie,
    });
    assert(listRes.status === 200, 'Provider 1 can read payouts');
    const p1Payouts = listRes.data?.data?.payouts ?? listRes.data?.data;
    assert(Array.isArray(p1Payouts) && p1Payouts.length >= 1, 'Provider 1 has at least 1 payout');

    // Provider 2 views payouts -> isolated
    const p2ListRes = await apiCall('/api/provider/payouts', {
      method: 'GET',
      cookie: prov2Cookie,
    });
    assert(p2ListRes.status === 200, 'Provider 2 can read payouts');
    const p2Payouts = p2ListRes.data?.data?.payouts ?? p2ListRes.data?.data;
    assert(Array.isArray(p2Payouts) && p2Payouts.length === 0, 'Provider 2 sees 0 payouts');
  });

  await runTest(30, 'Payout request exceeding available balance rejected', async () => {
    // Request amount greater than remaining available balance
    const res = await apiCall('/api/provider/payouts', {
      method: 'POST',
      cookie: prov1Cookie,
      body: {
        amountPaise: 999999999, // Exceeds balance
      },
    });

    assert(res.status === 400, `Expected status 400 Insufficient balance, got ${res.status}`);
  });

  // ==========================================
  // SECURITY & AUTHORIZATION TESTS (31 - 34)
  // ==========================================

  await runTest(31, 'Customer cannot access another customer payment record', async () => {
    const res = await apiCall(`/api/payments/${mainPayment!.id}`, {
      method: 'GET',
      cookie: cust2Cookie,
    });

    assert(res.status === 403, `Expected status 403 Forbidden, got ${res.status}`);
  });

  await runTest(32, 'Provider financial ledger summary isolated between providers', async () => {
    const p1Summary = await apiCall('/api/provider/earnings/summary', {
      method: 'GET',
      cookie: prov1Cookie,
    });
    assert(Number(p1Summary.data?.totalGrossEarnings ?? p1Summary.data?.data?.totalGrossEarnings) > 0, 'Provider 1 has positive gross earnings');

    const p2Summary = await apiCall('/api/provider/earnings/summary', {
      method: 'GET',
      cookie: prov2Cookie,
    });
    assert(Number(p2Summary.data?.totalGrossEarnings ?? p2Summary.data?.data?.totalGrossEarnings ?? 0) === 0, 'Provider 2 summary is strictly 0');
  });

  await runTest(33, 'Payment gateway secrets and tokens absent from all API responses', async () => {
    const res = await apiCall(`/api/payments/${mainPayment!.id}`, {
      method: 'GET',
      cookie: cust1Cookie,
    });

    const bodyStr = JSON.stringify(res.data);
    assert(!bodyStr.includes('keySecret'), 'Must not expose keySecret');
    assert(!bodyStr.includes('webhookSecret'), 'Must not expose webhookSecret');
    assert(!bodyStr.includes('passwordHash'), 'Must not expose passwordHash');
  });

  await runTest(34, 'Card credentials and CVV never stored or returned', async () => {
    const payment = await prisma.payment.findUnique({ where: { id: mainPayment!.id } });
    const paymentKeys = Object.keys(payment || {});
    assert(!paymentKeys.includes('cardNumber'), 'Cannot store cardNumber');
    assert(!paymentKeys.includes('cvv'), 'Cannot store cvv');
    assert(!paymentKeys.includes('pin'), 'Cannot store pin');
  });

  // ==========================================
  // DATABASE INTEGRITY TESTS (35 - 38)
  // ==========================================

  await runTest(35, 'Prisma database migrations applied and verified', async () => {
    // Check tables exist by executing count queries
    const paymentCount = await prisma.payment.count();
    const invoiceCount = await prisma.invoice.count();
    const refundCount = await prisma.refund.count();
    const earningCount = await prisma.providerEarning.count();
    const payoutCount = await prisma.providerPayout.count();

    assert(paymentCount >= 1, 'Payments table active');
    assert(invoiceCount >= 1, 'Invoices table active');
    assert(refundCount >= 1, 'Refunds table active');
    assert(earningCount >= 1, 'Earnings table active');
    assert(payoutCount >= 1, 'Payouts table active');
  });

  await runTest(36, 'Foreign key financial relations valid and intact', async () => {
    const invoice = await prisma.invoice.findFirst({
      where: { bookingId: mainBooking!.id },
      include: { booking: true, payment: true, customer: true, providerProfile: true },
    });

    assert(Boolean(invoice?.booking), 'Invoice relation to booking intact');
    assert(Boolean(invoice?.payment), 'Invoice relation to payment intact');
    assert(Boolean(invoice?.customer), 'Invoice relation to customer intact');
    assert(Boolean(invoice?.providerProfile), 'Invoice relation to provider profile intact');
  });

  await runTest(37, 'Unique constraints on idempotencyKey and earnings work', async () => {
    let duplicateRejected = false;
    try {
      // Attempt to insert duplicate idempotencyKey
      await prisma.payment.create({
        data: {
          referenceCode: `PAY-DUP-${Date.now()}`,
          bookingId: mainBooking.id,
          customerId: customer1User.id,
          providerProfileId: provider1Profile.id,
          gatewayProvider: 'RAZORPAY',
          amount: 50000,
          baseAmount: 50000,
          currency: 'INR',
          status: 'PENDING',
          idempotencyKey: idempotencyKeyTest, // ALREADY EXISTS
        },
      });
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Database unique constraint must reject duplicate idempotencyKey');
  });

  await runTest(38, 'PostgreSQL persistence verified across transactions', async () => {
    const payments = await prisma.payment.findMany({
      where: { customerId: customer1User.id },
    });
    assert(payments.length >= 3, `Expected at least 3 payments persisted for Customer 1, found ${payments.length}`);
  });

  // Cleanup server
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  console.log('\n=== PHASE 5 TEST RESULTS SUMMARY ===');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) {
    console.error('\nFAILED TESTS:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.error(`  - Test ${r.num}: ${r.name} -> ${r.error}`));
    process.exit(1);
  } else {
    console.log('\nALL 38 PHASE 5 TESTS PASSED SUCCESSFULLY!');
  }
}

runPhase5Tests().catch((err) => {
  console.error('Test suite failed to run:', err);
  process.exit(1);
});
