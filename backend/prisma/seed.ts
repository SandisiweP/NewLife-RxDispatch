import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('PharmacyPass2026!', 10);

  const pharmacy = await prisma.pharmacy.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'NewLife Rx Central Nairobi',
      address: 'Central Station Road, Nairobi, Kenya',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@newliferx.co.ke' },
    update: {},
    create: {
      name: 'Pharmacy Staff',
      email: 'staff@newliferx.co.ke',
      passwordHash: hashedPassword,
      role: Role.PHARMACY_STAFF,
      pharmacyId: pharmacy.id,
    },
  });

  const dispatch = await prisma.user.upsert({
    where: { email: 'dispatch@newliferx.co.ke' },
    update: {},
    create: {
      name: 'Lead Dispatcher',
      email: 'dispatch@newliferx.co.ke',
      passwordHash: hashedPassword,
      role: Role.DISPATCHER,
      pharmacyId: pharmacy.id,
    },
  });

  const rider = await prisma.user.upsert({
    where: { email: 'rider@newliferx.co.ke' },
    update: {},
    create: {
      name: 'Express Rider',
      email: 'rider@newliferx.co.ke',
      passwordHash: hashedPassword,
      role: Role.RIDER,
      pharmacyId: pharmacy.id,
    },
  });

  console.log('PostgreSQL Seed executed successfully!');
  console.log(`Created Pharmacy: ${pharmacy.name}`);
  console.log(`Created Users: ${staff.email}, ${dispatch.email}, ${rider.email}`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });