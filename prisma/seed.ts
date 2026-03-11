const { PrismaClient } = require('../app/generated/prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing existing data...');
  await prisma.product.deleteMany({});
  await prisma.homeFeature.deleteMany({});
  await prisma.category.deleteMany({});

  console.log('Seeding categories...');
  const luxuryPret = await prisma.category.create({ data: { name: 'LUXURY PRET' } });
  const readyToWear = await prisma.category.create({ data: { name: 'READY TO WEAR' } });
  const unstitched = await prisma.category.create({ data: { name: 'UNSTITCHED' } });
  const accessories = await prisma.category.create({ data: { name: 'ACCESSORIES' } });

  console.log('Seeding products...');
  
  const products = [
    {
      name: 'Emerald Velvet Ensemble',
      price: 'PKR 12,500',
      description: 'Rich emerald velvet tunic with delicate gold embroidery on sleeves and neckline.',
      image: '/images/pret_wear_1_1773220216021.png',
      categoryId: luxuryPret.id,
      sku: 'LP-EV-001',
      fabric: 'Velvet',
      sizes: ['S', 'M', 'L'],
      badge: 'NEW',
    },
    {
      name: 'Midnight Bloom Silk',
      price: 'PKR 15,000',
      description: 'Midnight blue silk shirt featuring floral patterns and a graceful fall.',
      image: '/images/pret_wear_1_1773220216021.png',
      categoryId: luxuryPret.id,
      sku: 'LP-MB-002',
      fabric: 'Raw Silk',
      sizes: ['XS', 'S', 'M', 'L'],
    },
    {
      name: 'Crimson Cotton Kurta',
      price: 'PKR 6,500',
      description: 'Bright crimson cotton kurta with minimal geometric stitching.',
      image: '/images/ready_to_wear.png',
      categoryId: readyToWear.id,
      sku: 'RW-CC-003',
      fabric: 'Pure Cotton',
      sizes: ['S', 'M', 'L', 'XL'],
      badge: 'BEST SELLER',
    },
    {
      name: 'Azure Breeze Lawn',
      price: 'PKR 5,500',
      description: 'Breathable azure blue lawn suit for everyday comfort.',
      image: '/images/unstitched.png',
      categoryId: unstitched.id,
      sku: 'US-AB-004',
      fabric: 'Fine Lawn',
      sizes: ['Standard'],
    },
    {
      name: 'Gold Embellished Stole',
      price: 'PKR 3,500',
      description: 'Elegant gold-toned stole with tassel details.',
      image: '/images/freedom_to_buy.png',
      categoryId: accessories.id,
      sku: 'AC-GS-005',
      fabric: 'Silk Georgette',
      sizes: ['One Size'],
    }
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log('Seeding Home Features...');
  const features = [
    { title: 'READY TO WEAR', image: '/images/ready_to_wear.png', order: 1, categoryId: readyToWear.id },
    { title: 'UNSTITCHED', image: '/images/unstitched.png', order: 2, categoryId: unstitched.id },
    { title: 'FREEDOM TO BUY', image: '/images/freedom_to_buy.png', order: 3, categoryId: luxuryPret.id },
  ];

  for (const f of features) {
    await prisma.homeFeature.create({ data: f });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
