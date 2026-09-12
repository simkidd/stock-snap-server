import 'dotenv/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient, UserRole, ProductStatusEnum } from '../src/generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting StockSnap Nigerian Retail POS database seeding...');

  // 1. Clean existing data in logical order (if any)
  try {
    await prisma.paymentTransaction.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sales.deleteMany();
    await prisma.registerSession.deleteMany();
    await prisma.register.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.discount.deleteMany();
    await prisma.auth.deleteMany();
    await prisma.user.deleteMany();
    await prisma.store.deleteMany();
    await prisma.tenant.deleteMany();
  } catch (e) {
    console.log('Tables may already be empty, proceeding...');
  }

  // 2. Create Tenant (Port Harcourt, Rivers State)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'StockSnap Supermarket Ltd',
      slug: 'stocksnap-ph',
      currency: 'NGN',
      phone: '+234 803 123 4567',
      email: 'contact@stocksnap.ng',
      address: 'Plot 12, Peter Odili Road, Trans-Amadi',
      city: 'Port Harcourt',
      state: 'Rivers State',
      country: 'Nigeria',
      cacNumber: 'RC-1892842',
      vatTIN: 'TIN-28492019-0001',
    },
  });
  console.log(`✅ Created Tenant: ${tenant.name} (${tenant.city}, ${tenant.state})`);

  // 3. Create Main Store Branch
  const store = await prisma.store.create({
    data: {
      tenantId: tenant.id,
      name: 'Peter Odili Main Branch',
      slug: 'peter-odili-branch',
      address: 'Plot 12, Peter Odili Road, Trans-Amadi',
      city: 'Port Harcourt',
      state: 'Rivers State',
      phone: '+234 803 123 4567',
      receiptHeader:
        'STOCKSNAP SUPERMARKET\nPlot 12, Peter Odili Road, Port Harcourt\nTel: +234 803 123 4567 | TIN: 28492019-0001',
      receiptFooter:
        'No refund of money after payment.\nGoods in good condition can be exchanged within 48 hours.\nThank you for your patronage!',
      defaultVatRate: 7.5,
      isMainStore: true,
    },
  });
  console.log(`✅ Created Store: ${store.name}`);

  // 4. Create Registers (Checkout Desks)
  const reg1 = await prisma.register.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      name: 'Counter 1 (Main Cashier)',
      code: 'REG-01',
    },
  });
  const reg2 = await prisma.register.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      name: 'Counter 2 (Fast Lane)',
      code: 'REG-02',
    },
  });
  console.log(`✅ Created Registers: ${reg1.code}, ${reg2.code}`);

  // 5. Create Staff Accounts with Passwords and 4-digit PINs in dedicated Auth model
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPinHash = await bcrypt.hash('1234', 10);
  const managerPinHash = await bcrypt.hash('9999', 10);
  const cashierPinHash = await bcrypt.hash('0000', 10);

  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      firstName: 'Chidi',
      middleName: 'Ike',
      lastName: 'Amadi',
      email: 'admin@stocksnap.ng',
      role: UserRole.ADMIN,
      gender: 'Male',
      phoneNumber: '+234 803 000 0001',
      auth: {
        create: {
          password: passwordHash,
          pinCode: adminPinHash,
          isEmailVerified: true,
        },
      },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      firstName: 'Tamuno',
      middleName: null,
      lastName: 'Briggs',
      email: 'manager@stocksnap.ng',
      role: UserRole.STORE_MANAGER,
      gender: 'Male',
      phoneNumber: '+234 803 000 0002',
      auth: {
        create: {
          password: passwordHash,
          pinCode: managerPinHash,
          isEmailVerified: true,
        },
      },
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      firstName: 'Blessing',
      middleName: 'Ada',
      lastName: 'Jumbo',
      email: 'cashier@stocksnap.ng',
      role: UserRole.CASHIER,
      gender: 'Female',
      phoneNumber: '+234 803 000 0003',
      auth: {
        create: {
          password: passwordHash,
          pinCode: cashierPinHash,
          isEmailVerified: true,
        },
      },
    },
  });
  console.log(`✅ Created Staff: Admin (${adminUser.email}), Manager (${managerUser.email}), Cashier (${cashierUser.email})`);

  // 6. Categories & Subcategories (Unified Self-referential Category Model)
  const catGroceries = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Groceries & Foods',
      slug: 'groceries-foods',
    },
  });

  const catBeverages = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Drinks & Beverages',
      slug: 'drinks-beverages',
    },
  });

  const catToiletries = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Toiletries & Household',
      slug: 'toiletries-household',
    },
  });

  const subPackaged = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Packaged Foods & Cereals',
      slug: 'packaged-foods',
      parentId: catGroceries.id,
    },
  });

  const subSoftDrinks = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Soft Drinks & Water',
      slug: 'soft-drinks',
      parentId: catBeverages.id,
    },
  });

  const subHygiene = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Personal Hygiene & Soap',
      slug: 'personal-hygiene',
      parentId: catToiletries.id,
    },
  });

  // 7. Brands
  const brandNestle = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'Nestle', slug: 'nestle' },
  });
  const brandFriesland = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'FrieslandCampina Peak', slug: 'peak' },
  });
  const brandDufil = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'Dufil Prima (Indomie)', slug: 'indomie' },
  });
  const brandCocaCola = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'Coca-Cola NBC', slug: 'coca-cola' },
  });
  const brandReckitt = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'Reckitt (Dettol)', slug: 'dettol' },
  });

  // 8. Products with Barcodes, Naira Cost/Selling Prices, Break-Bulk
  const productsData = [
    {
      sku: 'SKU-GM-1KG',
      barcode: '8901030382910',
      name: 'Golden Morn Cereal 1kg',
      slug: 'golden-morn-cereal-1kg',
      costPrice: 3800,
      price: 4500,
      quantity: 45,
      minimumQuantity: 10,
      unit: 'Pack',
      piecesPerPack: 1,
      categoryId: subPackaged.id,
      brandId: brandNestle.id,
      addedById: adminUser.id,
      tags: ['breakfast', 'cereal', 'nestle'],
      description: 'Nestle Golden Morn Maize & Soya Protein Cereal 1kg',
    },
    {
      sku: 'SKU-PEAK-150G',
      barcode: '6151100010101',
      name: 'Peak Evaporated Milk Tin 150g',
      slug: 'peak-evaporated-milk-150g',
      costPrice: 650,
      price: 800,
      quantity: 120,
      minimumQuantity: 24,
      unit: 'Tin',
      piecesPerPack: 1,
      categoryId: subPackaged.id,
      brandId: brandFriesland.id,
      addedById: adminUser.id,
      tags: ['dairy', 'milk', 'breakfast'],
      description: 'Peak Full Cream Evaporated Milk 150g Tin',
    },
    {
      sku: 'SKU-INDO-CTN-40',
      barcode: '8992388112345',
      name: 'Indomie Super Pack 120g (Carton of 40)',
      slug: 'indomie-super-pack-carton',
      costPrice: 14000,
      price: 16000,
      quantity: 25,
      minimumQuantity: 5,
      unit: 'Carton',
      piecesPerPack: 40,
      categoryId: subPackaged.id,
      brandId: brandDufil.id,
      addedById: adminUser.id,
      tags: ['noodles', 'carton', 'wholesale'],
      description: 'Indomie Instant Noodles Super Pack Onion Chicken Flavour 40x120g Carton',
    },
    {
      sku: 'SKU-INDO-SGL-120',
      barcode: '8992388112346',
      name: 'Indomie Super Pack 120g (Single Piece)',
      slug: 'indomie-super-pack-single',
      costPrice: 350,
      price: 450,
      quantity: 180,
      minimumQuantity: 40,
      unit: 'Piece',
      piecesPerPack: 1,
      categoryId: subPackaged.id,
      brandId: brandDufil.id,
      addedById: adminUser.id,
      tags: ['noodles', 'single', 'retail'],
      description: 'Indomie Instant Noodles Super Pack Onion Chicken Flavour 120g Single',
    },
    {
      sku: 'SKU-COKE-50CL',
      barcode: '5449000000996',
      name: 'Coca-Cola Pet Bottle 50cl',
      slug: 'coca-cola-pet-50cl',
      costPrice: 320,
      price: 400,
      quantity: 96,
      minimumQuantity: 24,
      unit: 'Bottle',
      piecesPerPack: 1,
      categoryId: subSoftDrinks.id,
      brandId: brandCocaCola.id,
      addedById: adminUser.id,
      tags: ['drink', 'soda', 'coke'],
      description: 'Refreshing Coca-Cola Original Taste 50cl Pet Bottle',
    },
    {
      sku: 'SKU-EVA-75CL',
      barcode: '6151100020202',
      name: 'Eva Premium Table Water 75cl',
      slug: 'eva-table-water-75cl',
      costPrice: 200,
      price: 300,
      quantity: 150,
      minimumQuantity: 30,
      unit: 'Bottle',
      piecesPerPack: 1,
      categoryId: subSoftDrinks.id,
      brandId: brandCocaCola.id,
      addedById: adminUser.id,
      tags: ['water', 'hydration', 'drinks'],
      description: 'Eva Pure Drinking Table Water 75cl Bottle',
    },
    {
      sku: 'SKU-DETTOL-250ML',
      barcode: '5000158068995',
      name: 'Dettol Antiseptic Disinfectant Liquid 250ml',
      slug: 'dettol-antiseptic-liquid-250ml',
      costPrice: 2200,
      price: 2800,
      quantity: 35,
      minimumQuantity: 8,
      unit: 'Bottle',
      piecesPerPack: 1,
      categoryId: subHygiene.id,
      brandId: brandReckitt.id,
      addedById: adminUser.id,
      tags: ['antiseptic', 'hygiene', 'dettol'],
      description: 'Dettol Original Disinfectant Liquid 250ml',
    },
  ];

  for (const prod of productsData) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        slug: prod.slug,
        costPrice: prod.costPrice,
        price: prod.price,
        quantity: prod.quantity,
        minimumQuantity: prod.minimumQuantity,
        unit: prod.unit,
        piecesPerPack: prod.piecesPerPack,
        categoryId: prod.categoryId,
        brandId: prod.brandId,
        addedById: prod.addedById,
        tags: prod.tags,
        description: prod.description,
        status: ProductStatusEnum.AVAILABLE,
      },
    });
  }
  console.log(`✅ Seeded ${productsData.length} retail products with Nigerian Naira (₦) pricing and barcodes.`);

  // 9. Customers (Loyal Customer with Credit & Phone lookup)
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Chief Emeka Okoye',
      phoneNumber: '08035551234',
      email: 'emeka.okoye@gmail.com',
      address: 'Plot 4, Old GRA, Port Harcourt',
      storeCreditBalance: 1500, // ₦1,500 stored balance from previous change
      totalDebt: 0,
      debtLimit: 50000,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Dr. (Mrs) Nnenna George',
      phoneNumber: '08023334567',
      email: 'nnenna.george@unport.edu.ng',
      address: 'Choba, Port Harcourt',
      storeCreditBalance: 0,
      totalDebt: 0,
      debtLimit: 100000,
    },
  });
  console.log(`✅ Seeded Customers: ${customer1.name} (${customer1.phoneNumber}), ${customer2.name}`);

  console.log('\n🎉 StockSnap POS Nigerian Retail Database Seeding completed successfully!');
  console.log('-------------------------------------------------------------------------');
  console.log('Tenant: StockSnap Supermarket Ltd (Port Harcourt, Rivers State)');
  console.log('Login Credentials:');
  console.log('  👑 Admin:   admin@stocksnap.ng   | Password: Password123! | PIN: 1234');
  console.log('  👔 Manager: manager@stocksnap.ng | Password: Password123! | PIN: 9999');
  console.log('  🛒 Cashier: cashier@stocksnap.ng | Password: Password123! | PIN: 0000');
  console.log('-------------------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
