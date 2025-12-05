import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Demo Therapy Center',
      subdomain: 'demo',
      active: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users with different roles
  const admin = await prisma.user.upsert({
    where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: '01712345678' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phoneNumber: '01712345678',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'WORKSPACE_ADMIN',
      active: true,
    },
  });

  const operator = await prisma.user.upsert({
    where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: '01812345678' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phoneNumber: '01812345678',
      passwordHash: hashedPassword,
      firstName: 'Operator',
      lastName: 'User',
      role: 'OPERATOR',
      active: true,
    },
  });

  // Create therapy types first (needed for therapist specialization)
  const physicalTherapy = await prisma.therapyType.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Physical Therapy' } },
    update: {},
    create: {
      id: randomUUID(),
      tenantId: tenant.id,
      name: 'Physical Therapy',
      description: 'Physical therapy for motor skills development',
      defaultDuration: 60,
      defaultCost: 50.0,
      active: true,
      updatedAt: new Date(),
    },
  });

  const occupationalTherapy = await prisma.therapyType.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Occupational Therapy' } },
    update: {},
    create: {
      id: randomUUID(),
      tenantId: tenant.id,
      name: 'Occupational Therapy',
      description: 'Occupational therapy for daily living skills',
      defaultDuration: 45,
      defaultCost: 45.0,
      active: true,
      updatedAt: new Date(),
    },
  });

  const speechTherapy = await prisma.therapyType.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Speech Therapy' } },
    update: {},
    create: {
      id: randomUUID(),
      tenantId: tenant.id,
      name: 'Speech Therapy',
      description: 'Speech and language therapy',
      defaultDuration: 30,
      defaultCost: 40.0,
      active: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created therapy types: Physical, Occupational, Speech');

  const therapist1 = await prisma.user.upsert({
    where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: '01912345678' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phoneNumber: '01912345678',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'THERAPIST',
      specializationId: physicalTherapy.id,
      sessionDuration: 60,
      sessionCost: 60.0,
      active: true,
    },
  });

  const therapist2 = await prisma.user.upsert({
    where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: '01913345678' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phoneNumber: '01913345678',
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Williams',
      role: 'THERAPIST',
      specializationId: speechTherapy.id,
      sessionDuration: 30,
      sessionCost: 45.0,
      active: true,
    },
  });

  const therapist3 = await prisma.user.upsert({
    where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: '01914345678' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phoneNumber: '01914345678',
      passwordHash: hashedPassword,
      firstName: 'Michael',
      lastName: 'Brown',
      role: 'THERAPIST',
      specializationId: occupationalTherapy.id,
      sessionDuration: 45,
      sessionCost: 48.0,
      active: true,
    },
  });

  const accountant = await prisma.user.upsert({
    where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: '01612345678' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phoneNumber: '01612345678',
      passwordHash: hashedPassword,
      firstName: 'Accountant',
      lastName: 'User',
      role: 'ACCOUNTANT',
      active: true,
    },
  });

  console.log('✅ Created users: Admin, Operator, 3 Therapists, Accountant');
  console.log('   Therapist 1: John Smith - Physical Therapy ($60/60min)');
  console.log('   Therapist 2: Sarah Williams - Speech Therapy ($45/30min)');
  console.log('   Therapist 3: Michael Brown - Occupational Therapy ($48/45min)');

  // Create therapist availability (Monday to Friday, 9 AM to 5 PM)
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const therapyTypes = [physicalTherapy, occupationalTherapy, speechTherapy];
  const therapists = [therapist1, therapist2, therapist3];

  for (const therapist of therapists) {
    for (const day of days) {
      for (const therapyType of therapyTypes) {
        await prisma.therapistAvailability.create({
          data: {
            tenantId: tenant.id,
            therapistId: therapist.id,
            therapyTypeId: therapyType.id,
            dayOfWeek: day as any,
            startTime: '09:00',
            endTime: '17:00',
            active: true,
          },
        });
      }
    }
  }

  console.log('✅ Created therapist availability schedules for all therapists');

  // Create sample patients
  const patient1 = await prisma.patient.create({
    data: {
      id: randomUUID(),
      tenantId: tenant.id,
      firstName: 'Emma',
      lastName: 'Johnson',
      dateOfBirth: new Date('2018-05-15'),
      guardianName: 'Sarah Johnson',
      guardianPhone: '+1234567890',
      guardianEmail: 'sarah.johnson@example.com',
      address: '123 Main St, City, State 12345',
      medicalNotes: 'Diagnosed with autism spectrum disorder',
      creditBalance: 200.0,
      active: true,
      updatedAt: new Date(),
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      id: randomUUID(),
      tenantId: tenant.id,
      firstName: 'Liam',
      lastName: 'Smith',
      dateOfBirth: new Date('2019-08-22'),
      guardianName: 'Michael Smith',
      guardianPhone: '+1234567891',
      guardianEmail: 'michael.smith@example.com',
      address: '456 Oak Ave, City, State 12345',
      medicalNotes: 'Speech delay',
      creditBalance: 150.0,
      active: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created sample patients: Emma, Liam');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📝 Demo Credentials (Phone Number):');
  console.log('   Admin:       01712345678 / password123');
  console.log('   Operator:    01812345678 / password123');
  console.log('   Therapist 1: 01912345678 / password123 (John Smith)');
  console.log('   Therapist 2: 01913345678 / password123 (Sarah Williams)');
  console.log('   Therapist 3: 01914345678 / password123 (Michael Brown)');
  console.log('   Accountant:  01612345678 / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
