import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking user with phone: 01712345678\n');

  const user = await prisma.user.findFirst({
    where: {
      phoneNumber: '01712345678',
    },
    include: {
      tenant: true,
    },
  });

  if (!user) {
    console.log('❌ User not found!');
    console.log('\nAll users in database:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
      },
    });
    console.log(allUsers);
    return;
  }

  console.log('✅ User found:');
  console.log('  ID:', user.id);
  console.log('  Phone:', user.phoneNumber);
  console.log('  Name:', user.firstName, user.lastName);
  console.log('  Role:', user.role);
  console.log('  Active:', user.active);
  console.log('  Tenant:', user.tenant.name);
  console.log('  Tenant Active:', user.tenant.active);

  // Test password
  console.log('\n🔐 Testing password...');
  const testPassword = 'password123';
  const isValid = await bcrypt.compare(testPassword, user.passwordHash);
  console.log('  Password "password123" valid:', isValid);

  if (!isValid) {
    console.log('\n⚠️  Password hash:', user.passwordHash.substring(0, 20) + '...');
    console.log('  Expected hash for "password123":', (await bcrypt.hash(testPassword, 10)).substring(0, 20) + '...');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
