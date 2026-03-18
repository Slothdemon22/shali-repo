import { prisma } from '../lib/prisma';

async function main() {
  const adminEmail = 'admin@shali.com';
  const rawPassword = 'password123';
  
  // Upsert the admin user with plain text password (ordered by user)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: rawPassword,
    },
    create: {
      email: adminEmail,
      password: rawPassword,
      name: 'Site Admin',
      role: 'admin',
    },
  });

  console.log('Seed executed successfully.');
  console.log('Admin user seeded:', admin.email);

  // Seed default site settings
  await prisma.siteSettings.upsert({
    where: { key: 'hero_image' },
    update: {},
    create: {
      key: 'hero_image',
      value: '/images/hero_banner_1773220198541.png',
    },
  });

  console.log('Site settings seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
