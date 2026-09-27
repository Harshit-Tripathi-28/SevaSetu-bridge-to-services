import { getPrismaClient } from '../config/database.js';
import { hashPassword, validatePasswordStrength } from '../utils/password.js';

/**
 * Controlled development script to provision an initial Admin account.
 * Reads credentials from environment variables or command-line arguments.
 * NEVER hardcodes credentials.
 *
 * Usage:
 * ADMIN_EMAIL=admin@sevasetu.in ADMIN_PASSWORD=AdminSecurePass123 npx tsx src/scripts/create-admin.ts
 */
async function main() {
  const email = process.env.ADMIN_EMAIL || process.argv.find((a) => a.startsWith('--email='))?.split('=')[1];
  const password = process.env.ADMIN_PASSWORD || process.argv.find((a) => a.startsWith('--password='))?.split('=')[1];
  const fullName = process.env.ADMIN_NAME || 'Platform Administrator';

  if (!email || !password) {
    console.error('Error: Please provide ADMIN_EMAIL and ADMIN_PASSWORD via environment variables or CLI flags (--email=, --password=).');
    process.exit(1);
  }

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    console.error(`Error: Password validation failed: ${passwordValidation.message}`);
    process.exit(1);
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('Error: Database connection not available.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  const passwordHash = await hashPassword(password);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash,
      },
    });
    console.log(`[Admin Provisioning] Successfully promoted existing user (${email}) to ADMIN role.`);
  } else {
    const created = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        fullName,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`[Admin Provisioning] Successfully provisioned new ADMIN account with ID: ${created.id}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Admin provisioning failed:', err);
  process.exit(1);
});
