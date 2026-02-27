// ============================================================
// Prisma Seed Script — ML-Ecommerce
// Run: npx ts-node prisma/seed.ts
// ============================================================

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ───────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ml-ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ml-ecommerce.com',
      passwordHash: adminPassword,
      fullName: 'Super Admin',
      role: UserRole.superadmin,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─── Demo Customer ────────────────────────────────────────
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: customerPassword,
      fullName: 'Nguyễn Văn A',
      phone: '0901234567',
      role: UserRole.customer,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Demo customer: ${customer.email}`);

  // ─── Categories ───────────────────────────────────────────
  const electronics = await prisma.category.upsert({
    where: { slug: 'dien-tu' },
    update: {},
    create: {
      name: 'Điện Tử',
      slug: 'dien-tu',
      description: 'Thiết bị điện tử, công nghệ',
      sortOrder: 1,
      isActive: true,
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: 'thoi-trang' },
    update: {},
    create: {
      name: 'Thời Trang',
      slug: 'thoi-trang',
      description: 'Quần áo, giày dép, phụ kiện',
      sortOrder: 2,
      isActive: true,
    },
  });

  const food = await prisma.category.upsert({
    where: { slug: 'thuc-pham' },
    update: {},
    create: {
      name: 'Thực Phẩm',
      slug: 'thuc-pham',
      description: 'Thực phẩm, đồ uống',
      sortOrder: 3,
      isActive: true,
    },
  });

  // Sub-categories
  await prisma.category.upsert({
    where: { slug: 'dien-thoai' },
    update: {},
    create: {
      name: 'Điện Thoại',
      slug: 'dien-thoai',
      parentId: electronics.id,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'laptop' },
    update: {},
    create: {
      name: 'Laptop',
      slug: 'laptop',
      parentId: electronics.id,
      sortOrder: 2,
      isActive: true,
    },
  });

  console.log(`✅ Categories created`);

  // ─── Brands ───────────────────────────────────────────────
  const brands = [
    { name: 'Apple', slug: 'apple' },
    { name: 'Samsung', slug: 'samsung' },
    { name: 'Nike', slug: 'nike' },
    { name: 'Adidas', slug: 'adidas' },
    { name: 'Vinamilk', slug: 'vinamilk' },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: { ...brand, isActive: true },
    });
  }
  console.log(`✅ Brands created`);

  // ─── Sample Products ──────────────────────────────────────
  const appleBrand = await prisma.brand.findUnique({ where: { slug: 'apple' } });
  const samsungBrand = await prisma.brand.findUnique({ where: { slug: 'samsung' } });

  const products = [
    {
      name: 'iPhone 15 Pro Max 256GB',
      slug: 'iphone-15-pro-max-256gb',
      description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình 6.7 inch Super Retina XDR.',
      shortDescription: 'Flagship iPhone với chip A17 Pro mạnh mẽ',
      basePrice: 34990000,
      salePrice: 32990000,
      sku: 'IPH15PM-256',
      stockQuantity: 50,
      categoryId: electronics.id,
      brandId: appleBrand?.id,
      tags: ['iphone', 'apple', 'smartphone', 'flagship'],
      isFeatured: true,
      purchaseCount: 120,
      viewCount: 5000,
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Samsung Galaxy S24 Ultra với bút S Pen, camera 200MP, màn hình Dynamic AMOLED 2X.',
      shortDescription: 'Flagship Samsung với camera 200MP và S Pen',
      basePrice: 31990000,
      salePrice: 29990000,
      sku: 'SGS24U-256',
      stockQuantity: 35,
      categoryId: electronics.id,
      brandId: samsungBrand?.id,
      tags: ['samsung', 'galaxy', 'smartphone', 'android'],
      isFeatured: true,
      purchaseCount: 85,
      viewCount: 3800,
    },
    {
      name: 'MacBook Pro 14" M3 Pro',
      slug: 'macbook-pro-14-m3-pro',
      description: 'MacBook Pro 14 inch với chip M3 Pro, 18GB RAM, 512GB SSD, màn hình Liquid Retina XDR.',
      shortDescription: 'Laptop chuyên nghiệp với chip M3 Pro',
      basePrice: 52990000,
      sku: 'MBP14-M3P-512',
      stockQuantity: 20,
      categoryId: electronics.id,
      brandId: appleBrand?.id,
      tags: ['macbook', 'apple', 'laptop', 'macos'],
      isFeatured: true,
      purchaseCount: 45,
      viewCount: 2200,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...product,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        isActive: true,
      },
    });
  }
  console.log(`✅ Sample products created`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
